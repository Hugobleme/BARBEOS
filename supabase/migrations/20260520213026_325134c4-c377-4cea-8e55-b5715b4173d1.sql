-- =========================================
-- Etapa 2: Carteira de créditos (Cashback)
-- =========================================

CREATE TABLE public.wallet_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  lifetime_credited numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (barbershop_id, customer_id)
);
CREATE INDEX idx_wallet_balances_customer ON public.wallet_balances(customer_id);

ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY wb_customer_read ON public.wallet_balances
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM customers c WHERE c.id = wallet_balances.customer_id AND c.profile_id = auth.uid())
  );
CREATE POLICY wb_staff_all ON public.wallet_balances
  FOR ALL USING (is_barbershop_staff(auth.uid(), barbershop_id))
  WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

CREATE TRIGGER tg_wb_updated_at BEFORE UPDATE ON public.wallet_balances
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('cashback','credit','debit','adjust','expire')),
  amount numeric NOT NULL,
  description text,
  appointment_id uuid,
  transaction_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wallet_tx_customer ON public.wallet_transactions(customer_id, created_at DESC);
CREATE INDEX idx_wallet_tx_appt ON public.wallet_transactions(appointment_id);
CREATE INDEX idx_wallet_tx_trx ON public.wallet_transactions(transaction_id);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY wt_customer_read ON public.wallet_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM customers c WHERE c.id = wallet_transactions.customer_id AND c.profile_id = auth.uid())
  );
CREATE POLICY wt_staff_all ON public.wallet_transactions
  FOR ALL USING (is_barbershop_staff(auth.uid(), barbershop_id))
  WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

-- Crédito de cashback (interno; chamado por triggers)
CREATE OR REPLACE FUNCTION public.credit_wallet_cashback(
  _barbershop_id uuid,
  _customer_id uuid,
  _amount numeric,
  _description text,
  _appointment_id uuid DEFAULT NULL,
  _transaction_id uuid DEFAULT NULL
) RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _enabled boolean;
  _pct numeric;
  _credit numeric;
BEGIN
  IF _customer_id IS NULL OR _amount IS NULL OR _amount <= 0 THEN RETURN 0; END IF;
  SELECT COALESCE((settings->'cashback'->>'enabled')::boolean, false),
         COALESCE((settings->'cashback'->>'percent')::numeric, 0)
    INTO _enabled, _pct
  FROM public.barbershops WHERE id = _barbershop_id;
  IF NOT _enabled OR _pct <= 0 THEN RETURN 0; END IF;
  _credit := round((_amount * _pct / 100.0)::numeric, 2);
  IF _credit <= 0 THEN RETURN 0; END IF;
  INSERT INTO public.wallet_balances (barbershop_id, customer_id, balance, lifetime_credited)
  VALUES (_barbershop_id, _customer_id, _credit, _credit)
  ON CONFLICT (barbershop_id, customer_id) DO UPDATE
    SET balance = wallet_balances.balance + EXCLUDED.balance,
        lifetime_credited = wallet_balances.lifetime_credited + EXCLUDED.balance,
        updated_at = now();
  INSERT INTO public.wallet_transactions (barbershop_id, customer_id, kind, amount, description, appointment_id, transaction_id)
  VALUES (_barbershop_id, _customer_id, 'cashback', _credit, _description, _appointment_id, _transaction_id);
  RETURN _credit;
END;
$$;

-- Trigger: agendamento concluído
CREATE OR REPLACE FUNCTION public.tg_wallet_on_appointment_completed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _has_pdv boolean;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT EXISTS (
      SELECT 1 FROM public.cash_transactions
      WHERE appointment_id = NEW.id AND kind = 'sale' AND customer_id IS NOT NULL
    ) INTO _has_pdv;
    IF NOT _has_pdv THEN
      PERFORM public.credit_wallet_cashback(NEW.barbershop_id, NEW.customer_id, NEW.total_amount, 'Cashback de atendimento', NEW.id, NULL);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_wallet_on_appointment_completed
AFTER UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.tg_wallet_on_appointment_completed();

-- Trigger: venda PDV
CREATE OR REPLACE FUNCTION public.tg_wallet_on_pdv_sale()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.kind = 'sale' AND NEW.customer_id IS NOT NULL AND NEW.amount > 0 THEN
    PERFORM public.credit_wallet_cashback(NEW.barbershop_id, NEW.customer_id, NEW.amount, COALESCE(NEW.description,'Cashback de venda'), NEW.appointment_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_wallet_on_pdv_sale
AFTER INSERT ON public.cash_transactions
FOR EACH ROW EXECUTE FUNCTION public.tg_wallet_on_pdv_sale();

-- RPC: staff resgata/debita créditos
CREATE OR REPLACE FUNCTION public.redeem_wallet(
  _barbershop_id uuid,
  _customer_id uuid,
  _amount numeric,
  _description text DEFAULT 'Uso de crédito',
  _appointment_id uuid DEFAULT NULL,
  _transaction_id uuid DEFAULT NULL
) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _current numeric;
BEGIN
  IF NOT is_barbershop_staff(auth.uid(), _barbershop_id) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  SELECT balance INTO _current FROM public.wallet_balances
   WHERE barbershop_id = _barbershop_id AND customer_id = _customer_id FOR UPDATE;
  IF _current IS NULL OR _current < _amount THEN RAISE EXCEPTION 'insufficient balance'; END IF;
  UPDATE public.wallet_balances SET balance = balance - _amount, updated_at = now()
   WHERE barbershop_id = _barbershop_id AND customer_id = _customer_id;
  INSERT INTO public.wallet_transactions (barbershop_id, customer_id, kind, amount, description, appointment_id, transaction_id, created_by)
  VALUES (_barbershop_id, _customer_id, 'debit', -_amount, _description, _appointment_id, _transaction_id, auth.uid());
  RETURN _current - _amount;
END;
$$;

-- RPC: staff lança crédito manual (cortesia, ajuste)
CREATE OR REPLACE FUNCTION public.credit_wallet_manual(
  _barbershop_id uuid,
  _customer_id uuid,
  _amount numeric,
  _description text DEFAULT 'Crédito manual'
) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_barbershop_staff(auth.uid(), _barbershop_id) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  INSERT INTO public.wallet_balances (barbershop_id, customer_id, balance, lifetime_credited)
  VALUES (_barbershop_id, _customer_id, _amount, _amount)
  ON CONFLICT (barbershop_id, customer_id) DO UPDATE
    SET balance = wallet_balances.balance + EXCLUDED.balance,
        lifetime_credited = wallet_balances.lifetime_credited + EXCLUDED.balance,
        updated_at = now();
  INSERT INTO public.wallet_transactions (barbershop_id, customer_id, kind, amount, description, created_by)
  VALUES (_barbershop_id, _customer_id, 'credit', _amount, _description, auth.uid());
  RETURN _amount;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_wallet_cashback(uuid,uuid,numeric,text,uuid,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.redeem_wallet(uuid,uuid,numeric,text,uuid,uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.credit_wallet_manual(uuid,uuid,numeric,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_wallet(uuid,uuid,numeric,text,uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.credit_wallet_manual(uuid,uuid,numeric,text) TO authenticated;
