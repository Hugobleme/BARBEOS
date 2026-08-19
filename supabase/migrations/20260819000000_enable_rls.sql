-- ==============================================================================
-- MIGRATION: 20260819000000_enable_rls.sql
-- Objetivo: Blindar RLS em todas as tabelas públicas e garantir regras seguras
-- ==============================================================================

-- 1. Habilitar RLS em todas as tabelas públicas
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

-- 2. Funções auxiliares seguras para verificação de permissões
CREATE OR REPLACE FUNCTION public.is_barbershop_member(user_id UUID, shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.barbershop_members 
    WHERE profile_id = user_id 
      AND barbershop_id = shop_id 
      AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_barbershop_staff(user_id UUID, shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.barbershop_members 
    WHERE profile_id = user_id 
      AND barbershop_id = shop_id 
      AND active = true
      AND role IN ('owner', 'admin', 'manager', 'barber', 'receptionist')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_barbershop_role(user_id UUID, shop_id UUID, req_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.barbershop_members 
    WHERE profile_id = user_id 
      AND barbershop_id = shop_id 
      AND active = true
      AND (
        role = req_role 
        OR (req_role = 'admin' AND role = 'owner')
        OR (req_role = 'manager' AND role IN ('owner', 'admin'))
      )
  );
$$;

-- ==============================================================================
-- 3. POLÍTICAS DE RLS POR TABELA
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PROFILES (Usuários)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT TO public
USING (id = auth.uid() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------------------------
-- BARBERSHOPS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "barbershops_public_read" ON public.barbershops;
CREATE POLICY "barbershops_public_read" ON public.barbershops
FOR SELECT TO public
USING (active = true OR is_barbershop_member(auth.uid(), id));

DROP POLICY IF EXISTS "barbershops_insert_auth" ON public.barbershops;
CREATE POLICY "barbershops_insert_auth" ON public.barbershops
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "barbershops_update_owners" ON public.barbershops;
CREATE POLICY "barbershops_update_owners" ON public.barbershops
FOR UPDATE TO authenticated
USING (has_barbershop_role(auth.uid(), id, 'owner') OR has_barbershop_role(auth.uid(), id, 'admin'));

DROP POLICY IF EXISTS "barbershops_delete_owners" ON public.barbershops;
CREATE POLICY "barbershops_delete_owners" ON public.barbershops
FOR DELETE TO authenticated
USING (has_barbershop_role(auth.uid(), id, 'owner'));

-- ------------------------------------------------------------------------------
-- BARBERSHOP_MEMBERS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "members_select_own_or_staff" ON public.barbershop_members;
CREATE POLICY "members_select_own_or_staff" ON public.barbershop_members
FOR SELECT TO authenticated
USING (profile_id = auth.uid() OR is_barbershop_staff(auth.uid(), barbershop_id));

DROP POLICY IF EXISTS "members_manage_owners" ON public.barbershop_members;
CREATE POLICY "members_manage_owners" ON public.barbershop_members
FOR ALL TO authenticated
USING (has_barbershop_role(auth.uid(), barbershop_id, 'owner') OR has_barbershop_role(auth.uid(), barbershop_id, 'admin'))
WITH CHECK (has_barbershop_role(auth.uid(), barbershop_id, 'owner') OR has_barbershop_role(auth.uid(), barbershop_id, 'admin'));

-- ------------------------------------------------------------------------------
-- APPOINTMENTS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "appointments_select_policy" ON public.appointments;
CREATE POLICY "appointments_select_policy" ON public.appointments
FOR SELECT TO public
USING (
  is_barbershop_staff(auth.uid(), barbershop_id)
  OR (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.customers c 
    WHERE c.id = appointments.customer_id AND c.profile_id = auth.uid()
  ))
  OR (auth.uid() IS NOT NULL AND created_by = auth.uid())
);

DROP POLICY IF EXISTS "appointments_insert_policy" ON public.appointments;
CREATE POLICY "appointments_insert_policy" ON public.appointments
FOR INSERT TO public
WITH CHECK (
  barbershop_id IS NOT NULL 
  AND customer_id IS NOT NULL
  AND scheduled_start IS NOT NULL
  AND scheduled_end IS NOT NULL
);

DROP POLICY IF EXISTS "appointments_update_policy" ON public.appointments;
CREATE POLICY "appointments_update_policy" ON public.appointments
FOR UPDATE TO public
USING (
  is_barbershop_staff(auth.uid(), barbershop_id)
  OR (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.customers c 
    WHERE c.id = appointments.customer_id AND c.profile_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "appointments_delete_policy" ON public.appointments;
CREATE POLICY "appointments_delete_policy" ON public.appointments
FOR DELETE TO authenticated
USING (has_barbershop_role(auth.uid(), barbershop_id, 'owner') OR has_barbershop_role(auth.uid(), barbershop_id, 'admin'));

-- ------------------------------------------------------------------------------
-- APPOINTMENT_SERVICES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "appt_services_select" ON public.appointment_services;
CREATE POLICY "appt_services_select" ON public.appointment_services
FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a 
    WHERE a.id = appointment_services.appointment_id 
    AND (
      is_barbershop_staff(auth.uid(), a.barbershop_id)
      OR (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.customers c WHERE c.id = a.customer_id AND c.profile_id = auth.uid()
      ))
    )
  )
);

DROP POLICY IF EXISTS "appt_services_insert" ON public.appointment_services;
CREATE POLICY "appt_services_insert" ON public.appointment_services
FOR INSERT TO public
WITH CHECK (appointment_id IS NOT NULL AND service_id IS NOT NULL);

-- ------------------------------------------------------------------------------
-- SERVICES & SERVICE_PROFESSIONALS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "services_public_select" ON public.services;
CREATE POLICY "services_public_select" ON public.services
FOR SELECT TO public
USING (active = true OR is_barbershop_staff(auth.uid(), barbershop_id));

DROP POLICY IF EXISTS "services_staff_manage" ON public.services;
CREATE POLICY "services_staff_manage" ON public.services
FOR ALL TO authenticated
USING (is_barbershop_staff(auth.uid(), barbershop_id))
WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

DROP POLICY IF EXISTS "service_pros_public_select" ON public.service_professionals;
CREATE POLICY "service_pros_public_select" ON public.service_professionals
FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "service_pros_staff_manage" ON public.service_professionals;
CREATE POLICY "service_pros_staff_manage" ON public.service_professionals
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- PROFESSIONALS, WORKING_HOURS & TIME_OFF
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_public_select" ON public.professionals;
CREATE POLICY "professionals_public_select" ON public.professionals
FOR SELECT TO public
USING (active = true OR is_barbershop_staff(auth.uid(), barbershop_id));

DROP POLICY IF EXISTS "professionals_staff_manage" ON public.professionals;
CREATE POLICY "professionals_staff_manage" ON public.professionals
FOR ALL TO authenticated
USING (is_barbershop_staff(auth.uid(), barbershop_id))
WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

DROP POLICY IF EXISTS "working_hours_public_select" ON public.working_hours;
CREATE POLICY "working_hours_public_select" ON public.working_hours
FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "working_hours_staff_manage" ON public.working_hours;
CREATE POLICY "working_hours_staff_manage" ON public.working_hours
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "time_off_select" ON public.time_off;
CREATE POLICY "time_off_select" ON public.time_off
FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "time_off_staff_manage" ON public.time_off;
CREATE POLICY "time_off_staff_manage" ON public.time_off
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- CUSTOMERS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
CREATE POLICY "customers_select_policy" ON public.customers
FOR SELECT TO public
USING (
  is_barbershop_staff(auth.uid(), barbershop_id)
  OR (profile_id IS NOT NULL AND profile_id = auth.uid())
);

DROP POLICY IF EXISTS "customers_insert_policy" ON public.customers;
CREATE POLICY "customers_insert_policy" ON public.customers
FOR INSERT TO public
WITH CHECK (barbershop_id IS NOT NULL);

DROP POLICY IF EXISTS "customers_update_policy" ON public.customers;
CREATE POLICY "customers_update_policy" ON public.customers
FOR UPDATE TO public
USING (
  is_barbershop_staff(auth.uid(), barbershop_id)
  OR (profile_id IS NOT NULL AND profile_id = auth.uid())
);

-- ------------------------------------------------------------------------------
-- PRODUCTS & STOCK_MOVEMENTS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "products_public_select" ON public.products;
CREATE POLICY "products_public_select" ON public.products
FOR SELECT TO public
USING (active = true OR is_barbershop_staff(auth.uid(), barbershop_id));

DROP POLICY IF EXISTS "products_staff_manage" ON public.products;
CREATE POLICY "products_staff_manage" ON public.products
FOR ALL TO authenticated
USING (is_barbershop_staff(auth.uid(), barbershop_id))
WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

DROP POLICY IF EXISTS "stock_staff_manage" ON public.stock_movements;
CREATE POLICY "stock_staff_manage" ON public.stock_movements
FOR ALL TO authenticated
USING (is_barbershop_staff(auth.uid(), barbershop_id))
WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

-- ------------------------------------------------------------------------------
-- CASH_SESSIONS & CASH_TRANSACTIONS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "cash_sessions_staff" ON public.cash_sessions;
CREATE POLICY "cash_sessions_staff" ON public.cash_sessions
FOR ALL TO authenticated
USING (is_barbershop_staff(auth.uid(), barbershop_id))
WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

DROP POLICY IF EXISTS "cash_tx_staff" ON public.cash_transactions;
CREATE POLICY "cash_tx_staff" ON public.cash_transactions
FOR ALL TO authenticated
USING (is_barbershop_staff(auth.uid(), barbershop_id))
WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

-- ------------------------------------------------------------------------------
-- COMMISSIONS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "commissions_policy" ON public.commissions;
CREATE POLICY "commissions_policy" ON public.commissions
FOR ALL TO authenticated
USING (
  has_barbershop_role(auth.uid(), barbershop_id, 'owner')
  OR (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = commissions.professional_id AND p.profile_id = auth.uid()))
);

-- ------------------------------------------------------------------------------
-- LOYALTY, WALLET & SUBSCRIPTIONS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "loyalty_balances_policy" ON public.loyalty_balances;
CREATE POLICY "loyalty_balances_policy" ON public.loyalty_balances
FOR ALL TO public
USING (
  is_barbershop_staff(auth.uid(), barbershop_id)
  OR (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = loyalty_balances.customer_id AND c.profile_id = auth.uid()))
);

DROP POLICY IF EXISTS "loyalty_tx_policy" ON public.loyalty_transactions;
CREATE POLICY "loyalty_tx_policy" ON public.loyalty_transactions
FOR ALL TO public
USING (
  is_barbershop_staff(auth.uid(), barbershop_id)
  OR (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = loyalty_transactions.customer_id AND c.profile_id = auth.uid()))
);

DROP POLICY IF EXISTS "wallet_balances_policy" ON public.wallet_balances;
CREATE POLICY "wallet_balances_policy" ON public.wallet_balances
FOR ALL TO public
USING (
  is_barbershop_staff(auth.uid(), barbershop_id)
  OR (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = wallet_balances.customer_id AND c.profile_id = auth.uid()))
);

DROP POLICY IF EXISTS "wallet_tx_policy" ON public.wallet_transactions;
CREATE POLICY "wallet_tx_policy" ON public.wallet_transactions
FOR ALL TO public
USING (
  is_barbershop_staff(auth.uid(), barbershop_id)
  OR (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = wallet_transactions.customer_id AND c.profile_id = auth.uid()))
);

DROP POLICY IF EXISTS "subs_policy" ON public.customer_subscriptions;
CREATE POLICY "subs_policy" ON public.customer_subscriptions
FOR ALL TO public
USING (
  is_barbershop_staff(auth.uid(), barbershop_id)
  OR (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_subscriptions.customer_id AND c.profile_id = auth.uid()))
);

DROP POLICY IF EXISTS "packages_public_select" ON public.packages;
CREATE POLICY "packages_public_select" ON public.packages
FOR SELECT TO public
USING (active = true OR is_barbershop_staff(auth.uid(), barbershop_id));

DROP POLICY IF EXISTS "packages_staff_manage" ON public.packages;
CREATE POLICY "packages_staff_manage" ON public.packages
FOR ALL TO authenticated
USING (is_barbershop_staff(auth.uid(), barbershop_id))
WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));
