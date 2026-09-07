-- ============================================================================
-- Migration: 20260907130000_apply_approved_performance_cleanup.sql
-- Source: docs/DB_PERFORMANCE_MIGRATION_PLAN.md (Etapa 12B Approved Design)
-- Description: Controlled, reversible database performance optimization.
--   Group A: 9 Foreign-Key covering index additions (Audit: ADD INDEX)
--   Group B: 7 Duplicate index removals (Audit: SAFE CANDIDATE FOR REMOVAL)
--   Group C: 12 RLS InitPlan performance rewrites (Audit: SAFE OPTIMIZATION CANDIDATE)
-- ============================================================================

-- ============================================================================
-- GROUP A: APPROVED FOREIGN-KEY INDEX ADDITIONS
-- Audit Classification: ADD INDEX
-- Source Plan: Section 3 & Section 8 Draft A
-- Operational Impact: Eliminates sequential scans on FK lookups/cascades.
-- Rollback Note: DROP INDEX IF EXISTS <index_name> (See Plan Section 9)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_appointment_services_service_id 
    ON public.appointment_services(service_id);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_customer_id 
    ON public.cash_transactions(customer_id);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_professional_id 
    ON public.cash_transactions(professional_id);

CREATE INDEX IF NOT EXISTS idx_commissions_appointment_id 
    ON public.commissions(appointment_id);

CREATE INDEX IF NOT EXISTS idx_commissions_transaction_id 
    ON public.commissions(transaction_id);

CREATE INDEX IF NOT EXISTS idx_profiles_default_barbershop_id 
    ON public.profiles(default_barbershop_id);

CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_professional_id 
    ON public.satisfaction_surveys(professional_id);

CREATE INDEX IF NOT EXISTS idx_service_professionals_professional_id 
    ON public.service_professionals(professional_id);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_appointment_id 
    ON public.voice_sessions(appointment_id);


-- ============================================================================
-- GROUP B: APPROVED DUPLICATE-INDEX REMOVALS
-- Audit Classification: SAFE CANDIDATE FOR REMOVAL
-- Source Plan: Section 4 & Section 8 Draft B
-- Operational Impact: Reclaims 88 kB, eliminates double-index write overhead.
-- Verification: Retained idx_* indexes are confirmed valid, active, and identical.
-- Rollback Note: CREATE INDEX IF NOT EXISTS <index_name> (See Plan Section 9)
-- ============================================================================

DROP INDEX IF EXISTS public.appointments_customer_id_idx;
DROP INDEX IF EXISTS public.customers_barbershop_id_idx;
DROP INDEX IF EXISTS public.customers_profile_id_idx;
DROP INDEX IF EXISTS public.professionals_barbershop_id_idx;
DROP INDEX IF EXISTS public.services_barbershop_id_idx;
DROP INDEX IF EXISTS public.time_off_professional_id_idx;
DROP INDEX IF EXISTS public.working_hours_professional_id_idx;


-- ============================================================================
-- GROUP C: APPROVED RLS EXPRESSION-ONLY OPTIMIZATIONS
-- Audit Classification: SAFE OPTIMIZATION CANDIDATE
-- Source Plan: Section 5 & Section 8 Draft C
-- Operational Impact: Evaluates auth context once per statement via (SELECT auth.uid())
--                      instead of per row. Consolidates exact duplicate SELECTs.
-- Rollback Note: Restore original policies (See Plan Section 9)
-- ============================================================================

-- 1. APPOINTMENTS TABLE
-- Consolidate duplicate SELECT policy
DROP POLICY IF EXISTS "appt_staff_read" ON public.appointments;

-- Optimize primary SELECT policy
DROP POLICY IF EXISTS "appointments_select_policy" ON public.appointments;
CREATE POLICY "appointments_select_policy" ON public.appointments
    FOR SELECT TO authenticated
    USING (
        is_barbershop_staff((SELECT auth.uid()), barbershop_id)
        OR (EXISTS (
            SELECT 1 FROM customers c 
            WHERE c.id = appointments.customer_id 
              AND c.profile_id = (SELECT auth.uid())
        ))
    );

-- Optimize customer INSERT policy
DROP POLICY IF EXISTS "appt_customer_insert" ON public.appointments;
CREATE POLICY "appt_customer_insert" ON public.appointments
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM customers c 
            WHERE c.id = appointments.customer_id 
              AND c.profile_id = (SELECT auth.uid())
        )
    );

-- Optimize customer CANCEL policy
DROP POLICY IF EXISTS "appt_customer_cancel" ON public.appointments;
CREATE POLICY "appt_customer_cancel" ON public.appointments
    FOR UPDATE TO public
    USING (
        EXISTS (
            SELECT 1 FROM customers c 
            WHERE c.id = appointments.customer_id 
              AND c.profile_id = (SELECT auth.uid())
        )
    );


-- 2. CUSTOMERS TABLE
-- Optimize staff read policy
DROP POLICY IF EXISTS "customers_staff_read" ON public.customers;
CREATE POLICY "customers_staff_read" ON public.customers
    FOR SELECT TO authenticated
    USING (is_barbershop_staff((SELECT auth.uid()), barbershop_id));

-- Optimize self/staff read policy
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
CREATE POLICY "customers_select_policy" ON public.customers
    FOR SELECT TO public
    USING (
        ((profile_id IS NOT NULL) AND (profile_id = (SELECT auth.uid())))
        OR (EXISTS (
            SELECT 1 FROM barbershop_members bm 
            WHERE bm.barbershop_id = customers.barbershop_id 
              AND bm.profile_id = (SELECT auth.uid())
              AND bm.active = true
        ))
    );

-- Optimize self update policy
DROP POLICY IF EXISTS "customers_self_update" ON public.customers;
CREATE POLICY "customers_self_update" ON public.customers
    FOR UPDATE TO public
    USING (
        (profile_id IS NOT NULL) AND (profile_id = (SELECT auth.uid()))
    );


-- 3. WORKING HOURS TABLE
-- Consolidate duplicate public read policy
DROP POLICY IF EXISTS "working_hours_public_select" ON public.working_hours;

-- Optimize staff manage policy
DROP POLICY IF EXISTS "working_hours_staff_manage" ON public.working_hours;
CREATE POLICY "working_hours_staff_manage" ON public.working_hours
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM professionals p 
            WHERE p.id = working_hours.professional_id 
              AND is_barbershop_staff((SELECT auth.uid()), p.barbershop_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM professionals p 
            WHERE p.id = working_hours.professional_id 
              AND is_barbershop_staff((SELECT auth.uid()), p.barbershop_id)
        )
    );


-- 4. BARBERSHOP MEMBERS TABLE
DROP POLICY IF EXISTS "members_select_own_or_staff" ON public.barbershop_members;
CREATE POLICY "members_select_own_or_staff" ON public.barbershop_members
    FOR SELECT TO authenticated
    USING (
        (profile_id = (SELECT auth.uid())) 
        OR is_barbershop_staff((SELECT auth.uid()), barbershop_id)
    );


-- 5. CASH SESSIONS & TRANSACTIONS TABLES
DROP POLICY IF EXISTS "cash_sessions_staff" ON public.cash_sessions;
CREATE POLICY "cash_sessions_staff" ON public.cash_sessions
    FOR ALL TO authenticated
    USING (is_barbershop_staff((SELECT auth.uid()), barbershop_id))
    WITH CHECK (is_barbershop_staff((SELECT auth.uid()), barbershop_id));

DROP POLICY IF EXISTS "cash_tx_staff" ON public.cash_transactions;
CREATE POLICY "cash_tx_staff" ON public.cash_transactions
    FOR ALL TO authenticated
    USING (is_barbershop_staff((SELECT auth.uid()), barbershop_id))
    WITH CHECK (is_barbershop_staff((SELECT auth.uid()), barbershop_id));
