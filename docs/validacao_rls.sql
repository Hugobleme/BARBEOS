-- ==============================================================================
-- SCRIPT DE VALIDAÇÃO PÓS-MIGRATIONS (RODAR NO SQL EDITOR DO SUPABASE)
-- Objetivo: Testar a rigidez das novas políticas RLS implantadas.
-- ATENÇÃO: Substitua 'COLE_UM_UUID_AQUI' por IDs reais do seu banco se quiser testar a fundo.
-- ==============================================================================

BEGIN;

-- 1. SIMULAÇÃO DE USUÁRIO COMUM (Autenticado, não-staff)
-- Nós setamos a role para "authenticated" e forçamos um sub (ID do auth.users) fictício.
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claim.sub = 'ffffffff-ffff-ffff-ffff-ffffffffffff'; 

-- ==============================================================================
-- TESTE A: UPDATE ILEGAL EM CARTEIRA
-- Cenário: O usuário tenta aumentar o próprio saldo para 9999.
-- Esperado: A query não deve dar erro de sintaxe, mas deve afetar 0 linhas (UPDATE 0).
UPDATE public.wallet_balances 
SET balance = 9999 
WHERE customer_id = (SELECT id FROM public.customers WHERE profile_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff');

-- ==============================================================================
-- TESTE B: INSERT EM LOJA NÃO PATROCINADA
-- Cenário: O usuário tenta agendar (INSERT em appointments) numa loja que não paga a plataforma.
-- Esperado: A query de INSERT deve falhar com o erro:
-- "new row violates row-level security policy for table appointments"
-- (Descomente e coloque UUIDs reais abaixo se quiser ver o erro disparar na prática)

/*
INSERT INTO public.appointments (
  barbershop_id, customer_id, professional_id, service_id, scheduled_start, scheduled_end, status, total_price
) VALUES (
  'UUID_LOJA_NAO_PATROCINADA', 'UUID_CUSTOMER_DO_USUARIO', 'UUID_PROF', 'UUID_SERV', 
  '2027-01-01 10:00:00+00', '2027-01-01 10:30:00+00', 'pending', 50.00
);
*/

-- ==============================================================================
-- TESTE C: SELECT EM PROFILES ALHEIOS
-- Cenário: Tentar listar perfis de outras pessoas sem ser staff.
-- Esperado: Deve retornar 0 registros ou apenas o próprio registro (se existisse).
SELECT * FROM public.profiles WHERE id != 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- ==============================================================================
-- FIM DA SIMULAÇÃO: Desfaz qualquer mudança temporária.
ROLLBACK;
