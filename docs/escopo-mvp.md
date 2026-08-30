# Relatório de Escopo MVP e Auditoria de Segurança (RLS)

O sistema expandiu significativamente além do escopo principal (MVP) de agendamentos. Módulos avançados foram desenvolvidos, o que adiciona complexidade à interface e, mais criticamente, aumenta a superfície de ataque por vulnerabilidades nas políticas de Row Level Security (RLS).

Este relatório lista o que pertence ao MVP, o que está fora (e seu status de segurança) e as recomendações de contenção usando Feature Flags.

---

## 1. Escopo Central (O MVP)

Estas funcionalidades e tabelas compõem o fluxo crítico e **devem ser mantidas 100% ativas**:

**Cliente Final (App Mobile-First):**
- **Home (Mapa/Busca):** src/routes/index.tsx
- **Perfil da Barbearia / Profissional:** src/routes/b..tsx, src/routes/b..p..tsx
- **Fluxo de Agendamento:** src/routes/agendar.tsx
- **Painel do Cliente:** src/routes/minha-conta.tsx (Meus horários, Perfil)
- **Favoritos (Clube VIP):** src/routes/clube.tsx

**Barbearia (Admin/SaaS):**
- **Onboarding e Configurações:** src/routes/admin.onboarding.tsx, src/routes/admin.configuracoes.tsx
- **Gestão de Agenda:** src/routes/admin.agenda.tsx
- **Serviços e Produtos:** src/routes/admin.servicos.tsx, src/routes/admin.estoque.tsx
- **Equipe (Profissionais, Folgas):** src/routes/admin.profissionais.tsx, src/routes/admin.equipe.tsx, src/routes/admin.folgas.tsx

---

## 2. Módulos Extras (Fora do MVP) e Auditoria de RLS

Abaixo, os módulos que transcendem o MVP, suas respectivas tabelas e a avaliação de risco das regras no Supabase.

### 🔴 CRÍTICO / VULNERÁVEL (Risco de Fraude)

1. **Carteira (Cashback) & Fidelidade** (/admin/carteira, /admin/fidelidade)
   - **Tabelas:** wallet_balances, wallet_transactions, loyalty_balances, loyalty_transactions, customer_subscriptions
   - **Status RLS:** **FROUXO (Vulnerabilidade Crítica)**
   - **Motivo:** A política FOR ALL TO public utiliza a validação EXISTS (SELECT 1 FROM customers c WHERE c.id = ... AND c.profile_id = auth.uid()). Como é um FOR ALL, o **próprio cliente tem permissão de UPDATE e INSERT**. Um cliente mal-intencionado pode fazer uma requisição via API para alterar o próprio saldo na carteira para R$ 1.000.000 ou inserir pontos de fidelidade falsos infinitos.

2. **Comissões** (/admin/comissoes)
   - **Tabelas:** commissions
   - **Status RLS:** **FROUXO (Vulnerabilidade Interna)**
   - **Motivo:** Similar ao acima, a política FOR ALL libera acesso total ao profissional logado (EXISTS (SELECT 1 FROM professionals ... profile_id = auth.uid())). O profissional tem acesso de UPDATE e INSERT nas próprias comissões, podendo fraudar seus ganhos no sistema.

### 🟡 MODERADO (Suscetível a Abuso/Spam)

3. **Assistente Aurora AI** (AuroraDrawer, /admin/aurora)
   - **Tabelas:** oice_sessions, oice_messages
   - **Status RLS:** Seguro para isolamento (cada um só lê os seus), mas **Frouxo contra Spam**.
   - **Motivo:** Permite INSERT TO anon. Usuários não autenticados (ou bots) podem sobrecarregar o banco de dados e onerar APIs de voz/texto da OpenAI sem restrições ou limites de quota por IP na camada de banco de dados.

4. **Cupons de Desconto** (/admin/cupons)
   - **Tabelas:** coupons, coupon_redemptions
   - **Status RLS:** Seguro (Apenas staff edita cupons). O resgate (coupon_redemptions) é validado.
   - **Motivo de cautela:** Sem rate limit ou controle de "1 por cliente" bem travado via *Database Constraint/Trigger*, a camada de API pode sofrer concorrência e abuso no resgate.

### 🟢 SEGURO (Apenas Excesso de Escopo)

5. **Caixa e PDV** (/admin/caixa, /admin/pdv)
   - **Tabelas:** cash_sessions, cash_transactions
   - **Status RLS:** Seguro. Amarrado corretamente à função is_barbershop_staff e à role de membro da barbearia (arbershop_members).

6. **Avaliações Pós-Corte** (/admin/avaliacoes, /avaliar)
   - **Tabelas:** satisfaction_surveys
   - **Status RLS:** Seguro. Insert restrito apenas a clientes autenticados e vinculados a um agendamento real.

7. **Pacotes e Portfólio** (/admin/pacotes, /admin/portfolio)
   - **Tabelas:** packages, portfolio_items
   - **Status RLS:** Seguro. Leitura pública; gerenciamento (INSERT, UPDATE, DELETE) estritamente travado para a staff da barbearia.

---

## 3. Recomendações de Ação

Para reduzir riscos e manter o foco no MVP (sem deletar código valioso de longo prazo):

1. **Implementar "Feature Flags" Globais no Frontend:**
   - Criar um objeto de configuração (ex: eatures.ts) para ocultar todos os botões e links de rotas dos módulos extra (Caixa, PDV, Comissões, Fidelidade, Carteira, Cupons, Pacotes, Avaliações, Assistente Aurora).
   - O painel lateral (AdminSidebar) ficará muito mais limpo e amigável para o barbeiro na fase de lançamento.
   
2. **Desativação Compulsória (Obrigatória):**
   - **Fidelidade, Carteira e Comissões** NÃO podem ser lançados sob nenhuma hipótese com o esquema atual do banco de dados. 
   - Antes de reativar esses módulos no futuro, será obrigatório reescrever as policies, separando:
     - FOR SELECT TO public (clientes apenas lêem seu saldo).
     - FOR ALL TO authenticated WITH CHECK (is_barbershop_staff(...)) (somente a loja credita/debita saldos de clientes).

3. **Aurora AI:**
   - Desligar completamente via Feature Flag para o MVP, protegendo os custos operacionais (OpenAI) e o banco de dados até a implantação de um sistema robusto de rate-limiting (ex: Cloudflare Turnstile, ou Redis limiters no backend).
