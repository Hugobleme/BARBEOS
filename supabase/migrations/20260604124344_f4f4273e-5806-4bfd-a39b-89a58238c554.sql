-- 1. SEGURANÇA: Restringir listagem pública no bucket 'portfolio'
-- Mudando a política de SELECT para não ser tão genérica (o linter avisou sobre isso)
DROP POLICY IF EXISTS "portfolio_storage_read" ON storage.objects;
CREATE POLICY "portfolio_storage_read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'portfolio' AND (storage.foldername(name))[1] IS NOT NULL);

-- 2. SEGURANÇA: Garantir que voice-recordings só possa ser acessado por quem tem direito
DROP POLICY IF EXISTS "voice_rec_staff_read" ON storage.objects;
CREATE POLICY "voice_rec_staff_read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'voice-recordings' 
  AND (
    EXISTS (
      SELECT 1 FROM public.voice_sessions s
      WHERE (s.id)::text = (storage.foldername(objects.name))[1]
      AND (is_barbershop_staff(auth.uid(), s.barbershop_id) OR s.profile_id = auth.uid())
    )
  )
);
