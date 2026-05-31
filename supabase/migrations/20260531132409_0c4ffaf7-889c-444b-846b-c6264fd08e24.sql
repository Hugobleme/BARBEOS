-- 1. Fix Function Search Path Mutable (Security Best Practice)
-- Setting search_path to public for all project functions

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke public execute on handle_new_user as it's a trigger function
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- 2. Loyalty functions
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(
  p_customer_id UUID,
  p_barbershop_id UUID,
  p_points_to_redeem INTEGER,
  p_created_by UUID
)
RETURNS JSONB AS $$
DECLARE
  v_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  SELECT balance INTO v_balance FROM public.loyalty_balances 
  WHERE customer_id = p_customer_id AND barbershop_id = p_barbershop_id;
  
  IF v_balance IS NULL OR v_balance < p_points_to_redeem THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;

  INSERT INTO public.loyalty_transactions (customer_id, barbershop_id, kind, points, description, created_by)
  VALUES (p_customer_id, p_barbershop_id, 'redemption', p_points_to_redeem * -1, 'Resgate manual de pontos', p_created_by)
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_transaction_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Wallet functions
CREATE OR REPLACE FUNCTION public.redeem_wallet(
  p_customer_id UUID,
  p_barbershop_id UUID,
  p_amount_to_redeem DECIMAL,
  p_created_by UUID
)
RETURNS JSONB AS $$
DECLARE
  v_balance DECIMAL;
  v_transaction_id UUID;
BEGIN
  SELECT balance INTO v_balance FROM public.wallet_balances 
  WHERE customer_id = p_customer_id AND barbershop_id = p_barbershop_id;
  
  IF v_balance IS NULL OR v_balance < p_amount_to_redeem THEN
    RAISE EXCEPTION 'Saldo em carteira insuficiente';
  END IF;

  INSERT INTO public.wallet_transactions (customer_id, barbershop_id, kind, amount, description, created_by)
  VALUES (p_customer_id, p_barbershop_id, 'redemption', p_amount_to_redeem * -1, 'Uso de crédito em carteira', p_created_by)
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_transaction_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.credit_wallet_manual(
  p_customer_id UUID,
  p_barbershop_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_created_by UUID
)
RETURNS JSONB AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  INSERT INTO public.wallet_transactions (customer_id, barbershop_id, kind, amount, description, created_by)
  VALUES (p_customer_id, p_barbershop_id, 'credit', p_amount, p_description, p_created_by)
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_transaction_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger functions for loyalty and wallet
CREATE OR REPLACE FUNCTION public.fn_loyalty_on_appointment_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_points_per_real INTEGER;
  v_settings JSONB;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    SELECT settings INTO v_settings FROM public.barbershops WHERE id = NEW.barbershop_id;
    v_points_per_real := (v_settings->'loyalty'->>'points_per_real')::INTEGER;
    
    IF v_points_per_real > 0 THEN
      INSERT INTO public.loyalty_transactions (customer_id, barbershop_id, kind, points, description, appointment_id)
      VALUES (NEW.customer_id, NEW.barbershop_id, 'earn', (NEW.total_amount * v_points_per_real)::INTEGER, 'Pontos por agendamento', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.fn_loyalty_on_pdv_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_points_per_real INTEGER;
  v_settings JSONB;
BEGIN
  IF NEW.kind = 'sale' THEN
    SELECT settings INTO v_settings FROM public.barbershops WHERE id = NEW.barbershop_id;
    v_points_per_real := (v_settings->'loyalty'->>'points_per_real')::INTEGER;
    
    IF v_points_per_real > 0 THEN
      INSERT INTO public.loyalty_transactions (customer_id, barbershop_id, kind, points, description, transaction_id)
      VALUES (NEW.customer_id, NEW.barbershop_id, 'earn', (NEW.amount * v_points_per_real)::INTEGER, 'Pontos por compra PDV', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.fn_wallet_on_appointment_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_cashback_percent DECIMAL;
  v_settings JSONB;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    SELECT settings INTO v_settings FROM public.barbershops WHERE id = NEW.barbershop_id;
    v_cashback_percent := (v_settings->'cashback'->>'percent')::DECIMAL;
    
    IF v_cashback_percent > 0 THEN
      INSERT INTO public.wallet_transactions (customer_id, barbershop_id, kind, amount, description, appointment_id)
      VALUES (NEW.customer_id, NEW.barbershop_id, 'cashback', (NEW.total_amount * (v_cashback_percent / 100)), 'Cashback por agendamento', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.fn_wallet_on_pdv_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_cashback_percent DECIMAL;
  v_settings JSONB;
BEGIN
  IF NEW.kind = 'sale' AND NEW.customer_id IS NOT NULL THEN
    SELECT settings INTO v_settings FROM public.barbershops WHERE id = NEW.barbershop_id;
    v_cashback_percent := (v_settings->'cashback'->>'percent')::DECIMAL;
    
    IF v_cashback_percent > 0 THEN
      INSERT INTO public.wallet_transactions (customer_id, barbershop_id, kind, amount, description, transaction_id)
      VALUES (NEW.customer_id, NEW.barbershop_id, 'cashback', (NEW.amount * (v_cashback_percent / 100)), 'Cashback por compra PDV', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke public execute on these as they are meant to be used by staff or triggers
REVOKE EXECUTE ON FUNCTION public.redeem_loyalty_points(UUID, UUID, INTEGER, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.redeem_wallet(UUID, UUID, DECIMAL, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.credit_wallet_manual(UUID, UUID, DECIMAL, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_points(UUID, UUID, INTEGER, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_wallet(UUID, UUID, DECIMAL, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.credit_wallet_manual(UUID, UUID, DECIMAL, TEXT, UUID) TO authenticated, service_role;
