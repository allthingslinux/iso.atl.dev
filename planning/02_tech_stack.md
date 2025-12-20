# Tech Stack & Tooling

## Core Frameworks
*   **Frontend**: **Next.js 16** (App Router)
    *   *Why*: React Server Components (RSC) perfect for SEO-heavy archive pages; industry standard.
*   **Backend API**: **Hono**
    *   *Why*: Ultra-lightweight, built for Edge standards (works perfectly on Cloudflare Workers), faster than Express/Fastify.
    *   **Torrent Lib**: `webtorrent` or `bittorrent-protocol` (Node.js compatible) for parsing/generating metadata.
*   **API Layer**: **tRPC**
    *   *Why*: End-to-end type safety. The Frontend imports *types* directly from the Backend workspace via Turborepo, eliminating "API Drift" bugs.
    *   *Decision*: **CONFIRMED**. Hono exports `AppRouter` type; Next.js consumes it. Upgraded to **tRPC v11** and **TanStack Query v5**.

## Database & Data
*   **Database**: **PostgreSQL** (e.g., Neon or Supabase)
    *   *Why*: Relational data (ISOs have Versions, Versions have Distros) fits perfectly. JSONB support for flexible metadata.
*   **ORM**: **Drizzle ORM**
    *   *Why*: Lightweight, "serverless-ready", lower cold starts than Prisma, great TypeScript support.
*   **Search**: **Algolia**
    *   *Why*: Best-in-class faceted search UI, instant results, hosted complexity handling.
*   **Storage**: **Google Drive API**
    *   *Context*: 100TB Non-Profit plan.
    *   *Usage*: Storing binaries. We will likely need a proxy or signed-url generator to serve these if direct Drive links hit rate limits.

## Infrastructure & DevOps
*   **Runtime/Host**: **Cloudflare Workers** (Backend) + **Cloudflare Pages** (Frontend)
    *   *Why*: Edge performance, low latency globally, cost-effective for high-traffic read-heavy sites.
*   **Authentication**: **Keycloak** (Existing ATL Infrastructure)
    *   *Integration*: OpenID Connect (OIDC) integration.
*   **Monitoring**: **Sentry** (Non-profit plan)
    *   *Scope*: Frontend errors + Backend exceptions.

## UI / UX Libraries
*   **Component System**: **ShadCN UI** (Radix Primitives + Tailwind)
    *   *Why*: Accessible, copy-paste customization, clean aesthetic.
*   **Styling**: **Tailwind CSS**
*   **Linting/Formatting**: **Ultracite** (Biome)
    *   *Decision*: **FULL INTEGRATION**. Enforced via `pnpm fix` and CI build steps. Replaced ESLint/Prettier.
*   **State Management**:
    *   **NUQS (Nuqs)**: URL-based state management for Search Filters (essential for deep-linking search results).
    *   **Zustand**: Client-side interactive state (if needed).
