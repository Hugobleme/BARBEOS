
-- Pacotes vendidos pela barbearia (ex: 5 cortes por R$ 200)
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  sessions_total integer NOT NULL DEFAULT 1,
  validity_days integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY packages_public_read ON public.packages FOR SELECT USING (active = true OR is_barbershop_staff(auth.uid(), barbershop_id));
CREATE POLICY packages_owner_manage ON public.packages FOR ALL
  USING (has_barbershop_role(auth.uid(), barbershop_id, 'owner'::app_role))
  WITH CHECK (has_barbershop_role(auth.uid(), barbershop_id, 'owner'::app_role));
CREATE TRIGGER packages_set_updated_at BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Pacotes adquiridos por um cliente
CREATE TABLE public.customer_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  package_id uuid NOT NULL,
  sessions_remaining integer NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  transaction_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY cs_staff_manage ON public.customer_subscriptions FOR ALL
  USING (is_barbershop_staff(auth.uid(), barbershop_id))
  WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));
CREATE POLICY cs_customer_read ON public.customer_subscriptions FOR SELECT
  USING (EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_subscriptions.customer_id AND c.profile_id = auth.uid()));
CREATE TRIGGER cs_set_updated_at BEFORE UPDATE ON public.customer_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Log de uso (resgate de sessão)
CREATE TABLE public.subscription_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.customer_subscriptions(id) ON DELETE CASCADE,
  barbershop_id uuid NOT NULL,
  appointment_id uuid,
  professional_id uuid,
  redeemed_by uuid,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  notes text
);
ALTER TABLE public.subscription_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sr_staff_manage ON public.subscription_redemptions FOR ALL
  USING (is_barbershop_staff(auth.uid(), barbershop_id))
  WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

CREATE INDEX idx_cs_barbershop ON public.customer_subscriptions(barbershop_id);
CREATE INDEX idx_cs_customer ON public.customer_subscriptions(customer_id);
CREATE INDEX idx_sr_subscription ON public.subscription_redemptions(subscription_id);
