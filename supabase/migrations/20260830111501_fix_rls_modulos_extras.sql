-- Migration: fix_rls_modulos_extras.sql
-- Descrição: Trava final nas políticas dos módulos extracurriculares. 
-- Previne acessos anônimos e introduz rate-limiting nativo para a Aurora.

-- -----------------------------------------------------------------------------
-- 1. ASSISTENTE AURORA (voice_sessions e voice_messages)
-- Bloquear acessos anônimos (anon) para evitar consumo não autorizado de APIs
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "vs_guest_insert" ON public.voice_sessions;
DROP POLICY IF EXISTS "vm_guest_insert" ON public.voice_messages;
DROP POLICY IF EXISTS "vs_self_insert" ON public.voice_sessions;

-- Rate Limit: permite apenas 5 sessões criadas pelo usuário por hora
CREATE POLICY "vs_self_insert_ratelimit" ON public.voice_sessions
FOR INSERT TO authenticated 
WITH CHECK (
  (profile_id = auth.uid()) AND
  (
    (
      SELECT COUNT(*) 
      FROM public.voice_sessions 
      WHERE profile_id = auth.uid() 
      AND created_at > (now() - interval '1 hour')
    ) < 5
  )
);


-- -----------------------------------------------------------------------------
-- 2. CUPONS DE DESCONTO (coupon_redemptions)
-- Exigir autenticação para resgatar cupons, mitigando tentativas de brute-force
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "cr_guest_insert" ON public.coupon_redemptions;


-- -----------------------------------------------------------------------------
-- 3. CAIXA, PACOTES, PORTFÓLIO, AVALIAÇÕES
-- Avaliados manualmente (Auditoria):
-- - cash_sessions/cash_transactions usam is_barbershop_staff() no WITH CHECK.
-- - packages usa is_barbershop_staff().
-- - portfolio_items usa is_barbershop_staff().
-- - satisfaction_surveys requer que o usuário tenha um appointment atrelado (ID).
-- Conclusão: INSERT/UPDATE/DELETE estão seguros nesses módulos.
-- Nenhuma intervenção de RLS adicional é necessária aqui.
-- -----------------------------------------------------------------------------
