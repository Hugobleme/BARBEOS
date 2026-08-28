-- Create a clean, safe RLS policy for public barbershops listing.
-- Overwrites previous conflicting policies that fail for unauthenticated users.

DROP POLICY IF EXISTS "barbershops_public_read" ON public.barbershops;

CREATE POLICY "barbershops_public_read" ON public.barbershops
FOR SELECT TO public
USING (active = true);
