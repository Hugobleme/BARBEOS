ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS no_show_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;