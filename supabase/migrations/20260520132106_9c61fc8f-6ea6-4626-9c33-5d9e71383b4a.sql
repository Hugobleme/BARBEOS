-- Portfolio items table
CREATE TABLE public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL,
  professional_id uuid,
  image_url text NOT NULL,
  storage_path text,
  caption text,
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_portfolio_shop ON public.portfolio_items(barbershop_id);
CREATE INDEX idx_portfolio_pro ON public.portfolio_items(professional_id);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolio_public_read" ON public.portfolio_items
  FOR SELECT USING (true);

CREATE POLICY "portfolio_staff_manage" ON public.portfolio_items
  FOR ALL USING (is_barbershop_staff(auth.uid(), barbershop_id))
  WITH CHECK (is_barbershop_staff(auth.uid(), barbershop_id));

-- Public storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, staff write (path layout: {barbershop_id}/{filename})
CREATE POLICY "portfolio_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio');

CREATE POLICY "portfolio_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'portfolio'
    AND is_barbershop_staff(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "portfolio_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'portfolio'
    AND is_barbershop_staff(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );