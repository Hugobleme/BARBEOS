-- ==============================================================================
-- MIGRATION: 20260819000001_fix_rls_policies.sql
-- Objetivo: Reforçar RLS com subqueries EXISTS e regras de acesso explícitas
-- ==============================================================================

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE IF EXISTS public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.barbershop_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS: BARBERSHOPS
DROP POLICY IF EXISTS "barbershops_public_read" ON public.barbershops;
CREATE POLICY "barbershops_public_read" ON public.barbershops
FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "barbershops_admin_insert" ON public.barbershops;
CREATE POLICY "barbershops_admin_insert" ON public.barbershops
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "barbershops_admin_update" ON public.barbershops;
CREATE POLICY "barbershops_admin_update" ON public.barbershops
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.barbershop_members bm
    WHERE bm.barbershop_id = barbershops.id
      AND bm.profile_id = auth.uid()
      AND bm.active = true
      AND bm.role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "barbershops_admin_delete" ON public.barbershops;
CREATE POLICY "barbershops_admin_delete" ON public.barbershops
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.barbershop_members bm
    WHERE bm.barbershop_id = barbershops.id
      AND bm.profile_id = auth.uid()
      AND bm.active = true
      AND bm.role IN ('owner', 'admin')
  )
);

-- 3. POLÍTICAS: APPOINTMENTS
DROP POLICY IF EXISTS "appointments_select_policy" ON public.appointments;
CREATE POLICY "appointments_select_policy" ON public.appointments
FOR SELECT TO public
USING (
  -- Clientes podem visualizar seus próprios agendamentos
  (auth.uid() IS NOT NULL AND (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.customers c 
      WHERE c.id = appointments.customer_id AND c.profile_id = auth.uid()
    )
  ))
  -- Equipe da barbearia (owner, admin, barber) pode ver os agendamentos da sua barbearia
  OR EXISTS (
    SELECT 1 FROM public.barbershop_members bm
    WHERE bm.barbershop_id = appointments.barbershop_id
      AND bm.profile_id = auth.uid()
      AND bm.active = true
      AND bm.role IN ('owner', 'admin', 'barber', 'manager', 'receptionist')
  )
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
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.customers c 
    WHERE c.id = appointments.customer_id AND c.profile_id = auth.uid()
  ))
  OR EXISTS (
    SELECT 1 FROM public.barbershop_members bm
    WHERE bm.barbershop_id = appointments.barbershop_id
      AND bm.profile_id = auth.uid()
      AND bm.active = true
      AND bm.role IN ('owner', 'admin', 'barber', 'manager', 'receptionist')
  )
);

-- 4. POLÍTICAS: SERVICES
DROP POLICY IF EXISTS "services_public_select" ON public.services;
CREATE POLICY "services_public_select" ON public.services
FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "services_team_manage" ON public.services;
CREATE POLICY "services_team_manage" ON public.services
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.barbershop_members bm
    WHERE bm.barbershop_id = services.barbershop_id
      AND bm.profile_id = auth.uid()
      AND bm.active = true
      AND bm.role IN ('owner', 'admin', 'barber', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.barbershop_members bm
    WHERE bm.barbershop_id = services.barbershop_id
      AND bm.profile_id = auth.uid()
      AND bm.active = true
      AND bm.role IN ('owner', 'admin', 'barber', 'manager')
  )
);

-- 5. POLÍTICAS: PROFESSIONALS (BARBERS)
DROP POLICY IF EXISTS "professionals_public_select" ON public.professionals;
CREATE POLICY "professionals_public_select" ON public.professionals
FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "professionals_team_manage" ON public.professionals;
CREATE POLICY "professionals_team_manage" ON public.professionals
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.barbershop_members bm
    WHERE bm.barbershop_id = professionals.barbershop_id
      AND bm.profile_id = auth.uid()
      AND bm.active = true
      AND bm.role IN ('owner', 'admin', 'barber', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.barbershop_members bm
    WHERE bm.barbershop_id = professionals.barbershop_id
      AND bm.profile_id = auth.uid()
      AND bm.active = true
      AND bm.role IN ('owner', 'admin', 'barber', 'manager')
  )
);

-- 6. POLÍTICAS: CUSTOMERS
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
CREATE POLICY "customers_select_policy" ON public.customers
FOR SELECT TO public
USING (
  -- Próprio cliente
  (profile_id IS NOT NULL AND profile_id = auth.uid())
  -- Equipe da barbearia para clientes daquela barbearia
  OR EXISTS (
    SELECT 1 FROM public.barbershop_members bm
    WHERE bm.barbershop_id = customers.barbershop_id
      AND bm.profile_id = auth.uid()
      AND bm.active = true
      AND bm.role IN ('owner', 'admin', 'barber', 'manager', 'receptionist')
  )
);

DROP POLICY IF EXISTS "customers_update_policy" ON public.customers;
CREATE POLICY "customers_update_policy" ON public.customers
FOR UPDATE TO public
USING (
  (profile_id IS NOT NULL AND profile_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.barbershop_members bm
    WHERE bm.barbershop_id = customers.barbershop_id
      AND bm.profile_id = auth.uid()
      AND bm.active = true
      AND bm.role IN ('owner', 'admin', 'barber', 'manager', 'receptionist')
  )
);

-- 7. POLÍTICAS: CASH_TRANSACTIONS & CASH_SESSIONS
DROP POLICY IF EXISTS "cash_tx_team_policy" ON public.cash_transactions;
CREATE POLICY "cash_tx_team_policy" ON public.cash_transactions
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.barbershop_members bm
    WHERE bm.barbershop_id = cash_transactions.barbershop_id
      AND bm.profile_id = auth.uid()
      AND bm.active = true
      AND bm.role IN ('owner', 'admin', 'barber', 'manager', 'receptionist')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.barbershop_members bm
    WHERE bm.barbershop_id = cash_transactions.barbershop_id
      AND bm.profile_id = auth.uid()
      AND bm.active = true
      AND bm.role IN ('owner', 'admin', 'barber', 'manager', 'receptionist')
  )
);

DROP POLICY IF EXISTS "cash_sessions_team_policy" ON public.cash_sessions;
CREATE POLICY "cash_sessions_team_policy" ON public.cash_sessions
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.barbershop_members bm
    WHERE bm.barbershop_id = cash_sessions.barbershop_id
      AND bm.profile_id = auth.uid()
      AND bm.active = true
      AND bm.role IN ('owner', 'admin', 'barber', 'manager', 'receptionist')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.barbershop_members bm
    WHERE bm.barbershop_id = cash_sessions.barbershop_id
      AND bm.profile_id = auth.uid()
      AND bm.active = true
      AND bm.role IN ('owner', 'admin', 'barber', 'manager', 'receptionist')
  )
);
