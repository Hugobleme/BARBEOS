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
   - **Agenda (`/admin/agenda`):** VisÃ£o diÃ¡ria e semanal com atualizaÃ§Ã£o em tempo real (Supabase Realtime) e alteraÃ§Ã£o de status (_Agendado, Em atendimento, ConcluÃ­do, Cancelado, No-Show_).
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

| VariÃ¡vel                | DescriÃ§Ã£o                                    | Exemplo                           |
| :----------------------- | :--------------------------------------------- | :-------------------------------- |
| `VITE_SUPABASE_URL`      | URL do seu projeto no Supabase                 | `https://xyzproject.supabase.co`  |
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

1. **Migrations & RLS:** Aplique as migraÃ§Ãµes SQL localizadas na pasta `supabase/migrations/` no painel do Supabase (_SQL Editor_) para garantir que todas as polÃ­ticas de seguranÃ§a (Row Level Security) e tabelas estejam ativas.
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

A home page do cliente utiliza a biblioteca leve **Leaflet** (
eact-leaflet) para exibir o mapa dinâmico de barbearias, consumindo os tiles gratuitos do OpenStreetMap/CartoDB.
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

---

## 🧪 End-to-End (E2E) Testing

### Framework: Playwright

The project uses **Playwright** for browser-level end-to-end automation across desktop and mobile viewports. Playwright was selected for its native multi-context concurrency support (critical for verifying atomic reservation conflicts) and resilient web-first assertions.

### Installation

Browsers are installed automatically or via:

```bash
npx playwright install --with-deps chromium
```

### Environment Variables

Configure in your `.env` or CI secrets (see [`.env.example`](./.env.example)):

- `E2E_BASE_URL`: Target base URL (default: `http://localhost:4173`).
- `E2E_WRITABLE_ENV`: Set to `true` **only** in an isolated writable staging or test database. Defaults to `false` to protect production data.
- `E2E_OWNER_EMAIL` & `E2E_OWNER_PASSWORD`: Test credentials for owner admin flows.
- `E2E_TEST_SHOP_SLUG`: Isolated test barbershop slug (default: `e2e-barbeos-test`).

### Running Tests

```bash
# Run all unit and E2E tests:
npm test

# Run Playwright E2E suite in headless mode:
npm run test:e2e

# Run with interactive Playwright UI:
npm run test:e2e:ui

# View HTML test execution report:
npm run test:e2e:report
```

### Non-Destructive Testing & CI Behavior

- **Default & CI Mode:** All public-route, unauthenticated guard, PDV rendering, and mobile smoke tests run against the local preview build without mutating any database records.
- **Writable / Destructive Mode:** Final booking write tests and concurrent reservation conflict tests (`Promise.all` two browser contexts) execute **only** when `E2E_WRITABLE_ENV=true` and dedicated credentials are provided; otherwise they are safely skipped.
- **Failure Artifacts:** Screenshots, traces, and videos are captured only on failure in `playwright-report/` and uploaded as CI workflow artifacts.

---

## 📊 Observability & Privacy-Safe Operational Diagnostics

BARBEOS includes a zero-overhead, privacy-first observability layer (`src/lib/observability.ts`, `src/lib/sanitize-error.ts`) designed to diagnose client, router, network, and atomic booking collisions without collecting sensitive user or authorization data.

### 🛡️ Privacy & Zero-PII Policy

All captured errors are aggressively sanitized before logging or transmission. The following items are strictly redacted:
- **Authentication & Secrets:** JWT tokens (`eyJ...`), Bearer tokens, Supabase anonymous/service keys, passwords, cookie/authorization headers (`[REDACTED_HEADER]`, `[REDACTED_JWT]`, `[REDACTED_SECRET]`).
- **Customer Personal Data (PII):** Full names, email addresses (`[REDACTED_EMAIL]`), Brazilian phone numbers in multiple formats (`[REDACTED_PHONE]`), and internal customer/user UUIDs (`[REDACTED_ID]`).
- **Query Parameters:** Query string keys including `token`, `auth`, `key`, `secret`, `password`, `email`, `phone`, and `customer_id` are redacted.
- **Message Bounds:** Error messages are capped at 200 characters with ellipsis. Stack traces are never logged in production.

### 🚀 Key Features

1. **Client & Server Containment:**
   - Client global listeners capture uncaught errors (`window.error`, `unhandledrejection`) safely.
   - React Error Boundary (`src/components/ErrorBoundary.tsx`) catches runtime render errors and presents a localized, friendly recovery screen without showing raw exceptions or stacks.
   - Server-side runtime (`src/server.ts`) outputs single-line structured JSON logs (`timestamp`, `source`, `operation`, `route`, `message`, `status`, `code`) omitting request bodies, query parameters, cookies, and authorization headers.

2. **Atomic Booking Conflict Tracking:**
   - Slot reservation collisions (`BOOKING_SLOT_TAKEN` / PostgreSQL `23P01`) are recorded as handled, retryable diagnostic events without persisting customer credentials.

3. **PWA Lifecycle Diagnostics:**
   - Service worker registration, update checks, and reload triggers are safely tracked via `reportPwaDiagnostic`.

4. **Deduplication & Rate Limiting:**
   - Sliding window (5 seconds) eliminates identical error spam.
   - Per-session budget (max 50 events) prevents client resource exhaustion.

### 📋 Incident Response Runbook

When diagnosing errors in production:
1. **Filter by Source:** Inspect logs by `source`: `"booking"` (slot conflicts), `"network"` (Supabase RPC/query failures), `"pwa"` (Service Worker lifecycle), `"ui"` (React components), `"router"` (TanStack Router).
2. **Examine `errorCode` & `status`:**
   - `BOOKING_SLOT_TAKEN` / `23P01` (Status 409): Expected atomic concurrency collision when two clients book the same slot simultaneously. The client is guided to pick another slot.
   - `42501`: PostgreSQL Row Level Security (RLS) violation. Verify RLS policies on the queried table or RPC.
   - `PGRST...`: PostgREST schema mismatch or parameter validation failure.
3. **Check `operation`:** Pinpoints the exact application function (e.g. `submit_public_booking`, `react_render`, `update_detected`).

---

## 🚀 Release Readiness & Health Checklist

Before and after every deployment to production, follow the standardized release sequence and runbooks:

### 📚 Official Runbooks
- [**Release Runbook**](./docs/RELEASE_RUNBOOK.md): Complete pre-merge, pre-deploy, Vercel verification, and rollback criteria.
- [**Production Smoke Test**](./docs/PRODUCTION_SMOKE_TEST.md): Manual, non-destructive step-by-step verification guide for owners and engineers.
- [**Incident Response Runbook**](./docs/INCIDENT_RESPONSE.md): Severity matrix (P0/P1/P2), safe logging policies, and response workflows.

### 🔄 Release Sequence
1. **Validate CI:** Ensure GitHub Actions CI passes completely (`lint`, `lint:icons`, `build`, `unit`, `e2e`).
2. **Confirm GitHub `main` commit:** Verify target commit hash is on `origin/main`.
3. **Confirm Vercel Ready deployment:** Verify deployment status is `Ready` on the production domain.
4. **Run production smoke test:** Execute non-destructive checks following [PRODUCTION_SMOKE_TEST.md](./docs/PRODUCTION_SMOKE_TEST.md) or run `npm run test:smoke:production`.
5. **Monitor sanitized errors:** Check observability logs for unexpected `booking`, `network`, or `ui` errors.
6. **Record incident or release result:** Fill in the smoke test template or file an incident report if issues are detected.

