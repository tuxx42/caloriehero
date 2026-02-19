# CalorieHero Architecture

## What It Is

A food delivery platform where a single kitchen prepares meals matched to each customer's calorie and macro targets. Customers order on-demand or subscribe for recurring deliveries. The kitchen receives orders through Poster POS.

## System Overview

```
┌─────────────┐    ┌─────────────┐
│  Mobile App │    │   Admin UI  │
│  (Expo)     │    │  (Next.js)  │
└──────┬──────┘    └──────┬──────┘
       │                  │
       │   Google OAuth   │
       └────────┬─────────┘
                │ HTTPS
                ▼
        ┌───────────────┐
        │  Fastify API  │
        └───┬───┬───┬───┘
            │   │   │
    ┌───────┘   │   └───────┐
    ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌──────────┐
│Postgres│ │ Redis  │ │ External │
│(Drizzle)│ │        │ │ Services │
└────────┘ └────────┘ └──────────┘
                        │
                ┌───────┼───────┐
                ▼       ▼       ▼
            Stripe   Poster   Google
                      POS     OAuth
```

## Components

### Mobile App (`apps/mobile`)

Expo/React Native app for customers. Expo Router for navigation, NativeWind for styling.

- **Onboarding**: Fitness goal → macro targets → allergies → dietary preferences
- **Meal browsing**: Each meal displays a 0-1 match score against user's macro targets
- **Plan generation**: Request a full day's plan optimized across meal slots
- **Cart & checkout**: Zustand for cart state, Stripe React Native SDK for payment
- **Order tracking**: SSE connection for real-time status updates
- **Subscriptions**: Create, pause, resume, cancel recurring meal plans

Auth tokens stored in `expo-secure-store`. Server state via React Query.

### Admin Dashboard (`apps/admin`)

Next.js app for kitchen/operations staff.

- **Menu management**: CRUD meals with full nutritional data (calories, protein, carbs, fat per serving)
- **Order queue**: Live order feed via SSE, status management
- **Customer management**: View profiles, order history, subscriptions
- **Delivery zones & slots**: Configure where and when deliveries happen
- **Analytics**: Revenue, popular meals, macro distribution across orders

### API (`apps/api`)

Fastify server. All routes prefixed `/api/v1/`. Zod validation on all inputs.

```
Routes
├── /health, /ready              — health checks
├── /api/v1/auth/google          — Google OAuth token exchange → JWT
├── /api/v1/meals                — CRUD (admin write, public read)
├── /api/v1/users/me             — current user + profile
├── /api/v1/matching/meals       — per-meal macro matching
├── /api/v1/matching/plan        — daily plan optimization
├── /api/v1/orders               — create, list, get
├── /api/v1/subscriptions        — create, list, pause, resume, cancel
├── /api/v1/delivery-slots       — available slots + capacity
├── /api/v1/sse/orders/:id       — SSE stream for order tracking
└── /webhooks/stripe             — Stripe webhook (signature verified)
```

Architecture is layered: routes → services → database. Services contain business logic. Routes handle HTTP concerns. No business logic in routes.

### Shared Types (`packages/shared-types`)

Zod schemas are the source of truth for all domain types. TypeScript types derived via `z.infer<>`. Consumed by all three apps.

Domains: meals, users, orders, subscriptions, meal plans, delivery, payments, engine types, API request/response contracts.

### Meal Plan Engine (`packages/meal-plan-engine`)

Pure TypeScript. Zero dependencies (only imports types from shared-types). Two modes:

**Per-meal matching:**
```
Input: user's macro targets + available meals
Pipeline: filter(allergens, dietary) → score(weighted macro distance) → rank
Output: meals sorted by score (0-1, where 1 = perfect match)
```

**Daily plan optimization:**
```
Input: daily macro targets + meal slots + available meals
Slots: breakfast (25%), lunch (35%), dinner (30%), snack (10%)
Method: branch-and-bound with pruning
Output: one meal per slot minimizing total macro deviation
Constraint: < 100ms for 200 meals across 5 slots
```

Scoring is weighted Euclidean distance across calories, protein, carbs, and fat, normalized to 0-1.

### Poster Client (`packages/poster-client`)

HTTP client wrapping Poster POS API v3. Handles auth, retries, and rate limits.

- `createIncomingOrder()` — push order to kitchen
- `getOrder()` — poll order status
- `getProducts()` — sync menu items

No webhooks — Poster requires app store publishing for those. We poll active orders on an interval instead.

## Data Flow

### On-Demand Order

```
Customer places order
        │
        ▼
API validates → creates order (status: pending_payment)
        │
        ▼
Stripe PaymentIntent created → customer pays
        │
        ▼
Stripe webhook: payment_intent.succeeded
        │
        ▼
API updates order (status: confirmed) → pushes to Poster POS
        │
        ▼
Poller checks Poster for status changes
        │
        ▼
Status update → write to DB → publish to Redis pub/sub
        │
        ▼
SSE manager → push to customer's open connection
```

### Subscription

```
Customer selects plan + delivery schedule
        │
        ▼
Stripe Subscription created (recurring billing)
        │
        ▼
On each billing cycle: Stripe invoice.paid webhook
        │
        ▼
API auto-generates orders for the upcoming delivery window
        │
        ▼
Orders follow the same Poster → poll → SSE flow
```

### Plan Generation

```
Customer requests daily plan
        │
        ▼
API loads user profile (macros, allergies) + available meals from DB
        │
        ▼
Meal plan engine: allocate daily macros across slots → optimize
        │
        ▼
Return plan with scored meals per slot
        │
        ▼
Customer reviews → accepts → creates order for all items
```

## Auth

Google OAuth only. No passwords, no email/password, no other providers.

```
Client: Google Sign-In → receives Google ID token
        │
        ▼
API: POST /api/v1/auth/google { idToken }
        │
        ▼
Verify token with google-auth-library
        │
        ▼
Find or create user in PostgreSQL
        │
        ▼
Return signed JWT (used for all subsequent API calls)
```

JWTs are stateless. API middleware verifies signature on every request. Admin users have an `isAdmin` flag on the user record.

## Real-Time

SSE (Server-Sent Events), not WebSocket. Reasons: unidirectional (server → client), auto-reconnection built into the protocol, simpler infrastructure, works over HTTP/2.

```
Client opens SSE connection: GET /api/v1/sse/orders/:id
        │
        ▼
API holds connection open, registers in SSE manager
        │
        ▼
Order status changes → Redis PUBLISH on channel order:{id}
        │
        ▼
All API instances SUBSCRIBE → SSE manager pushes to connected clients
```

Redis pub/sub enables horizontal scaling — any API instance can receive the status change and broadcast to its connected clients.

## Caching

Redis caches frequently-read, rarely-changed data:

- **Meal catalog**: cached on read, invalidated on admin write
- **Delivery slots**: cached with short TTL, invalidated when capacity changes
- **User profiles**: cached per-user, invalidated on update

Cache-aside pattern: check Redis → miss → query Postgres → write to Redis → return.

## Database

PostgreSQL with Drizzle ORM. Key tables:

```
meals              — id, name, category, nutritional data, allergens, dietary tags, price, active
users              — id, google_id, email, name, is_admin, created_at
user_profiles      — user_id, macro_targets, fitness_goal, allergies, dietary_preferences
orders             — id, user_id, status, type (on_demand|subscription), total, poster_order_id
order_items        — order_id, meal_id, quantity, unit_price
subscriptions      — id, user_id, stripe_subscription_id, status, schedule, plan_config
meal_plans         — id, user_id, date, total_score
meal_plan_items    — plan_id, meal_id, slot, score
delivery_slots     — id, date, time_range, zone_id, capacity, booked_count
delivery_zones     — id, name, polygon, active
```

All tables have `created_at` / `updated_at`. Soft delete via `deleted_at` where appropriate.

## External Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| Stripe | Payments (one-time + recurring) | PaymentIntents, Subscriptions, webhooks |
| Poster POS | Kitchen order management | Push orders via API, poll for status |
| Google OAuth | Authentication | ID token verification |

All external services have an interface + real + mock implementation. Tests always use mocks. The `buildApp()` factory selects implementation based on config.
