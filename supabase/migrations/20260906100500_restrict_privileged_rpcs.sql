-- Migration: Restrict Privileged RPC Execution and Fix Mutable Search Paths
-- Timestamp: 2026-09-06 10:05:00
-- Purpose: 
--   1. Revoke public/anon execute on sensitive financial, loyalty, and trigger functions.
--   2. Explicitly set fixed search_path = public, pg_temp on all SECURITY DEFINER functions.
--   3. Enforce strict auth.uid() and role checks on financial/loyalty mutations.
--   4. Preserve public customer booking availability via hardened get_public_appointments.
--   5. Alter default schema privileges to prevent future functions from being publicly exposed.

-- ============================================================
-- 1. TRIGGER-ONLY FUNCTIONS: REVOKE EXECUTE FROM PUBLIC, ANON, AUTHENTICATED
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.fn_loyalty_on_appointment_completed() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.fn_loyalty_on_appointment_completed() SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.fn_loyalty_on_pdv_sale() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.fn_loyalty_on_pdv_sale() SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.fn_wallet_on_appointment_completed() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.fn_wallet_on_appointment_completed() SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.fn_wallet_on_pdv_sale() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.fn_wallet_on_pdv_sale() SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.tg_loyalty_on_appointment_completed() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.tg_loyalty_on_appointment_completed() SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.tg_loyalty_on_pdv_sale() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.tg_loyalty_on_pdv_sale() SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.tg_wallet_on_appointment_completed() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.tg_wallet_on_appointment_completed() SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.tg_wallet_on_pdv_sale() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.tg_wallet_on_pdv_sale() SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;

-- ============================================================
-- 2. ADMINISTRATIVE EVENT TRIGGER: RLS_AUTO_ENABLE
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.rls_auto_enable() SET search_path = pg_catalog;

-- ============================================================
-- 3. INTERNAL TRIGGER-CALLED REWARD ENGINE FUNCTIONS
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.credit_loyalty_points(uuid, uuid, numeric, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.credit_loyalty_points(uuid, uuid, numeric, text, uuid, uuid) SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.credit_wallet_cashback(uuid, uuid, numeric, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.credit_wallet_cashback(uuid, uuid, numeric, text, uuid, uuid) SET search_path = public, pg_temp;

-- ============================================================
-- 4. INTERNAL ROLE CHECK HELPERS: FIXED SEARCH PATH
-- ============================================================

ALTER FUNCTION public.has_barbershop_role(uuid, uuid, app_role) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_barbershop_member(uuid, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_barbershop_staff(uuid, uuid) SET search_path = public, pg_temp;

-- ============================================================
-- 5. PUBLIC AVAILABILITY: GET_PUBLIC_APPOINTMENTS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_public_appointments(p_barbershop_id uuid, p_date date)
 RETURNS TABLE(id uuid, professional_id uuid, scheduled_start timestamp with time zone, scheduled_end timestamp with time zone, status appointment_status)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
  SELECT a.id, a.professional_id, a.scheduled_start, a.scheduled_end, a.status
  FROM public.appointments a
  WHERE a.barbershop_id = p_barbershop_id
    AND DATE(a.scheduled_start AT TIME ZONE 'UTC') = p_date
    AND a.status IN ('scheduled', 'in_progress')
    AND p_date BETWEEN (CURRENT_DATE - INTERVAL '7 days')::date AND (CURRENT_DATE + INTERVAL '180 days')::date;
$$;

REVOKE ALL ON FUNCTION public.get_public_appointments(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_appointments(uuid, date) TO anon, authenticated;

-- ============================================================
-- 6. FINANCIAL & LOYALTY MUTATIONS: HARDENED FUNCTIONS
-- ============================================================

-- 6.1 wallet_credit
CREATE OR REPLACE FUNCTION public.wallet_credit(p_customer_id uuid, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
DECLARE
    v_barbershop_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: usuário não autenticado';
    END IF;
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Valor inválido para crédito';
    END IF;

    SELECT barbershop_id INTO v_barbershop_id FROM public.customers WHERE id = p_customer_id;
    IF v_barbershop_id IS NULL THEN
        RAISE EXCEPTION 'Cliente não encontrado';
    END IF;

    IF NOT is_barbershop_staff(auth.uid(), v_barbershop_id) THEN
        RAISE EXCEPTION 'Acesso negado: apenas staff da barbearia pode creditar a carteira do cliente';
    END IF;

    INSERT INTO public.wallet_balances (barbershop_id, customer_id, balance, lifetime_credited)
    VALUES (v_barbershop_id, p_customer_id, p_amount, p_amount)
    ON CONFLICT (barbershop_id, customer_id) DO UPDATE
      SET balance = wallet_balances.balance + EXCLUDED.balance,
          lifetime_credited = wallet_balances.lifetime_credited + EXCLUDED.balance,
          updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.wallet_credit(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wallet_credit(uuid, numeric) TO authenticated;

-- 6.2 wallet_debit
CREATE OR REPLACE FUNCTION public.wallet_debit(p_customer_id uuid, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
DECLARE
    v_barbershop_id UUID;
    v_current_balance NUMERIC;
    v_is_customer BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: usuário não autenticado';
    END IF;
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Valor inválido para débito';
    END IF;

    SELECT barbershop_id INTO v_barbershop_id FROM public.customers WHERE id = p_customer_id;
    IF v_barbershop_id IS NULL THEN
        RAISE EXCEPTION 'Cliente não encontrado';
    END IF;

    v_is_customer := EXISTS (SELECT 1 FROM public.customers WHERE id = p_customer_id AND profile_id = auth.uid());
    IF NOT is_barbershop_staff(auth.uid(), v_barbershop_id) AND NOT v_is_customer THEN
        RAISE EXCEPTION 'Acesso negado: não autorizado a debitar esta carteira';
    END IF;

    SELECT balance INTO v_current_balance 
    FROM public.wallet_balances 
    WHERE customer_id = p_customer_id AND barbershop_id = v_barbershop_id 
    FOR UPDATE;
    
    IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Saldo insuficiente na carteira';
    END IF;

    UPDATE public.wallet_balances 
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE customer_id = p_customer_id AND barbershop_id = v_barbershop_id;
END;
$$;

REVOKE ALL ON FUNCTION public.wallet_debit(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wallet_debit(uuid, numeric) TO authenticated;

-- 6.3 loyalty_adjust
CREATE OR REPLACE FUNCTION public.loyalty_adjust(p_customer_id uuid, p_points integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
DECLARE
    v_barbershop_id UUID;
    v_current_points INT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: usuário não autenticado';
    END IF;

    SELECT barbershop_id INTO v_barbershop_id FROM public.customers WHERE id = p_customer_id;
    IF v_barbershop_id IS NULL THEN
        RAISE EXCEPTION 'Cliente não encontrado';
    END IF;

    IF NOT is_barbershop_staff(auth.uid(), v_barbershop_id) THEN
        RAISE EXCEPTION 'Acesso negado: apenas staff da barbearia pode ajustar pontos de fidelidade';
    END IF;

    SELECT points INTO v_current_points 
    FROM public.loyalty_balances 
    WHERE customer_id = p_customer_id AND barbershop_id = v_barbershop_id 
    FOR UPDATE;
    
    IF v_current_points IS NULL THEN
        v_current_points := 0;
    END IF;

    IF (v_current_points + p_points) < 0 THEN
        RAISE EXCEPTION 'Pontos insuficientes: o saldo não pode ficar negativo';
    END IF;

    INSERT INTO public.loyalty_balances (barbershop_id, customer_id, points, lifetime_points)
    VALUES (v_barbershop_id, p_customer_id, GREATEST(p_points, 0), GREATEST(p_points, 0))
    ON CONFLICT (barbershop_id, customer_id) DO UPDATE
      SET points = loyalty_balances.points + EXCLUDED.points,
          lifetime_points = CASE WHEN p_points > 0 THEN loyalty_balances.lifetime_points + p_points ELSE loyalty_balances.lifetime_points END,
          updated_at = NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.loyalty_adjust(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loyalty_adjust(uuid, integer) TO authenticated;

-- 6.4 credit_wallet_manual (4 args)
ALTER FUNCTION public.credit_wallet_manual(uuid, uuid, numeric, text) SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.credit_wallet_manual(uuid, uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.credit_wallet_manual(uuid, uuid, numeric, text) TO authenticated;

-- 6.5 credit_wallet_manual (5 args)
CREATE OR REPLACE FUNCTION public.credit_wallet_manual(p_customer_id uuid, p_barbershop_id uuid, p_amount numeric, p_description text, p_created_by uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
DECLARE
  v_transaction_id UUID;
  v_customer_shop_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado';
  END IF;

  IF NOT is_barbershop_staff(auth.uid(), p_barbershop_id) THEN
    RAISE EXCEPTION 'Acesso negado: apenas equipe da barbearia pode creditar saldo manual';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor de crédito inválido';
  END IF;

  SELECT barbershop_id INTO v_customer_shop_id FROM public.customers WHERE id = p_customer_id;
  IF v_customer_shop_id IS NULL OR v_customer_shop_id != p_barbershop_id THEN
    RAISE EXCEPTION 'Cliente não pertence a esta barbearia';
  END IF;

  INSERT INTO public.wallet_balances (barbershop_id, customer_id, balance, lifetime_credited)
  VALUES (p_barbershop_id, p_customer_id, p_amount, p_amount)
  ON CONFLICT (barbershop_id, customer_id) DO UPDATE
    SET balance = wallet_balances.balance + EXCLUDED.balance,
        lifetime_credited = wallet_balances.lifetime_credited + EXCLUDED.balance,
        updated_at = now();

  INSERT INTO public.wallet_transactions (customer_id, barbershop_id, kind, amount, description, created_by)
  VALUES (p_customer_id, p_barbershop_id, 'credit', p_amount, COALESCE(p_description, 'Crédito manual'), auth.uid())
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_transaction_id);
END;
$$;

REVOKE ALL ON FUNCTION public.credit_wallet_manual(uuid, uuid, numeric, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.credit_wallet_manual(uuid, uuid, numeric, text, uuid) TO authenticated;

-- 6.6 redeem_wallet (6 args)
ALTER FUNCTION public.redeem_wallet(uuid, uuid, numeric, text, uuid, uuid) SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.redeem_wallet(uuid, uuid, numeric, text, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_wallet(uuid, uuid, numeric, text, uuid, uuid) TO authenticated;

-- 6.7 redeem_wallet (4 args)
CREATE OR REPLACE FUNCTION public.redeem_wallet(p_customer_id uuid, p_barbershop_id uuid, p_amount_to_redeem numeric, p_created_by uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
DECLARE
  v_balance DECIMAL;
  v_transaction_id UUID;
  v_customer_shop_id UUID;
  v_is_customer BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado';
  END IF;

  IF p_amount_to_redeem IS NULL OR p_amount_to_redeem <= 0 THEN
    RAISE EXCEPTION 'Valor de resgate inválido';
  END IF;

  SELECT barbershop_id INTO v_customer_shop_id FROM public.customers WHERE id = p_customer_id;
  IF v_customer_shop_id IS NULL OR v_customer_shop_id != p_barbershop_id THEN
    RAISE EXCEPTION 'Cliente não pertence a esta barbearia';
  END IF;

  v_is_customer := EXISTS (SELECT 1 FROM public.customers WHERE id = p_customer_id AND profile_id = auth.uid());
  IF NOT is_barbershop_staff(auth.uid(), p_barbershop_id) AND NOT v_is_customer THEN
    RAISE EXCEPTION 'Acesso negado: não autorizado a resgatar saldo desta carteira';
  END IF;

  SELECT balance INTO v_balance FROM public.wallet_balances 
  WHERE customer_id = p_customer_id AND barbershop_id = p_barbershop_id
  FOR UPDATE;
  
  IF v_balance IS NULL OR v_balance < p_amount_to_redeem THEN
    RAISE EXCEPTION 'Saldo em carteira insuficiente';
  END IF;

  UPDATE public.wallet_balances
  SET balance = balance - p_amount_to_redeem,
      updated_at = NOW()
  WHERE customer_id = p_customer_id AND barbershop_id = p_barbershop_id;

  INSERT INTO public.wallet_transactions (customer_id, barbershop_id, kind, amount, description, created_by)
  VALUES (p_customer_id, p_barbershop_id, 'redemption', p_amount_to_redeem * -1, 'Uso de crédito em carteira', auth.uid())
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_transaction_id);
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_wallet(uuid, uuid, numeric, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_wallet(uuid, uuid, numeric, uuid) TO authenticated;

-- 6.8 redeem_loyalty_points (4 args - Overload 1)
ALTER FUNCTION public.redeem_loyalty_points(uuid, uuid, integer, text) SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.redeem_loyalty_points(uuid, uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_points(uuid, uuid, integer, text) TO authenticated;

-- 6.9 redeem_loyalty_points (4 args - Overload 2)
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(p_customer_id uuid, p_barbershop_id uuid, p_points_to_redeem integer, p_created_by uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
DECLARE
  v_balance INTEGER;
  v_transaction_id UUID;
  v_customer_shop_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado';
  END IF;

  IF NOT is_barbershop_staff(auth.uid(), p_barbershop_id) THEN
    RAISE EXCEPTION 'Acesso negado: apenas equipe da barbearia pode resgatar pontos de fidelidade';
  END IF;

  IF p_points_to_redeem IS NULL OR p_points_to_redeem <= 0 THEN
    RAISE EXCEPTION 'Quantidade de pontos inválida';
  END IF;

  SELECT barbershop_id INTO v_customer_shop_id FROM public.customers WHERE id = p_customer_id;
  IF v_customer_shop_id IS NULL OR v_customer_shop_id != p_barbershop_id THEN
    RAISE EXCEPTION 'Cliente não pertence a esta barbearia';
  END IF;

  SELECT points INTO v_balance FROM public.loyalty_balances 
  WHERE customer_id = p_customer_id AND barbershop_id = p_barbershop_id
  FOR UPDATE;
  
  IF v_balance IS NULL OR v_balance < p_points_to_redeem THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;

  UPDATE public.loyalty_balances
  SET points = points - p_points_to_redeem,
      updated_at = NOW()
  WHERE customer_id = p_customer_id AND barbershop_id = p_barbershop_id;

  INSERT INTO public.loyalty_transactions (customer_id, barbershop_id, kind, points, description, created_by)
  VALUES (p_customer_id, p_barbershop_id, 'redemption', p_points_to_redeem * -1, 'Resgate manual de pontos', auth.uid())
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_transaction_id);
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_loyalty_points(uuid, uuid, integer, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_points(uuid, uuid, integer, uuid) TO authenticated;

-- ============================================================
-- 7. DEFAULT PRIVILEGES: PREVENT AUTOMATIC EXPOSURE TO PUBLIC/ANON
-- ============================================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
