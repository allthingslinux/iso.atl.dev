# iso.atl.dev

## Architecture

The project is structured as a Turborepo-managed TypeScript monorepo:

### Applications
- **`apps/web`**: Next.js frontend providing a faceted search interface and rich metadata views.
- **`apps/api`**: Hono-based API deployed as Cloudflare Workers for edge-optimized metadata serving.

### Packages
- **`packages/api`**: Shared tRPC router and business logic.
- **`packages/db`**: Database schema and client using Drizzle ORM and Postgres.
- **`packages/ui`**: Shared React components and design system built with Tailwind CSS.
- **`packages/validators`**: Reusable Zod schemas for cross-application consistency.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **API**: [Hono](https://hono.dev) & [tRPC](https://trpc.io)
- **Database**: [Postgres](https://www.postgresql.org) & [Drizzle ORM](https://orm.drizzle.team)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) & [Radix UI](https://www.radix-ui.com)
- **Validation**: [Zod](https://zod.dev)
- **Monorepo Tooling**: [Turborepo](https://turbo.build) & [pnpm](https://pnpm.io)

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 10.0.0

### Installation

```bash
pnpm install
```

### Development

Run the entire stack in development mode:

```bash
pnpm dev
```

Target specific applications:

```bash
# Web only
pnpm dev:web

# API only
pnpm dev:api
```

### Database Management

Commands are proxied via pnpm to the database package:

```bash
pnpm db:generate  # Generate migrations
pnpm db:push      # Push schema changes
pnpm db:studio    # Open Drizzle Studio
```

