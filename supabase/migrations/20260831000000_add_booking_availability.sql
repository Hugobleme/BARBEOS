-- Migration 20260831000000_add_booking_availability.sql

-- 1. Fix public RLS for barbershops (resolves the permission denied for anonymous users)
GRANT EXECUTE ON FUNCTION public.is_barbershop_member(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.is_barbershop_member(UUID, UUID) TO public;

-- Ensure the read policy is secure
DROP POLICY IF EXISTS "barbershops_public_read" ON public.barbershops;
CREATE POLICY "barbershops_public_read" ON public.barbershops
  FOR SELECT
  USING (active = true OR is_barbershop_member(auth.uid(), id));

-- 2. Create Barbershop Business Hours table
CREATE TABLE IF NOT EXISTS public.barbershop_business_hours (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (opens_at < closes_at)
);

CREATE INDEX IF NOT EXISTS idx_barbershop_business_hours_lookup 
ON public.barbershop_business_hours(barbershop_id, weekday);

ALTER TABLE public.barbershop_business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "barbershop_business_hours_public_read" ON public.barbershop_business_hours
  FOR SELECT TO public
  USING (true);

CREATE POLICY "barbershop_business_hours_admin_all" ON public.barbershop_business_hours
  FOR ALL TO authenticated
  USING (is_barbershop_member(auth.uid(), barbershop_id))
  WITH CHECK (is_barbershop_member(auth.uid(), barbershop_id));

-- 3. Create a public RPC to get appointments for a date without leaking private customer data
-- This is necessary because appointments RLS blocks anon users from reading existing slots,
-- which makes double-booking possible.
CREATE OR REPLACE FUNCTION public.get_public_appointments(p_barbershop_id UUID, p_date DATE)
RETURNS TABLE (
  id UUID,
  professional_id UUID,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  status public.appointment_status
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, professional_id, scheduled_start, scheduled_end, status
  FROM public.appointments
  WHERE barbershop_id = p_barbershop_id
    AND DATE(scheduled_start AT TIME ZONE 'UTC') = p_date
    AND status IN ('scheduled', 'in_progress');
$$;

GRANT EXECUTE ON FUNCTION public.get_public_appointments(UUID, DATE) TO anon, authenticated;
