# CalorieHero Architecture

## Overview

CalorieHero is a macro-matched food delivery platform. Users set daily macro targets (calories, protein, carbs, fat), and the system matches them with meals from partner restaurants, optimizing each day's combination to hit those targets as closely as possible.

The stack is:

- **Backend**: Python 3.12, FastAPI, SQLAlchemy (async), PostgreSQL 16, Redis 7
- **Frontend**: React 19, Vite 6, Tailwind CSS v4, React Router v7, Zustand 5
- **External Services**: Stripe (payments), Poster POS (restaurant orders), Google OAuth (authentication)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React SPA)                    │
│  React Router ← Zustand stores ← API client (fetch + JWT)      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / SSE
┌──────────────────────────▼──────────────────────────────────────┐
│                      Backend (FastAPI)                           │
│                                                                 │
│  Routes ──→ Services ──→ SQLAlchemy Models ──→ PostgreSQL       │
│    │            │                                                │
│    │            ├── Providers (Stripe, Poster) ──→ External APIs │
│    │            └── Engine (pure Python) ──→ Scoring/Optimizing  │
│    │                                                             │
│    └── SSE Manager ←── Redis Pub/Sub ←── Poster Poller          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture

### Layer Structure

```
app/
├── routes/          # HTTP endpoints (thin — validate, delegate, respond)
├── services/        # Business logic (orchestration, validation, state transitions)
├── providers/       # External service interfaces (Protocol + real + mock)
├── models/          # SQLAlchemy ORM models (database schema)
├── schemas/         # Pydantic v2 request/response models
├── engine/          # Meal plan optimization (pure Python, zero dependencies)
├── realtime/        # SSE connection manager + Redis pub/sub bridge
├── tasks/           # Background tasks (Poster poller)
├── middleware.py    # Rate limiting + request logging (pure ASGI)
├── dependencies.py  # FastAPI dependency injection (auth, DB sessions)
├── database.py      # SQLAlchemy async engine + session factory
├── redis.py         # Redis connection management
├── config.py        # Pydantic Settings (env validation)
└── main.py          # App factory + lifespan + router registration
```

**Data flows top-down**: Routes call Services, which use Models for persistence and Providers for external APIs. The Engine is called by Services but has no dependencies on any other layer.

### Database Models (12 tables)

```
users ──────────── user_profiles     (1:1)
  │
  ├── orders ──── order_items        (1:N, includes extra_protein/carbs/fat)
  │     └── payment_intents          (1:N)
  │
  ├── subscriptions                  (1:N)
  │
  └── meal_plans ── meal_plan_items  (1:N)

meals                                (standalone, includes per-meal pricing overrides)

delivery_zones ── delivery_slots     (1:N, referenced by orders)

app_settings                         (single-row, global per-gram macro pricing)
```

All tables use UUID primary keys and include `created_at`/`updated_at` timestamps where applicable.

### Authentication Flow

```
Client                   Backend                    Google
  │                        │                          │
  ├─ Google Sign-In ──────────────────────────────────▶
  ◀──────────────────── id_token ─────────────────────┤
  │                        │                          │
  ├─ POST /auth/google ───▶│                          │
  │    { id_token }        ├─ verify token ──────────▶│
  │                        ◀─ { sub, email, name } ──┤
  │                        │                          │
  │                        ├─ find_or_create user     │
  │                        ├─ sign JWT (sub=user.id)  │
  ◀─ { access_token, user }┤                          │
  │                        │                          │
  ├─ All API calls ───────▶│                          │
  │  Authorization: Bearer │                          │
  │                        ├─ decode JWT              │
  │                        ├─ load user from DB       │
  │                        ├─ inject into route       │
```

For testing, the auth system accepts tokens in format `test:<google_id>:<email>:<name>`, bypassing Google verification while still going through the full user creation flow.

### Order Lifecycle

```
pending_payment ──→ paid ──→ preparing ──→ ready ──→ delivering ──→ delivered
      │                                                                │
      └─────────────────────→ cancelled ◀──────────────────────────────┘
```

1. **Create Order**: Validate meals exist + are active, calculate per-item price (base + macro extras via pricing service), snapshot to order_items
2. **Pay**: Create Stripe PaymentIntent, return client_secret to frontend
3. **Webhook**: Stripe sends `payment_intent.succeeded` → mark order as `paid`
4. **Push to POS**: Send order to Poster POS restaurant system
5. **Poll**: Background task polls Poster for status changes (preparing → ready → delivering → delivered)
6. **Broadcast**: Status changes published via Redis pub/sub → SSE to connected clients

### Meal Plan Engine

The engine is a pure Python module with zero external dependencies. It solves: "Given a user's daily macro targets and a catalog of meals, find the optimal combination of meals across breakfast/lunch/dinner/snack slots."

**Pipeline:**

```
Daily Macro Targets
       │
       ▼
  Slot Allocator ──→ Distributes macros across 4 slots
       │              (breakfast 25%, lunch 35%, dinner 30%, snack 10%)
       │
       ▼
  Global Filter ──→ Remove meals with user allergens, enforce dietary tags
       │
       ▼
  Per-Slot Scoring ──→ Score each meal against each slot's macro targets
       │                (weighted deviation: cal 0.4, protein 0.3, carbs 0.15, fat 0.15)
       │
       ▼
  Branch & Bound Optimizer ──→ Find combination maximizing total score
       │                        (pre-sort by score, upper-bound pruning)
       │
       ▼
  Daily Plan (4 meals + total score + actual vs target macros)
```

**Scoring**: Each meal gets a 0-1 score per slot. Score = 1 - weighted_deviation. Deviation for each macro is `|actual - target| / target`, clamped to [0, 1].

### Real-Time Updates (SSE)

```
Poster Poller ──→ detects status change
       │
       ▼
  Redis PUBLISH "order:<id>" ──→ Redis Pub/Sub channel (if Redis available)
       │
       ▼
  SSE Manager ──→ routes message to subscribed asyncio.Queue
       │
       ▼
  EventSource Response ──→ pushes "status" event to client
```

- No WebSocket — SSE is simpler and sufficient for unidirectional server-to-client updates
- Each SSE connection gets its own `asyncio.Queue`
- 30-second heartbeat pings keep connections alive
- Auth token passed as query parameter (EventSource doesn't support custom headers)
- **Redis is optional**: When `REDIS_URL` is not set, pub/sub is skipped and SSE uses in-memory queues only (sufficient for single-instance deployments)

### External Service Pattern

All external services (Stripe, Poster) follow the Provider pattern:

```python
class PaymentProvider(Protocol):
    async def create_payment_intent(self, amount: float, currency: str, metadata: dict) -> PaymentResult: ...

class StripePaymentProvider:     # Production
class MockPaymentProvider:       # Tests (deterministic, no network)
```

This allows tests to run fast and deterministically without mocking HTTP calls. The mock implementations maintain minimal state (e.g., incrementing counters for payment intent IDs).

### Middleware

Two pure ASGI middleware layers (not `BaseHTTPMiddleware`, which causes issues with async DB connections):

- **RateLimitMiddleware**: 100 requests/minute per client IP. In-memory sliding window. Health endpoint exempt.
- **RequestLoggerMiddleware**: Logs `METHOD /path → status (duration_ms)`. Health endpoint exempt.

---

## Frontend Architecture

### Component Hierarchy

```
App
├── LoginPage (unauthenticated)
├── ProtectedRoute
│   ├── OnboardingPage (full-screen, no nav — first-login TDEE wizard)
│   └── AppLayout (with useOnboardingCheck redirect)
│       ├── HomePage
│       ├── MealsPage (+ MealCustomizer modal)
│       ├── CartPage (shows macro extras per item)
│       ├── CheckoutPage (sends extras in order)
│       ├── PlanGeneratorPage
│       ├── OrdersPage
│       ├── OrderTrackingPage (SSE)
│       └── ProfilePage (+ "Recalculate" macros link)
└── AdminRoute → AdminLayout
    ├── AdminDashboardPage
    ├── AdminMealsPage (+ pricing override columns)
    ├── AdminOrdersPage
    ├── AdminCustomersPage
    └── AdminPricingPage (global per-gram rates)
```

### State Management (Zustand)

| Store | Persistence | Purpose |
|-------|-------------|---------|
| `auth` | localStorage | JWT token + user object. Injected into API client. |
| `cart` | In-memory | Cart items + quantities + macro extras + pricing rates. Computed total/count/itemPrice. |
| `profile` | In-memory | Cached user profile (macro targets, preferences). |

### API Client

`src/api/client.ts` wraps `fetch` with:
- Base URL from Vite proxy (`/api/v1/`)
- Automatic `Authorization: Bearer <token>` header from auth store
- JSON serialization/deserialization
- Error extraction (reads `detail` from response body)

### Mobile-First Design

- Base viewport: 375px (iPhone SE)
- Bottom navigation on mobile, top navigation on desktop
- Large tap targets (44px minimum), thumb-friendly spacing
- Cards-based UI with Tailwind utility classes
- No component library — all custom components for minimal bundle size

---

## Infrastructure

### Deployment Options

#### Local Development (Docker Compose)

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| postgres | postgres:16-alpine | 5432 | Primary database |
| redis | redis:7-alpine | 6379 | Pub/sub + caching |
| api | ./backend | 8000 | FastAPI application |
| frontend | ./frontend | 3000 (→80) | nginx serving React SPA |

#### Railway (Production)

Single-service deployment: FastAPI serves both API and static frontend.

```
┌──────────────────────────────────────┐
│  Railway Service                      │
│                                       │
│  FastAPI                              │
│  ├── /api/v1/*    → API routes        │
│  ├── /health      → Health check      │
│  ├── /config.js   → Runtime config    │
│  ├── /assets/*    → Static files      │
│  └── /*           → SPA fallback      │
│                                       │
│  Start: alembic upgrade head &&       │
│         uvicorn app.main:app          │
└───────────────┬──────────────────────┘
                │
        ┌───────▼───────┐
        │  PostgreSQL   │
        │  (Railway     │
        │   add-on)     │
        └───────────────┘
```

- **Dockerfile** (repo root): Multi-stage build — Node builds frontend, Python serves everything
- **railway.toml**: Build config, start command (runs migrations then uvicorn), health check
- **Redis disabled**: `REDIS_URL` left unset, SSE uses in-memory queues
- **`/config.js`**: FastAPI route injects runtime env vars (replaces Docker entrypoint script)

### CI Pipeline (GitHub Actions)

```
On push/PR to master:
  Backend:  ruff check → pytest (with PostgreSQL + Redis services)
  Frontend: tsc --noEmit → vitest run
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection (asyncpg) |
| `REDIS_URL` | No | Redis connection (empty = disabled, in-memory SSE only) |
| `JWT_SECRET` | Yes | HMAC-SHA256 key for JWT signing |
| `GOOGLE_CLIENT_ID` | Prod | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Prod | Google OAuth client secret |
| `STRIPE_SECRET_KEY` | Prod | Stripe API secret key |
| `STRIPE_PUBLISHABLE_KEY` | Prod | Stripe publishable key (frontend) |
| `STRIPE_WEBHOOK_SECRET` | Prod | Stripe webhook signature verification |
| `POSTER_API_URL` | Prod | Poster POS API base URL |
| `POSTER_ACCESS_TOKEN` | Prod | Poster POS access token |
| `POSTER_POLL_INTERVAL_MS` | No | Poster polling interval (default: 30000) |
| `ENVIRONMENT` | No | `development` or `production` |
| `API_PORT` | No | API port (default: 8000) |
| `API_HOST` | No | API bind host (default: 0.0.0.0) |
