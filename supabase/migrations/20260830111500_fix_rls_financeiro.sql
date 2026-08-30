-- Migration: fix_rls_financeiro.sql
-- -----------------------------------------------------------------------------
-- IMPORTANTE: VALORES FINANCEIROS NUNCA MUDAM POR ESCRITA DIRETA DO CLIENTE.
-- Alterações em saldos e comissões devem acontecer apenas por funções de servidor 
-- (SECURITY DEFINER) de forma atômica ou, excepcionalmente, pelo dono/admin da loja.
--
-- POLÍTICAS ALTERADAS:
-- 1. wallet_balances_policy (e variantes):
--    - Motivo: Permitia FOR ALL, logo o cliente com profile_id vinculado podia fazer UPDATE no próprio saldo (risco de enriquecimento ilícito).
--    - Nova Política: 'wb_select' (Apenas leitura do próprio saldo ou staff da loja) e 'wb_manage' (Owner/Admin).
-- 2. loyalty_balances_policy (e variantes):
--    - Motivo: Permitia FOR ALL, cliente podia criar pontos falsos infinitos.
--    - Nova Política: 'lb_select' (Apenas leitura) e 'lb_manage' (Owner/Admin).
-- 3. commissions_policy (e variantes):
--    - Motivo: Permitia FOR ALL, profissional podia aumentar a própria taxa (rate/amount) de comissão.
--    - Nova Política: 'comm_select' (Apenas leitura da comissão) e 'comm_manage' (Owner/Admin).
-- -----------------------------------------------------------------------------

-- ============================================================================
-- 1. DROP DAS POLICIES PERMISSIVAS
-- ============================================================================
DROP POLICY IF EXISTS "commissions_policy" ON public.commissions;
DROP POLICY IF EXISTS "comm_owner_all" ON public.commissions;
DROP POLICY IF EXISTS "comm_pro_read" ON public.commissions;

DROP POLICY IF EXISTS "loyalty_balances_policy" ON public.loyalty_balances;
DROP POLICY IF EXISTS "lb_customer_read" ON public.loyalty_balances;
DROP POLICY IF EXISTS "lb_staff_all" ON public.loyalty_balances;

DROP POLICY IF EXISTS "wallet_balances_policy" ON public.wallet_balances;
DROP POLICY IF EXISTS "wb_customer_read" ON public.wallet_balances;
DROP POLICY IF EXISTS "wb_staff_all" ON public.wallet_balances;


-- ============================================================================
-- 2. RECRIANDO POLICIES ESTRITAS
-- ============================================================================

-- TABELA: wallet_balances
CREATE POLICY "wb_select" ON public.wallet_balances
FOR SELECT TO public
USING (
  is_barbershop_staff(auth.uid(), barbershop_id)
  OR EXISTS (SELECT 1 FROM public.customers c WHERE c.id = wallet_balances.customer_id AND c.profile_id = auth.uid())
);

CREATE POLICY "wb_manage" ON public.wallet_balances
FOR ALL TO authenticated
USING (
  has_barbershop_role(auth.uid(), barbershop_id, 'owner') OR
  has_barbershop_role(auth.uid(), barbershop_id, 'admin')
)
WITH CHECK (
  has_barbershop_role(auth.uid(), barbershop_id, 'owner') OR
  has_barbershop_role(auth.uid(), barbershop_id, 'admin')
);

-- TABELA: loyalty_balances
CREATE POLICY "lb_select" ON public.loyalty_balances
FOR SELECT TO public
USING (
  is_barbershop_staff(auth.uid(), barbershop_id)
  OR EXISTS (SELECT 1 FROM public.customers c WHERE c.id = loyalty_balances.customer_id AND c.profile_id = auth.uid())
);

CREATE POLICY "lb_manage" ON public.loyalty_balances
FOR ALL TO authenticated
USING (
  has_barbershop_role(auth.uid(), barbershop_id, 'owner') OR
  has_barbershop_role(auth.uid(), barbershop_id, 'admin')
)
WITH CHECK (
  has_barbershop_role(auth.uid(), barbershop_id, 'owner') OR
  has_barbershop_role(auth.uid(), barbershop_id, 'admin')
);

-- TABELA: commissions
CREATE POLICY "comm_select" ON public.commissions
FOR SELECT TO public
USING (
  is_barbershop_staff(auth.uid(), barbershop_id)
  OR EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = commissions.professional_id AND p.profile_id = auth.uid())
);

CREATE POLICY "comm_manage" ON public.commissions
FOR ALL TO authenticated
USING (
  has_barbershop_role(auth.uid(), barbershop_id, 'owner') OR
  has_barbershop_role(auth.uid(), barbershop_id, 'admin')
)
WITH CHECK (
  has_barbershop_role(auth.uid(), barbershop_id, 'owner') OR
  has_barbershop_role(auth.uid(), barbershop_id, 'admin')
);


-- ============================================================================
-- 3. FUNÇÕES SECURITY DEFINER (OPERAÇÕES DE CAIXA E FIDELIDADE)
-- Estas funções contornam o RLS para que o backend/app possam atualizar
-- valores transacionais de forma atômica, validando adequadamente o ator.
-- ============================================================================

-- CREDITAR CARTEIRA
CREATE OR REPLACE FUNCTION public.wallet_credit(p_customer_id UUID, p_amount NUMERIC)
RETURNS void AS $$
DECLARE
    v_barbershop_id UUID;
BEGIN
    SELECT barbershop_id INTO v_barbershop_id FROM public.customers WHERE id = p_customer_id;
    
    -- Apenas equipe da loja pode aprovar a inserção de saldo
    IF NOT is_barbershop_staff(auth.uid(), v_barbershop_id) THEN
        RAISE EXCEPTION 'Acesso negado: apenas staff da barbearia pode creditar a carteira do cliente';
    END IF;

    UPDATE public.wallet_balances 
    SET balance = balance + p_amount,
        lifetime_credited = lifetime_credited + p_amount,
        updated_at = NOW()
    WHERE customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- DEBITAR CARTEIRA
CREATE OR REPLACE FUNCTION public.wallet_debit(p_customer_id UUID, p_amount NUMERIC)
RETURNS void AS $$
DECLARE
    v_barbershop_id UUID;
    v_current_balance NUMERIC;
    v_is_customer BOOLEAN;
BEGIN
    SELECT barbershop_id INTO v_barbershop_id FROM public.customers WHERE id = p_customer_id;
    
    -- Quem debita pode ser a própria staff (faturando) ou o cliente validando pagamento
    v_is_customer := EXISTS (SELECT 1 FROM public.customers WHERE id = p_customer_id AND profile_id = auth.uid());
    IF NOT is_barbershop_staff(auth.uid(), v_barbershop_id) AND NOT v_is_customer THEN
        RAISE EXCEPTION 'Acesso negado: não autorizado a debitar esta carteira';
    END IF;

    SELECT balance INTO v_current_balance FROM public.wallet_balances WHERE customer_id = p_customer_id FOR UPDATE;
    
    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Saldo insuficiente na carteira';
    END IF;

    UPDATE public.wallet_balances 
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- AJUSTAR PONTOS DE FIDELIDADE
CREATE OR REPLACE FUNCTION public.loyalty_adjust(p_customer_id UUID, p_points INT)
RETURNS void AS $$
DECLARE
    v_barbershop_id UUID;
    v_current_points INT;
BEGIN
    SELECT barbershop_id INTO v_barbershop_id FROM public.customers WHERE id = p_customer_id;
    
    -- Apenas staff atribui ou remove pontos manualmente/via fechamento
    IF NOT is_barbershop_staff(auth.uid(), v_barbershop_id) THEN
        RAISE EXCEPTION 'Acesso negado: apenas staff da barbearia pode ajustar pontos de fidelidade';
    END IF;

    SELECT points INTO v_current_points FROM public.loyalty_balances WHERE customer_id = p_customer_id FOR UPDATE;
    
    IF (v_current_points + p_points) < 0 THEN
        RAISE EXCEPTION 'Pontos insuficientes: o saldo não pode ficar negativo';
    END IF;

    UPDATE public.loyalty_balances 
    SET points = points + p_points,
        lifetime_points = CASE WHEN p_points > 0 THEN lifetime_points + p_points ELSE lifetime_points END,
        updated_at = NOW()
    WHERE customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
