CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL,
  code text NOT NULL,
  kind text NOT NULL DEFAULT 'percent', -- percent | fixed | first_visit
  value numeric NOT NULL DEFAULT 0,
  min_amount numeric NOT NULL DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (barbershop_id, code)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY coupons_public_read ON public.coupons FOR SELECT USING (active = true OR is_barbershop_staff(auth.uid(), barbershop_id));
CREATE POLICY coupons_staff_manage ON public.coupons FOR ALL USING (is_barbershop_staff(auth.uid(), barbershop_id)) WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL,
  coupon_id uuid NOT NULL,
  customer_id uuid,
  appointment_id uuid,
  transaction_id uuid,
  discount_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY cr_staff_all ON public.coupon_redemptions FOR ALL USING (is_barbershop_staff(auth.uid(), barbershop_id)) WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));
CREATE POLICY cr_customer_insert ON public.coupon_redemptions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM customers c WHERE c.id = coupon_redemptions.customer_id AND c.profile_id = auth.uid()));
CREATE POLICY cr_guest_insert ON public.coupon_redemptions FOR INSERT TO anon WITH CHECK (customer_id IS NULL OR EXISTS (SELECT 1 FROM customers c WHERE c.id = coupon_redemptions.customer_id AND c.profile_id IS NULL));

CREATE INDEX IF NOT EXISTS idx_cr_coupon ON public.coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_cr_appt ON public.coupon_redemptions(appointment_id);