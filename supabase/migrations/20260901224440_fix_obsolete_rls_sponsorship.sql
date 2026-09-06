-- This migration supersedes the "appointments_insert_policy" from 20260829131710_fix_rls_consolidada.sql
-- It removes the obsolete `is_sponsored = true` dependency which breaks booking on the new schema.

DROP POLICY IF EXISTS "appointments_insert_policy" ON public.appointments;

CREATE POLICY "appointments_insert_policy" ON public.appointments
FOR INSERT TO authenticated
WITH CHECK (
    scheduled_start IS NOT NULL
    AND scheduled_end IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.customers c 
        WHERE c.id = appointments.customer_id AND c.profile_id = auth.uid()
    )
    AND EXISTS (
        SELECT 1 FROM public.barbershops b 
        WHERE b.id = appointments.barbershop_id AND b.active = true
    )
);
