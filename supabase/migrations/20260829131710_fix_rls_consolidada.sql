-- ==============================================================================
-- MIGRATION: Fix Consolidated RLS
-- ==============================================================================
-- Resumo das alterações:
-- 1. appointments (INSERT): Restrito a usuários autenticados (TO authenticated). Adicionadas validações no WITH CHECK
--    para garantir que scheduled_start/end não sejam nulos, que o customer_id pertença ao usuário logado,
--    e que a barbearia esteja ativa e patrocinada.
-- 2. appointments (SELECT/UPDATE): Políticas restritas para que clientes vejam/editem apenas seus próprios
--    agendamentos, e staff veja/edite apenas os agendamentos da sua própria loja usando is_barbershop_staff.
-- 3. profiles (SELECT): Alterado de acesso público/geral para restrito ao próprio usuário (id = auth.uid()),
--    impedindo leitura de perfis de terceiros.
-- 4. customers (INSERT): Restrito a usuários autenticados (TO authenticated) e exigindo que profile_id = auth.uid().
-- 5. working_hours, time_off, service_professionals: Políticas de gerenciamento (INSERT/UPDATE/DELETE) antes abertas (true)
--    foram restritas para permitir ESCRITA apenas ao staff da barbearia correspondente, usando is_barbershop_staff e
--    JOIN com a tabela professionals. As políticas de SELECT (leitura pública) foram mantidas para permitir agendamentos.
-- ==============================================================================

-- 1. APPOINTMENTS (INSERT)
DROP POLICY IF EXISTS ""appointments_insert_policy"" ON public.appointments;
CREATE POLICY ""appointments_insert_policy"" ON public.appointments
FOR INSERT TO authenticated
WITH CHECK (
    scheduled_start IS NOT NULL
    AND scheduled_end IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.customers c 
        WHERE c.id = customer_id AND c.profile_id = auth.uid()
    )
    AND EXISTS (
        SELECT 1 FROM public.barbershops b 
        WHERE b.id = barbershop_id AND b.is_sponsored = true AND b.active = true
    )
);

-- 2. APPOINTMENTS (SELECT)
DROP POLICY IF EXISTS ""appointments_select_policy"" ON public.appointments;
CREATE POLICY ""appointments_select_policy"" ON public.appointments
FOR SELECT TO authenticated
USING (
    is_barbershop_staff(auth.uid(), barbershop_id)
    OR EXISTS (
        SELECT 1 FROM public.customers c 
        WHERE c.id = appointments.customer_id AND c.profile_id = auth.uid()
    )
);

-- 2. APPOINTMENTS (UPDATE)
DROP POLICY IF EXISTS ""appointments_update_policy"" ON public.appointments;
CREATE POLICY ""appointments_update_policy"" ON public.appointments
FOR UPDATE TO authenticated
USING (
    is_barbershop_staff(auth.uid(), barbershop_id)
    OR EXISTS (
        SELECT 1 FROM public.customers c 
        WHERE c.id = appointments.customer_id AND c.profile_id = auth.uid()
    )
);

-- 3. PROFILES (SELECT)
DROP POLICY IF EXISTS ""profiles_select_own"" ON public.profiles;
CREATE POLICY ""profiles_select_own"" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

-- 4. CUSTOMERS (INSERT)
DROP POLICY IF EXISTS ""customers_insert_policy"" ON public.customers;
CREATE POLICY ""customers_insert_policy"" ON public.customers
FOR INSERT TO authenticated
WITH CHECK (profile_id = auth.uid());

-- 5. WORKING_HOURS (WRITE)
DROP POLICY IF EXISTS ""working_hours_staff_manage"" ON public.working_hours;
-- Nota: A política ""working_hours_public_select"" FOR SELECT TO public USING (true) é mantida intacta
CREATE POLICY ""working_hours_staff_manage"" ON public.working_hours
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.professionals p 
        WHERE p.id = working_hours.professional_id 
        AND is_barbershop_staff(auth.uid(), p.barbershop_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.professionals p 
        WHERE p.id = working_hours.professional_id 
        AND is_barbershop_staff(auth.uid(), p.barbershop_id)
    )
);

-- 5. TIME_OFF (WRITE)
DROP POLICY IF EXISTS ""time_off_staff_manage"" ON public.time_off;
-- Nota: A política ""time_off_select"" FOR SELECT TO public USING (true) é mantida intacta
CREATE POLICY ""time_off_staff_manage"" ON public.time_off
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.professionals p 
        WHERE p.id = time_off.professional_id 
        AND is_barbershop_staff(auth.uid(), p.barbershop_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.professionals p 
        WHERE p.id = time_off.professional_id 
        AND is_barbershop_staff(auth.uid(), p.barbershop_id)
    )
);

-- 5. SERVICE_PROFESSIONALS (WRITE)
DROP POLICY IF EXISTS ""service_pros_staff_manage"" ON public.service_professionals;
-- Nota: A política ""service_pros_public_select"" FOR SELECT TO public USING (true) é mantida intacta
CREATE POLICY ""service_pros_staff_manage"" ON public.service_professionals
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.professionals p 
        WHERE p.id = service_professionals.professional_id 
        AND is_barbershop_staff(auth.uid(), p.barbershop_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.professionals p 
        WHERE p.id = service_professionals.professional_id 
        AND is_barbershop_staff(auth.uid(), p.barbershop_id)
    )
);
