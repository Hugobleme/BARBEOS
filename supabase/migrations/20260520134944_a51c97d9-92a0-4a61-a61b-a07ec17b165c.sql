-- products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL,
  name text NOT NULL,
  sku text,
  description text,
  price numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  stock_qty numeric NOT NULL DEFAULT 0,
  min_stock numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'un',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_staff_read" ON public.products
  FOR SELECT USING (is_barbershop_staff(auth.uid(), barbershop_id));

CREATE POLICY "products_staff_manage" ON public.products
  FOR ALL USING (is_barbershop_staff(auth.uid(), barbershop_id))
  WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX products_barbershop_idx ON public.products(barbershop_id, active);

-- stock_movements
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('in','out','sale','adjust')),
  quantity numeric NOT NULL,
  unit_cost numeric,
  transaction_id uuid,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sm_staff_all" ON public.stock_movements
  FOR ALL USING (is_barbershop_staff(auth.uid(), barbershop_id))
  WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

CREATE INDEX sm_product_idx ON public.stock_movements(product_id, created_at DESC);
CREATE INDEX sm_barbershop_idx ON public.stock_movements(barbershop_id, created_at DESC);