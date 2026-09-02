[![CI](https://github.com/Hugobleme/BARBEOS/actions/workflows/ci.yml/badge.svg)](https://github.com/Hugobleme/BARBEOS/actions/workflows/ci.yml)
# ðŸ’ˆ BarberOS â€” Sistema de GestÃ£o & Agendamento para Barbearias Modernas

O **BarberOS** Ã© uma plataforma completa e moderna para barbearias, desenvolvida com **React 19**, **TypeScript**, **Vite**, **TanStack Router**, **TanStack Start (SSR)**, **Tailwind CSS v4** e **Supabase** como backend seguro e em tempo real.

---

## ðŸš€ Principais MÃ³dulos do Sistema

1. **ðŸ“± Portal PÃºblico & Agendamento:**
   - Vitrine de barbearias por cidade e bairro com busca em tempo real.
   - Perfil completo com galeria de fotos, catÃ¡logo de serviÃ§os, equipe de barbeiros e avaliaÃ§Ãµes de clientes.
   - Fluxo de agendamento online inteligente passo a passo.
   - Suporte a **PWA (Progressive Web App)** instalÃ¡vel no smartphone e desktop.

2. **âœ‚ï¸ Painel Administrativo:**
   - **Agenda (`/admin/agenda`):** VisÃ£o diÃ¡ria e semanal com atualizaÃ§Ã£o em tempo real (Supabase Realtime) e alteraÃ§Ã£o de status (*Agendado, Em atendimento, ConcluÃ­do, Cancelado, No-Show*).
   - **PDV / BalcÃ£o (`/admin/pdv`):** Registro de vendas de serviÃ§os e produtos com leitor de cupons, seleÃ§Ã£o de profissionais e comissÃµes automÃ¡ticas.
   - **Controle de Caixa (`/admin/caixa`):** Abertura, fechamento diÃ¡rio, sangrias e conciliaÃ§Ã£o por mÃ©todo de pagamento.
   - **Estoque & Produtos (`/admin/estoque`):** GestÃ£o de estoque com alertas de saldo mÃ­nimo e movimentaÃ§Ãµes rastreadas.
   - **ServiÃ§os & Barbeiros (`/admin/servicos`, `/admin/profissionais`):** CatÃ¡logo de serviÃ§os com duraÃ§Ãµes e preÃ§os em BRL, taxas de comissÃ£o e horÃ¡rios.
   - **Clientes & HistÃ³rico (`/admin/clientes`):** Perfil de clientes com histÃ³rico completo de agendamentos, gastos acumulados e controle de no-show.
   - **ComissÃµes (`/admin/comissoes`):** Extrato mensal de repasse de comissÃµes aos profissionais com aÃ§Ã£o de pagamento.
   - **Cupons de Desconto (`/admin/cupons`):** Campanhas promocionais em porcentagem ou valor fixo com validade e limites.
   - **Programa de Fidelidade (`/admin/fidelidade`):** AcÃºmulo automÃ¡tico de pontos por valor gasto e catÃ¡logo de recompensas resgatÃ¡veis.
   - **Pacotes & Assinaturas (`/admin/pacotes`):** Venda de combos prÃ©-pagos e dÃ©bito de sessÃµes.
   - **RelatÃ³rios Financeiros (`/admin/relatorios`):** MÃ©tricas de faturamento, ticket mÃ©dio, grÃ¡ficos de evoluÃ§Ã£o e rankings de clientes e serviÃ§os.

---

## ðŸ› ï¸ InstalaÃ§Ã£o Local

### PrÃ©-requisitos
- Node.js 18+ ou 20+
- Gerenciador de pacotes npm

### Passos
```bash
# 1. Clone o repositÃ³rio
git clone https://github.com/Hugobleme/BARBEOS.git
cd BARBEOS

# 2. Instale as dependÃªncias
npm install

# 3. Configure as variÃ¡veis de ambiente
cp .env.example .env
# Preencha suas credenciais do Supabase no arquivo .env

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

---

## ðŸŒ Deploy em ProduÃ§Ã£o

### 1. VariÃ¡veis de Ambiente NecessÃ¡rias
Configure as seguintes variÃ¡veis no painel da sua hospedagem (Vercel / Netlify):

| VariÃ¡vel | DescriÃ§Ã£o | Exemplo |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | URL do seu projeto no Supabase | `https://xyzproject.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave anÃ´nima pÃºblica (anon key) do Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |

---

### 2. Deploy na Vercel (Recomendado)

O repositÃ³rio jÃ¡ inclui o arquivo [`vercel.json`](./vercel.json) prÃ©-configurado:

1. Acesse [vercel.com](https://vercel.com) e conecte sua conta do GitHub.
2. Clique em **"Add New Project"** e selecione o repositÃ³rio `Hugobleme/BARBEOS`.
3. Na seÃ§Ã£o **"Environment Variables"**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Clique em **"Deploy"**.
5. O build executarÃ¡ `npm run build` e publicarÃ¡ a pasta `dist`.

---

### 3. Deploy no Netlify

O repositÃ³rio jÃ¡ inclui o arquivo [`netlify.toml`](./netlify.toml) configurado para SPA / SSR:

1. Acesse [netlify.com](https://netlify.com) e crie um novo site a partir do repositÃ³rio GitHub.
2. Nas configuraÃ§Ãµes de **Build & Deploy**:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Em **Site Configuration > Environment Variables**, adicione as variÃ¡veis do Supabase.
4. FaÃ§a o deploy.

---

### 4. Supabase & Banco de Dados em ProduÃ§Ã£o
1. **Migrations & RLS:** Aplique as migraÃ§Ãµes SQL localizadas na pasta `supabase/migrations/` no painel do Supabase (*SQL Editor*) para garantir que todas as polÃ­ticas de seguranÃ§a (Row Level Security) e tabelas estejam ativas.
2. **Backups:** No painel do Supabase, ative os backups automÃ¡ticos diÃ¡rios em **Settings > Database > Backups**.
3. **SSL / HTTPS:** Tanto a Vercel quanto o Netlify fornecem certificados SSL (HTTPS) gratuitos e automÃ¡ticos. O PWA e os Service Workers exigem HTTPS para funcionamento em produÃ§Ã£o.

---

## ðŸ“² PWA (Progressive Web App)

O BarberOS funciona como um aplicativo nativo em dispositivos mÃ³veis (Android e iOS) e Desktop:
- **Manifest:** Configurado em [`public/manifest.json`](./public/manifest.json).
- **Service Worker:** [`public/sw.js`](./public/sw.js) com cache de recursos estÃ¡ticos e suporte offline.
- **Como Testar o PWA:**
  1. No Google Chrome, abra a aplicaÃ§Ã£o e vÃ¡ em **DevTools (F12) > Application > Manifest**.
  2. Verifique se os Ã­cones, nome e `start_url` sÃ£o exibidos corretamente.
  3. Em **DevTools > Application > Service Workers**, teste o registro do Service Worker e o modo offline.
  4. Para depuraÃ§Ã£o avanÃ§ada, acesse `chrome://serviceworker-internals`.

---

## ðŸ“„ LicenÃ§a

Propriedade de BarberOS. Todos os direitos reservados.

## Mapas
A home page do cliente utiliza a biblioteca leve **Leaflet** (eact-leaflet) para exibir o mapa dinâmico de barbearias, consumindo os tiles gratuitos do OpenStreetMap/CartoDB.
Para utilizar Google Maps ou Mapbox no futuro, basta alterar a variável VITE_MAP_PROVIDER para google ou mapbox (requer extensão do MapProvider.tsx com o respectivo SDK da provedora).

## 🧹 Code Quality & Linting

### Missing Lucide Icon Imports Check
To prevent runtime crashes caused by using `<IconName />` components without importing them from `lucide-react`, we have a custom ESLint plugin (`eslint-plugin-barbeos`).

**How to run locally:**
```bash
npm run lint
# or specifically check a file:
npx eslint src/routes/admin.servicos.tsx
```

**Example Error Output:**
```text
126:14  error  Icon 'Info' is used but not imported from 'lucide-react'  barbeos/lucide-imports
```

This check runs automatically in CI during the build/test verification workflow.

