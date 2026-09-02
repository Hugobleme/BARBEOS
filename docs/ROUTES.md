# BARBEOS Routes Documentation

This document lists all available routes in the TanStack Router structure (`src/routes/`).

## Public Routes
- `/` (`index.tsx`): Main landing page.
- `/barbearias` (`barbearias.tsx`): List of available barbershops.
- `/agendar` (`agendar.tsx`): Primary scheduling/booking flow for customers.
- `/b/:slug` (`b.$slug.tsx`): Direct link for a specific barbershop.
- `/b/:slug/p/:proSlug` (`b.$slug.p.$proSlug.tsx`): Direct link for a specific professional.
- `/login` (`login.tsx`): User and admin authentication.
- `/cadastro` (`cadastro.tsx`): Registration page.
- `/recuperar-senha` (`recuperar-senha.tsx`): Password recovery.
- `/minha-conta` (`minha-conta.tsx`): User profile and past appointments.
- `/avaliar/:appointmentId` (`avaliar.$appointmentId.tsx`): Feedback/rating submission for appointments.
- `/clube` (`clube.tsx`): Loyalty club info.
- `/bio` (`bio.tsx`): Social link tree for barbershops.
- `/para-barbearias` (`para-barbearias.tsx`): Marketing landing page targeting barbershop owners.
- `/ajuda`, `/termos`, `/privacidade`: Institutional pages.

## Admin Routes (`/admin/*`)
All routes require authentication and a valid `shopId` context.
- `/admin` (`admin.tsx`): Admin layout and tenant wrapper.
- `/admin/` (`admin.index.tsx`): Dashboard (KPIs, charts).
- `/admin/agenda` (`admin.agenda.tsx`): Calendar management.
- `/admin/servicos` (`admin.servicos.tsx`): Service catalog.
- `/admin/profissionais` (`admin.profissionais.tsx`): Team management.
- `/admin/equipe` (`admin.equipe.tsx`): Staff list and permissions.
- `/admin/clientes` (`admin.clientes.tsx`): CRM and customer list.
- `/admin/caixa` (`admin.caixa.tsx`): Financial flow (cash register).
- `/admin/comissoes` (`admin.comissoes.tsx`): Commission reports.
- `/admin/estoque` (`admin.estoque.tsx`): Product inventory.
- `/admin/pdv` (`admin.pdv.tsx`): Point of Sale (POS) system.
- `/admin/relatorios` (`admin.relatorios.tsx`): Detailed analytics.
- `/admin/fidelidade` (`admin.fidelidade.tsx`): Loyalty program management.
- `/admin/cupons` (`admin.cupons.tsx`): Discount coupons.
- `/admin/pacotes` (`admin.pacotes.tsx`): Service packages.
- `/admin/carteira` (`admin.carteira.tsx`): Professional wallet.
- `/admin/folgas` (`admin.folgas.tsx`): Time-off requests.
- `/admin/avaliacoes` (`admin.avaliacoes.tsx`): Customer reviews overview.
- `/admin/portfolio` (`admin.portfolio.tsx`): Gallery of haircuts.
- `/admin/franquia` (`admin.franquia.tsx`): Multi-tenant management for franchises.
- `/admin/horarios` (`admin.horarios.tsx`): Barbershop opening hours.
- `/admin/configuracoes` (`admin.configuracoes.tsx`): System settings.
- `/admin/onboarding` (`admin.onboarding.tsx`): Setup wizard for new tenants.

## API Routes (`/api/*`)
Backend/Serverless handlers:
- `/api/voice/chat`
- `/api/voice/session`
- `/api/voice/end-session`

## Deprecated Routes
- *(No active deprecated routes currently marked in the router tree)*
- `sitemap.xml.ts` handles dynamic SEO indexing rather than a UI route.
