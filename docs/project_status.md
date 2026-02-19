# CalorieHero - Project Status

## Last Updated: 2026-02-20

## Current Phase: Complete (All Phases Done)

### Completed

#### Phase 0: Monorepo Scaffolding
- Turborepo + pnpm workspace with 3 apps + 3 packages
- TypeScript config (ES2022, strict, bundler moduleResolution)
- Docker Compose (PostgreSQL 16 + Redis 7)
- Build pipeline verified: `pnpm turbo build` / `typecheck` / `test`

#### Phase 1: Shared Types & Domain Models
- 8 domain schemas (meals, users, orders, subscriptions, meal-plans, delivery, poster, payments)
- Engine types (tolerance, scoring weights, macro constraints, plan request/result)
- API contracts (request schemas, response schemas, error schemas)
- 37 tests passing

#### Phase 2: Meal Plan Engine
- Per-meal matching: filter → score → rank pipeline
- Daily plan optimization: branch-and-bound with pruning
- Slot allocation with configurable percentages
- 75 tests passing (including performance benchmarks: 200 meals / 4 slots < 100ms)

#### Phase 3: API Foundation & Database
- Fastify app factory with testable `buildApp()` pattern
- Drizzle ORM schemas for all tables
- Google OAuth auth (mock auth for tests)
- CRUD routes for meals (admin write, public read) and users
- Service layer pattern: routes → services → database
- 34 tests passing (base)

#### Phase 3.5: Admin Dashboard (Preview)
- Next.js + Tailwind CSS dashboard with sidebar navigation
- Dashboard page with stats cards + mock order queue
- Meals management page with table, search, CRUD modal form
- Placeholder pages for orders, customers, delivery, subscriptions, analytics
- Running at localhost:3000

#### Phase 4: API Integrations
- Poster POS client package: HTTP client with retries, incoming orders, products, status polling
- Stripe integration: PaymentIntents, webhook handling (payment_intent.succeeded)
- Engine wiring: matching and plan generation routes
- Order service: full order lifecycle (create → pay → push to POS → track)
- Payment service: provider interface + Stripe + mock implementation
- Poster service: provider interface + real + mock implementation
- Subscription service: create, pause, resume, cancel
- Delivery service: zones, slots, Haversine distance, optimistic booking
- 23 poster-client tests + 95 new API tests

#### Phase 5: Real-Time
- SSE manager for order tracking connections
- Redis pub/sub for multi-instance broadcasting
- Cache service with TTL (meals, delivery slots, pattern invalidation)
- SSE route: GET /api/v1/sse/orders/:orderId (auth + ownership check)
- 36 SSE/Redis/cache tests

#### Phase 6: Admin Dashboard (Full)
- API client (`lib/api.ts`) wrapping all Fastify endpoints
- React hooks (`hooks/use-api.ts`) with fallback to mock data
- Dashboard: wired to real orders API with live stats
- Meals: full CRUD via API (create, update, delete)
- Orders: table with status badges, SSE live indicator
- Customers: table joined with subscription status
- Subscriptions: table with schedule, macro targets
- Delivery: zones cards + slots table with capacity bars
- Analytics: stat cards + CSS bar charts (category distribution, order status)
- Graceful degradation: amber banner on API error, falls back to mock data

#### Phase 7: Mobile App
- Zustand stores: auth (persisted to AsyncStorage), cart
- API client with auto auth token attachment
- 13 screens via Expo Router file-based routing
- Auth: login with mock Google sign-in, auth guard redirect
- 4-tab navigator: Home, Meals, Plan, Profile
- Meals browser: FlatList with category filter tabs
- Meal plan generator: calls matching API, shows slot breakdown
- Profile: macro targets, fitness goal, allergies, dietary preferences
- Meal detail modal: macros, allergens, add-to-cart with quantity
- Cart + Checkout: quantity controls, order placement
- Order tracking: progress steps with 15s polling
- Shared components: MacroBar, MealCard, StatusBadge

#### Phase 8: Production Hardening
- GitHub Actions CI: lint + typecheck + test on push/PR to main
- Dockerfiles: API (multi-stage build), Admin (Next.js standalone)
- .dockerignore for clean Docker builds
- Rate limiting plugin (@fastify/rate-limit): 100 req/min per IP, disabled in tests
- Request logger plugin: logs method/url/status/responseTime, skips /health
- EAS Build config for mobile (development, preview, production profiles)
- E2E tests: order flow (4), matching flow (3), subscription flow (3)
- Rate limit tests (2)
- 12 new tests total

## Test Summary

| Package | Tests |
|---------|-------|
| shared-types | 37 |
| meal-plan-engine | 75 |
| poster-client | 23 |
| api | 129 |
| admin | 0 (no tests yet) |
| mobile | 0 (no tests yet) |
| **Total** | **264** |
