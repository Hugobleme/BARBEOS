-- =========================================
-- Etapa 1: Fidelidade & Retenção (Loyalty)
-- =========================================

-- Saldo agregado por cliente/barbearia
CREATE TABLE public.loyalty_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  lifetime_points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (barbershop_id, customer_id)
);

CREATE INDEX idx_loyalty_balances_customer ON public.loyalty_balances(customer_id);

ALTER TABLE public.loyalty_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY lb_customer_read ON public.loyalty_balances
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM customers c WHERE c.id = loyalty_balances.customer_id AND c.profile_id = auth.uid())
  );

CREATE POLICY lb_staff_all ON public.loyalty_balances
  FOR ALL USING (is_barbershop_staff(auth.uid(), barbershop_id))
  WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

CREATE TRIGGER tg_lb_updated_at BEFORE UPDATE ON public.loyalty_balances
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Extrato de pontos
CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('earn','redeem','adjust','expire')),
  points integer NOT NULL,
  amount_reference numeric NOT NULL DEFAULT 0,
  description text,
  appointment_id uuid,
  transaction_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loyalty_tx_customer ON public.loyalty_transactions(customer_id, created_at DESC);
CREATE INDEX idx_loyalty_tx_appt ON public.loyalty_transactions(appointment_id);
CREATE INDEX idx_loyalty_tx_trx ON public.loyalty_transactions(transaction_id);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY lt_customer_read ON public.loyalty_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM customers c WHERE c.id = loyalty_transactions.customer_id AND c.profile_id = auth.uid())
  );

CREATE POLICY lt_staff_all ON public.loyalty_transactions
  FOR ALL USING (is_barbershop_staff(auth.uid(), barbershop_id))
  WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

-- Função utilitária para creditar pontos (uso interno em triggers e RPCs)
CREATE OR REPLACE FUNCTION public.credit_loyalty_points(
  _barbershop_id uuid,
  _customer_id uuid,
  _amount numeric,
  _description text,
  _appointment_id uuid DEFAULT NULL,
  _transaction_id uuid DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rate numeric;
  _enabled boolean;
  _points integer;
BEGIN
  IF _customer_id IS NULL OR _amount IS NULL OR _amount <= 0 THEN
    RETURN 0;
  END IF;

  SELECT
    COALESCE((settings->'loyalty'->>'enabled')::boolean, false),
    COALESCE((settings->'loyalty'->>'points_per_real')::numeric, 0)
  INTO _enabled, _rate
  FROM public.barbershops WHERE id = _barbershop_id;

  IF NOT _enabled OR _rate <= 0 THEN
    RETURN 0;
  END IF;

  _points := floor(_amount * _rate);
  IF _points <= 0 THEN RETURN 0; END IF;

  INSERT INTO public.loyalty_balances (barbershop_id, customer_id, points, lifetime_points)
  VALUES (_barbershop_id, _customer_id, _points, _points)
  ON CONFLICT (barbershop_id, customer_id) DO UPDATE
    SET points = loyalty_balances.points + EXCLUDED.points,
        lifetime_points = loyalty_balances.lifetime_points + EXCLUDED.points,
        updated_at = now();

  INSERT INTO public.loyalty_transactions
    (barbershop_id, customer_id, kind, points, amount_reference, description, appointment_id, transaction_id)
  VALUES
    (_barbershop_id, _customer_id, 'earn', _points, _amount, _description, _appointment_id, _transaction_id);

  RETURN _points;
END;
$$;

-- Trigger: agendamento concluído credita pontos
CREATE OR REPLACE FUNCTION public.tg_loyalty_on_appointment_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _has_pdv boolean;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- evita pontuar duas vezes se já existe venda do PDV vinculada
    SELECT EXISTS (
      SELECT 1 FROM public.cash_transactions
      WHERE appointment_id = NEW.id AND kind = 'sale' AND customer_id IS NOT NULL
    ) INTO _has_pdv;

    IF NOT _has_pdv THEN
      PERFORM public.credit_loyalty_points(
        NEW.barbershop_id,
        NEW.customer_id,
        NEW.total_amount,
        'Agendamento concluído',
        NEW.id,
        NULL
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_loyalty_on_appointment_completed
AFTER UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.tg_loyalty_on_appointment_completed();

-- Trigger: venda PDV credita pontos
CREATE OR REPLACE FUNCTION public.tg_loyalty_on_pdv_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.kind = 'sale' AND NEW.customer_id IS NOT NULL AND NEW.amount > 0 THEN
    PERFORM public.credit_loyalty_points(
      NEW.barbershop_id,
      NEW.customer_id,
      NEW.amount,
      COALESCE(NEW.description, 'Venda PDV'),
      NEW.appointment_id,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_loyalty_on_pdv_sale
AFTER INSERT ON public.cash_transactions
FOR EACH ROW EXECUTE FUNCTION public.tg_loyalty_on_pdv_sale();

-- RPC: staff resgata pontos do cliente
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(
  _barbershop_id uuid,
  _customer_id uuid,
  _points integer,
  _description text DEFAULT 'Resgate manual'
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current integer;
BEGIN
  IF NOT is_barbershop_staff(auth.uid(), _barbershop_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _points <= 0 THEN RAISE EXCEPTION 'invalid points'; END IF;

  SELECT points INTO _current FROM public.loyalty_balances
   WHERE barbershop_id = _barbershop_id AND customer_id = _customer_id FOR UPDATE;

  IF _current IS NULL OR _current < _points THEN
    RAISE EXCEPTION 'insufficient points';
  END IF;

  UPDATE public.loyalty_balances
     SET points = points - _points, updated_at = now()
   WHERE barbershop_id = _barbershop_id AND customer_id = _customer_id;

  INSERT INTO public.loyalty_transactions
    (barbershop_id, customer_id, kind, points, amount_reference, description, created_by)
  VALUES
    (_barbershop_id, _customer_id, 'redeem', -_points, 0, _description, auth.uid());

  RETURN _current - _points;
END;
$$;
