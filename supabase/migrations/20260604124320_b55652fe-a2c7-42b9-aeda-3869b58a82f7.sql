-- 1. SEGURANÇA: Garantir que RLS está ativado em todas as tabelas
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    END LOOP;
END $$;

-- 2. SEGURANÇA: Limpeza de políticas redundantes ou excessivamente permissivas (se houver)
-- (O linter apontou políticas problemáticas, vamos recriar as essenciais com foco em multi-tenancy)

-- BARBERSHOPS
DROP POLICY IF EXISTS "barbershops_public_read" ON public.barbershops;
CREATE POLICY "barbershops_public_read" ON public.barbershops
FOR SELECT TO public
USING (active = true OR is_barbershop_member(auth.uid(), id));

-- APPOINTMENTS (Proteção de dados de agendamento)
DROP POLICY IF EXISTS "appt_staff_read" ON public.appointments;
CREATE POLICY "appt_staff_read" ON public.appointments
FOR SELECT TO authenticated
USING (
  is_barbershop_staff(auth.uid(), barbershop_id) 
  OR 
  (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = appointments.customer_id AND c.profile_id = auth.uid()))
);

-- CUSTOMERS (Proteção de dados de clientes)
DROP POLICY IF EXISTS "customers_staff_read" ON public.customers;
CREATE POLICY "customers_staff_read" ON public.customers
FOR SELECT TO authenticated
USING (
  is_barbershop_staff(auth.uid(), barbershop_id) 
  OR 
  (profile_id = auth.uid())
);

-- CASH_TRANSACTIONS (Extremamente sensível: financeiro)
DROP POLICY IF EXISTS "ctx_staff_all" ON public.cash_transactions;
CREATE POLICY "ctx_staff_read" ON public.cash_transactions
FOR SELECT TO authenticated
USING (is_barbershop_staff(auth.uid(), barbershop_id));

CREATE POLICY "ctx_staff_insert" ON public.cash_transactions
FOR INSERT TO authenticated
WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

-- COMMISSIONS
DROP POLICY IF EXISTS "comm_pro_read" ON public.commissions;
CREATE POLICY "comm_pro_read" ON public.commissions
FOR SELECT TO authenticated
USING (
  has_barbershop_role(auth.uid(), barbershop_id, 'owner')
  OR
  (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = commissions.professional_id AND p.profile_id = auth.uid()))
);

-- 3. OTIMIZAÇÃO: Índices para performance em queries multi-tenant e buscas frequentes
CREATE INDEX IF NOT EXISTS idx_barbershop_members_profile_id ON public.barbershop_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_professionals_profile_id ON public.professionals(profile_id);
CREATE INDEX IF NOT EXISTS idx_customers_profile_id ON public.customers(profile_id);
CREATE INDEX IF NOT EXISTS idx_customers_barbershop_id ON public.customers(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_session_id ON public.cash_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_kind ON public.cash_transactions(kind);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer_id ON public.loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_customer_id ON public.wallet_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);

-- 4. SEGURANÇA: Proteção de Funções (SECURITY DEFINER e search_path)
ALTER FUNCTION public.is_barbershop_member(UUID, UUID) SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.is_barbershop_staff(UUID, UUID) SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.has_barbershop_role(UUID, UUID, app_role) SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.credit_loyalty_points(UUID, UUID, numeric, text, UUID, UUID) SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.credit_wallet_cashback(UUID, UUID, numeric, text, UUID, UUID) SECURITY DEFINER SET search_path = public;

-- Revogar execução pública de funções internas sensíveis
REVOKE EXECUTE ON FUNCTION public.credit_loyalty_points(UUID, UUID, numeric, text, UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.credit_wallet_cashback(UUID, UUID, numeric, text, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credit_loyalty_points(UUID, UUID, numeric, text, UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_wallet_cashback(UUID, UUID, numeric, text, UUID, UUID) TO service_role;

-- 5. CONSISTÊNCIA: Constraints de Integridade
-- Garantir que valores monetários e pontos não sejam negativos onde não devem
ALTER TABLE public.loyalty_balances ADD CONSTRAINT loyalty_points_non_negative CHECK (points >= 0);
ALTER TABLE public.wallet_balances ADD CONSTRAINT wallet_balance_non_negative CHECK (balance >= 0);
ALTER TABLE public.products ADD CONSTRAINT product_price_non_negative CHECK (price >= 0);
ALTER TABLE public.products ADD CONSTRAINT product_stock_non_negative CHECK (stock_qty >= 0);

-- Garantir GRANTs para que o PostgREST funcione corretamente com as novas permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
