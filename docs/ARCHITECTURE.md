# BARBEOS Architecture

## Tech Stack
- **Framework:** TanStack Start (React 19, Server-Side Rendering via Nitro)
- **Routing:** TanStack Router (File-based routing)
- **State Management:** TanStack Query (React Query)
- **Styling:** Tailwind CSS v4 + Radix UI Primitives
- **Backend & Database:** Supabase (PostgreSQL, GoTrue Auth, Realtime, Storage)
- **Language:** TypeScript
- **Deployment:** Vercel (Nitro preset)

## Folder Structure
- `src/components/`: Reusable React components (UI library, shared layout components, etc.)
- `src/routes/`: Application pages following TanStack Router conventions
- `src/services/`: Supabase database interactions (abstracts data fetching logic)
- `src/hooks/`: Custom React Hooks (queries, state, auth context)
- `src/integrations/`: Third-party clients (Supabase setup, Lovable config)
- `src/lib/`: Utility functions (formatting, validation, error handling)
- `public/`: Static assets (images, icons, PWA manifest)
- `docs/`: Project documentation

## Tenant Model
The application uses a multi-tenant architecture based on the `shopId` (`barbershop_id`).
- Each barbershop owner controls their own space.
- A `useCurrentShop()` hook manages active context.
- All admin views and data mutations are strictly gated by `shopId`.
- **Database (RLS):** Supabase Row Level Security ensures that authenticated users can only query/modify records associated with their `barbershop_id` or tenant role.

## Auth Flow
- Handled by Supabase Auth (GoTrue).
- Middleware extracts tokens and validates session.
- `useAuth()` custom hook provides global user state.
- Unauthenticated access to `/admin` routes auto-redirects to `/login`.

## Deployment
- Optimized for serverless via **Vercel** with the **Nitro** builder.
- CI/CD managed by GitHub Actions (`.github/workflows/ci.yml`).
- PWA Support with `vite-plugin-pwa` for mobile-app-like installation.
