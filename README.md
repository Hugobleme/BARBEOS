# 💈 BarberOS — Sistema de Gestão & Agendamento para Barbearias Modernas

O **BarberOS** é uma plataforma completa e moderna para barbearias, desenvolvida com **React 19**, **TypeScript**, **Vite**, **TanStack Router**, **TanStack Start (SSR)**, **Tailwind CSS v4** e **Supabase** como backend seguro e em tempo real.

---

## 🚀 Principais Módulos do Sistema

1. **📱 Portal Público & Agendamento:**
   - Vitrine de barbearias por cidade e bairro com busca em tempo real.
   - Perfil completo com galeria de fotos, catálogo de serviços, equipe de barbeiros e avaliações de clientes.
   - Fluxo de agendamento online inteligente passo a passo.
   - Suporte a **PWA (Progressive Web App)** instalável no smartphone e desktop.

2. **✂️ Painel Administrativo:**
   - **Agenda (`/admin/agenda`):** Visão diária e semanal com atualização em tempo real (Supabase Realtime) e alteração de status (*Agendado, Em atendimento, Concluído, Cancelado, No-Show*).
   - **PDV / Balcão (`/admin/pdv`):** Registro de vendas de serviços e produtos com leitor de cupons, seleção de profissionais e comissões automáticas.
   - **Controle de Caixa (`/admin/caixa`):** Abertura, fechamento diário, sangrias e conciliação por método de pagamento.
   - **Estoque & Produtos (`/admin/estoque`):** Gestão de estoque com alertas de saldo mínimo e movimentações rastreadas.
   - **Serviços & Barbeiros (`/admin/servicos`, `/admin/profissionais`):** Catálogo de serviços com durações e preços em BRL, taxas de comissão e horários.
   - **Clientes & Histórico (`/admin/clientes`):** Perfil de clientes com histórico completo de agendamentos, gastos acumulados e controle de no-show.
   - **Comissões (`/admin/comissoes`):** Extrato mensal de repasse de comissões aos profissionais com ação de pagamento.
   - **Cupons de Desconto (`/admin/cupons`):** Campanhas promocionais em porcentagem ou valor fixo com validade e limites.
   - **Programa de Fidelidade (`/admin/fidelidade`):** Acúmulo automático de pontos por valor gasto e catálogo de recompensas resgatáveis.
   - **Pacotes & Assinaturas (`/admin/pacotes`):** Venda de combos pré-pagos e débito de sessões.
   - **Relatórios Financeiros (`/admin/relatorios`):** Métricas de faturamento, ticket médio, gráficos de evolução e rankings de clientes e serviços.

---

## 🛠️ Instalação Local

### Pré-requisitos
- Node.js 18+ ou 20+
- Gerenciador de pacotes npm

### Passos
```bash
# 1. Clone o repositório
git clone https://github.com/Hugobleme/BARBEOS.git
cd BARBEOS

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Preencha suas credenciais do Supabase no arquivo .env

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

---

## 🌐 Deploy em Produção

### 1. Variáveis de Ambiente Necessárias
Configure as seguintes variáveis no painel da sua hospedagem (Vercel / Netlify):

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | URL do seu projeto no Supabase | `https://xyzproject.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima pública (anon key) do Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |

---

### 2. Deploy na Vercel (Recomendado)

O repositório já inclui o arquivo [`vercel.json`](./vercel.json) pré-configurado:

1. Acesse [vercel.com](https://vercel.com) e conecte sua conta do GitHub.
2. Clique em **"Add New Project"** e selecione o repositório `Hugobleme/BARBEOS`.
3. Na seção **"Environment Variables"**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Clique em **"Deploy"**.
5. O build executará `npm run build` e publicará a pasta `dist`.

---

### 3. Deploy no Netlify

O repositório já inclui o arquivo [`netlify.toml`](./netlify.toml) configurado para SPA / SSR:

1. Acesse [netlify.com](https://netlify.com) e crie um novo site a partir do repositório GitHub.
2. Nas configurações de **Build & Deploy**:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Em **Site Configuration > Environment Variables**, adicione as variáveis do Supabase.
4. Faça o deploy.

---

### 4. Supabase & Banco de Dados em Produção
1. **Migrations & RLS:** Aplique as migrações SQL localizadas na pasta `supabase/migrations/` no painel do Supabase (*SQL Editor*) para garantir que todas as políticas de segurança (Row Level Security) e tabelas estejam ativas.
2. **Backups:** No painel do Supabase, ative os backups automáticos diários em **Settings > Database > Backups**.
3. **SSL / HTTPS:** Tanto a Vercel quanto o Netlify fornecem certificados SSL (HTTPS) gratuitos e automáticos. O PWA e os Service Workers exigem HTTPS para funcionamento em produção.

---

## 📲 PWA (Progressive Web App)

O BarberOS funciona como um aplicativo nativo em dispositivos móveis (Android e iOS) e Desktop:
- **Manifest:** Configurado em [`public/manifest.json`](./public/manifest.json).
- **Service Worker:** [`public/sw.js`](./public/sw.js) com cache de recursos estáticos e suporte offline.
- **Como Testar o PWA:**
  1. No Google Chrome, abra a aplicação e vá em **DevTools (F12) > Application > Manifest**.
  2. Verifique se os ícones, nome e `start_url` são exibidos corretamente.
  3. Em **DevTools > Application > Service Workers**, teste o registro do Service Worker e o modo offline.
  4. Para depuração avançada, acesse `chrome://serviceworker-internals`.

---

## 📄 Licença

Propriedade de BarberOS. Todos os direitos reservados.
