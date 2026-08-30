# Relatório Final: Verificação e Feature Flags (Módulos Extras)

## 1. Feature Flags (Ocultação Visual)
Foi implementado um arquivo de configuração central `src/config/featureFlags.ts` que permite ativar/desativar módulos extras via variáveis de ambiente.
As lógicas foram embutidas na `AdminSidebar`, filtrando as rotas da loja. Por padrão, **todos os módulos fora do MVP (caixa, pdv, comissoes, fidelidade, franquia, carteira, cupons, pacotes, avaliacoes, aurora) estão configurados como OFF (`false`)**.

> **⚠️ IMPORTANTE:** Como comentado no próprio código, ocultar botões e rotas no Frontend NÃO protege a aplicação contra interceptações e ataques diretos à API do Supabase. A segurança real sempre é estabelecida nas políticas de Row Level Security (RLS). As Feature Flags servem unicamente para simplificar a UX e esconder rotas em desenvolvimento.

## 2. Auditoria de RLS das Tabelas Restantes

As tabelas dos módulos previamente considerados "seguros" foram inspecionadas diretamente em suas *migrations* (SQL):

- **Caixa & PDV (`cash_sessions`, `cash_transactions`):** 🟢 Seguras. Ambas exigem validação `is_barbershop_staff` (ou cargo via `barbershop_members`) em suas cláusulas `USING` e `WITH CHECK` para operações de escrita (INSERT/UPDATE/DELETE).
- **Pacotes (`packages`):** 🟢 Segura. Leitura pública via `active = true` (SELECT); operações de escrita travadas apenas para a *staff*.
- **Portfólio (`portfolio_items`):** 🟢 Segura. Idem ao acima.
- **Avaliações (`satisfaction_surveys`):** 🟢 Segura. Inserção não é genérica. O RLS exige dinamicamente (`EXISTS`) que o usuário autenticado esteja comprovadamente vinculado a um `appointment` consolidado para emitir sua avaliação.

### 3. Exceções Detectadas & Corrigidas

Durante o pente-fino, encontrei e sinalizei vulnerabilidades residuais nos Cupons e na Aurora. Ambas foram solucionadas com a nova migration `20260830111501_fix_rls_modulos_extras.sql`:

- **Cupons (`coupon_redemptions`):** 
  - *Problema:* A tabela abria uma exceção `cr_guest_insert TO anon`, o que escancarava brechas para *brute-force* contra códigos de resgate por bots. 
  - *Solução:* Política anônima `DROP`ada. Somente clientes logados podem resgatar.
- **Assistente Aurora (`voice_sessions` e `voice_messages`):**
  - *Problema 1 (Acesso Anônimo):* A IA permitia `INSERT TO anon`, gerando um risco financeiro crítico de custos por requisições não rastreadas.
  - *Problema 2 (Ausência de Limites):* Sem um Rate Limit, qualquer usuário legítimo poderia rodar um script infinito de criações de sessões.
  - *Soluções:* Removido acesso anônimo absoluto. Criada a política `vs_self_insert_ratelimit` que checa o próprio banco: o usuário autenticado **só consegue disparar o INSERT se possuir menos de 5 sessões ativas criadas na última 1 hora**.
