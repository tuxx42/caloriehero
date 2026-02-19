# CalorieHero

Macro-matched food delivery. Turborepo + pnpm monorepo.

## Layout

- `apps/api` — Fastify + Drizzle (PostgreSQL) + Redis
- `apps/admin` — Next.js + shadcn/ui
- `apps/mobile` — Expo + NativeWind
- `packages/shared-types` — Zod schemas, shared types
- `packages/meal-plan-engine` — Pure macro matching logic, zero deps
- `packages/poster-client` — Poster POS API v3 client

## Commands

```bash
pnpm turbo build          # Build all
pnpm turbo test           # Vitest all
pnpm turbo typecheck      # Type-check all
pnpm turbo dev            # Dev servers
```

## Rules

- Vitest for all tests. Write tests first.
- All types/schemas in `@caloriehero/shared-types`. No `any`.
- API routes: `/api/v1/*`. Health: `/health`.
- External services (Stripe, Poster): interface + real + mock impl. Tests use mocks.
- Zod-validated env vars in `apps/api/src/config/env.ts`.
- Drizzle ORM. Migrations via `drizzle-kit`.
- Auth: Google OAuth only. API verifies Google ID tokens, issues JWTs. Tests mock via `buildApp({ useMockAuth: true })`.
- SSE for realtime (not WebSocket). Redis pub/sub for broadcast.
- Poster is polled for status (no webhooks). Stripe uses webhooks.

## Order Flow

Create → Stripe pay → on `payment_intent.succeeded` → push to Poster POS → poll Poster for status → Redis pub/sub → SSE to client.

### Documentation

Update the documentation folder docs/ on all major milestones and addtions to the project. Update the architecture.md if architecture choices change. Also keep changelog.md updated on major changes. Keep a written log in the project_status.md file of what has been done last.
