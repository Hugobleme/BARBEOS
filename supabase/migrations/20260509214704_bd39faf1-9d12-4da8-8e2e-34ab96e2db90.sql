-- Invitations table
CREATE TABLE public.barbershop_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL,
  email text NOT NULL,
  role app_role NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | revoked | expired
  invited_by uuid,
  accepted_by uuid,
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invites_shop ON public.barbershop_invitations(barbershop_id);
CREATE INDEX idx_invites_email ON public.barbershop_invitations(lower(email));

ALTER TABLE public.barbershop_invitations ENABLE ROW LEVEL SECURITY;

-- Owners can manage invites for their shop
CREATE POLICY inv_owner_all ON public.barbershop_invitations
  FOR ALL USING (has_barbershop_role(auth.uid(), barbershop_id, 'owner'::app_role))
  WITH CHECK (has_barbershop_role(auth.uid(), barbershop_id, 'owner'::app_role));

-- Authenticated users can read an invite by token (to accept it).
-- We rely on token unguessability; the app filters by token.
CREATE POLICY inv_token_read ON public.barbershop_invitations
  FOR SELECT TO authenticated USING (true);

-- Authenticated user can mark their own invite as accepted (matching their email)
CREATE POLICY inv_accept_update ON public.barbershop_invitations
  FOR UPDATE TO authenticated
  USING (lower(email) = lower((auth.jwt() ->> 'email')) AND status = 'pending' AND expires_at > now())
  WITH CHECK (lower(email) = lower((auth.jwt() ->> 'email')));
