# CalorieHero - Changelog

## 2026-02-22 — Multi-Day Meal Planning (4-30 Days)

### Engine
- `multi_day_generator.py`: Loops `generate_daily_plan()` with progressive meal exclusion across days
- New types: `DayPlanResult` (day + plan + repeated_meal_ids), `MultiDayPlanResult` (aggregate stats + has_repeats property)
- Falls back to full meal pool when unused meals exhausted, tracking which meals are repeated
- 8 new engine tests covering repeat detection, aggregate stats, pool exhaustion

### Backend
- `POST /api/v1/matching/multi-day-plan?days=7`: Ephemeral multi-day plan generation (4-30 days)
- `plan_service.generate_multi_day_plan_for_user()`: Wires engine to DB, computes dates and total price
- Response includes per-day plans with `repeated_meal_ids`, `has_repeats`, `total_unique_meals`, `total_price`
- 5 new route tests (generation, day info, 404, auth, validation)

### Database
- `MultiDayMealPlan` model: id, user_id, num_days, has_repeats, total_unique_meals, total_repeated_meals
- `MealPlan` extended: nullable `multi_day_plan_id` FK + `day_number`
- Alembic migration `55c9f1d75a78`

### Frontend
- **Mode toggle**: "1 Day" / "Multi-Day" segmented control
- **Day count selector**: Number input (4-30) in multi mode
- **DayTabBar component**: Horizontally scrollable day tabs with emerald highlight and amber repeat dots
- **Repeat badges**: Amber "Repeated" badge on slot cards with repeated meals
- **Repeat warning banner**: Amber alert when menu variety causes repeats
- **Summary header**: N-Day Plan with unique meal count and avg match score
- **Add All Days to Cart**: Iterates all days' items
- **Per-day swap**: Swap recalculates single day, recomputes repeats client-side
- 4 DayTabBar tests + 8 PlanGenerator multi-day tests

---

## 2026-02-22 — Meal Nutrition Datasheet + Deduplicate Meals

### Meal Nutrition Datasheet
- **RadarChart component** (`frontend/src/components/common/RadarChart.tsx`): Pure SVG spider chart with 6 axes (Calories, Protein, Carbs, Fat, Fiber, Sugar), two overlaid polygons (meal values in emerald vs targets in gray dashed), values normalized as % of target capped at 150%
- **MealDatasheet modal** (`frontend/src/components/meals/MealDatasheet.tsx`): Tappable from plan generator, shows meal image/emoji, name, category badge, serving size, radar chart, % daily value table, allergen badges (red), dietary tag badges (green), nutritional benefits text, price
- **PlanGenerator integration**: Meal names in slot cards are now tappable buttons that open the datasheet modal
- **nutritional_benefits field**: Added to Meal model, schemas, and seed data (2-3 sentence health benefits per meal)
- **Alembic migration** `c4d5e6f7g8h9`: Adds `nutritional_benefits` TEXT column to meals table
- 12 new frontend tests for MealDatasheet component

### Deduplicate Meals
- **Seed script guards**: Added `SELECT ... LIMIT 1` existence checks before inserting app settings, meals, delivery zones, and delivery slots — prevents duplicates when running `python seed.py` multiple times
- Delivery slots are only created when zones are freshly seeded (nested under zone guard)

---

## 2026-02-22 — Complete Rewrite: Python + React

### Overview
Full rewrite from Node.js/TypeScript Turborepo monorepo to:
- **Backend**: Python (FastAPI + SQLAlchemy + Alembic + PostgreSQL + Redis)
- **Frontend**: React 19 SPA (Vite + Tailwind v4 + React Router v7 + Zustand)

### Railway Deployment Setup
- **Single-service deploy**: FastAPI serves API + static frontend from one container
- **Multi-stage Dockerfile** (repo root): Node builds frontend → Python serves everything
- **railway.toml**: Configures build, start command (migrations + uvicorn), health check
- **Redis made optional**: `redis_url` defaults to empty string; `get_redis()` returns `None` when disabled
- **Alembic env.py**: Reads `DATABASE_URL` from environment (overrides hardcoded `alembic.ini`)
- **Static serving in main.py**:
  - `GET /config.js` — runtime config injection (replaces Docker entrypoint script)
  - `/assets` — StaticFiles mount for Vite build output
  - `/{path:path}` — catch-all SPA fallback to `index.html`
- Existing Docker Compose workflow unchanged

### Phase 11: Multiple Plan Variants + Per-Slot Meal Swapping

**Backend:**
- `variant_generator.py`: Pure engine module — generates up to N diverse plans by excluding previously used meals
- `plan_service.py` refactored: extracted `_build_plan_response()`, `_load_user_targets()`, `_load_active_meals()` helpers
- `generate_plans_for_user()`: returns multiple transient plan variants (no persistence until cart)
- `get_slot_alternatives()`: finds alternative meals for a slot using per-meal matcher with slot-level targets
- `recalculate_plan()`: recomputes auto-extras after a meal swap
- `POST /api/v1/matching/plans`: generate multiple plan variants
- `POST /api/v1/matching/plan/alternatives`: get alternative meals for a slot
- `POST /api/v1/matching/plan/recalculate`: recalculate plan with swapped meals
- `schemas/matching.py`: SlotAlternativesRequest, PlanItemInput, RecalculatePlanRequest
- 5 engine tests + 6 route tests (11 new backend tests)

**Frontend:**
- `SlotSwapModal` component: modal showing alternative meals with scores, macros, and prices
- `PlanGenerator` rewrite: variant tabs (Plan A/B/C), swap buttons per slot, modal integration
- API endpoints: `generatePlans()`, `getSlotAlternatives()`, `recalculatePlan()`
- `SlotAlternative` type added to types.ts
- 7 PlanGenerator tests + 4 SlotSwapModal tests (11 new frontend tests)

### Phase 10: Bidirectional Macro Extras + Auto-Extras in Meal Plans

**Backend:**
- `OrderItemCreate` schema: removed `ge=0` constraints to allow negative extras
- `order_service.create_order()`: validates negative extras don't exceed meal's macros
- `pricing_service.calculate_item_price()`: uses `max(0, extra)` — only positive extras add cost
- `MealPlanItem` model: added extra_protein/carbs/fat columns (default 0)
- `plan_service.generate_plan_for_user()`: auto-calculates extras to close macro gap
  - Distributes delta across slots proportionally (breakfast 25%, lunch 35%, dinner 30%, snack 10%)
  - Clamps to meal's available macros (can't subtract more than meal contains)
  - Returns full meal data per item for frontend cart integration
  - Returns per-item extra_price and total_extra_price in response
- Alembic migration: adds 3 float columns to `meal_plan_items`
- 11 new backend tests (pricing negative extras, order validation, plan extras)

**Frontend:**
- `PlanItem` type: added extra_protein/carbs/fat, extra_price, meal fields
- `DailyPlan` type: added total_extra_price field
- `calcUnitPrice()` in cart store: uses `Math.max(0, extra)` for pricing
- `MealCustomizer`: allows negative extras with floor = -meal.macro
  - `-` button disabled at floor, not at 0
  - Display: "+10g" for positive, "-10g" for negative
  - Label changed from "Extra Protein" to "Protein" with "(add only)" pricing note
- `PlanGeneratorPage`: shows non-zero extras per slot, extra price, total plan price, "Add Plan to Cart" button
- `CartPage` + `CheckoutPage`: display negative extras as "-10g C" format
- 7 new frontend tests (cart negative pricing, PlanGenerator extras + add-to-cart)

### Phase 9: Onboarding Wizard + Per-Macro Pricing

**Backend:**
- `AppSettings` model: global per-gram prices (protein=3.0, carbs=1.0, fat=1.5 THB/g)
- `Meal` model: optional per-meal pricing overrides (protein/carbs/fat_price_per_gram)
- `OrderItem` model: extra_protein/carbs/fat fields for audit trail
- `pricing_service.py`: calculate_item_price() with global fallback + per-meal override
- `GET /api/v1/settings/pricing` (public) + `PUT /api/v1/settings/pricing` (admin)
- Order service uses pricing calculator for accurate totals
- Alembic migration: app_settings table + meal/order_item columns + default seed
- Schemas updated: MealCreate/Update/Response + OrderItemCreate/Response + SettingsResponse/Update
- 20 new backend tests (pricing service, settings routes, orders with extras)

**Frontend — Onboarding:**
- TDEE utility (Mifflin-St Jeor BMR, activity multipliers, macro splits by goal)
- Constants extraction (FITNESS_GOALS, ACTIVITY_LEVELS, ALLERGEN/DIETARY_OPTIONS)
- 5-step onboarding wizard (Welcome → Goal → Stats → Macros → Preferences)
- `useOnboardingCheck` hook: redirects to /onboarding if profile === null
- AppLayout shows spinner during profile check
- Route restructuring: /onboarding inside ProtectedRoute but outside AppLayout
- Profile page: "Recalculate" button navigates to /onboarding

**Frontend — Meal Customization:**
- `PricingConfig` type + settings API endpoint
- Cart store: `CartItem` with extraProtein/carbs/fat, `itemPrice()`, `setPricingRates()`
- `MealCustomizer` modal: base info, +/-5g steppers, live price, add to cart
- Meals page: tap card opens customizer instead of direct add
- Cart page: shows extra macros per item, computed line prices
- Checkout page: sends extra_protein/carbs/fat in order creation
- Admin pricing page: edit global per-gram rates
- Admin meals table: shows per-meal pricing override columns
- 25 new frontend tests (TDEE, onboarding, hook, customizer, cart)

### Phase 8: Admin Dashboard + Production Hardening
- Admin dashboard with stats cards, revenue display, orders-by-status chart
- Admin meals table with category, macros, price, status columns
- Admin orders table with status badges and date
- Admin customers table with role badges
- AdminLayout component with top nav + mobile tab nav
- AdminRoute guard checking `user.is_admin`
- Rate limiting middleware (100 req/min per IP, bypasses /health)
- Request logging middleware (method, path, status, response time)
- Backend Dockerfile (Python 3.12 slim)
- Frontend Dockerfile (multi-stage Node build + nginx)
- nginx.conf with SPA fallback and API proxy
- docker-compose.yml with api + frontend services
- GitHub Actions CI: ruff lint, pytest, tsc typecheck, vitest
- 8 backend tests (admin stats, admin orders, admin users, rate limiting)
- 3 frontend tests (admin dashboard rendering)

### Phase 7: Frontend Advanced
- Cart page with quantity +/- controls, clear all, total, checkout link
- Checkout page with order summary and Stripe payment flow
- Meal plan generator with macro overview bars and 4 slot cards
- Order history list with status badges
- Order tracking page with live SSE updates
- OrderTimeline component (vertical timeline, cancelled state)
- API endpoints: orders, matching, delivery
- useSSE hook: EventSource wrapper with token auth and auto-reconnect
- 15 frontend tests (OrderTimeline, Cart, SSE hook)

### Phase 6: Frontend Core
- Vite + React 19 + TypeScript + Tailwind v4 + React Router v7
- Google OAuth login with @react-oauth/google
- Zustand stores: auth (persisted localStorage), cart, profile
- API client with JWT header injection
- AppLayout: desktop top nav + mobile bottom nav with cart badge
- Components: MacroBar, MealCard, StatusBadge, LoadingSpinner
- Pages: Login, Home, Meals (category filters), Profile (macro targets, preferences)
- 18 frontend tests (stores, components)

### Phase 5: Poster + Matching + Subscriptions + SSE
- PosterProvider protocol + RealPosterProvider (httpx) + MockPosterProvider
- Poster poller background task (asyncio)
- Plan service: wire engine to DB (load meals/profile → run engine → persist)
- Matching routes: POST match meals, POST generate plan
- Subscriptions: full lifecycle (create, list, pause, resume, cancel)
- SSE manager with asyncio.Queue per connection
- Redis pub/sub for order status broadcasting
- SSE route with auth + ownership check
- 29 tests

### Phase 4: Orders, Payments, Delivery
- PaymentProvider protocol + StripePaymentProvider + MockPaymentProvider
- Order service: create (validate meals, snapshot prices), get, list, update status
- Payment service: create intent, handle webhook success
- Delivery service: zones, slots, optimistic booking, Haversine distance
- Stripe webhook route with signature verification
- 27 tests

### Phase 3: API Foundation
- FastAPI app factory with lifespan (DB + Redis init/shutdown), CORS
- Auth: Google OAuth login → JWT issuance, test token format `test:<google_id>:<email>:<name>`
- Dependencies: get_current_user (JWT), get_current_admin (isAdmin check)
- Pydantic v2 schemas: enums (Allergen, DietaryTag, MealCategory, etc.), request/response models
- Meals CRUD: public list/get + admin create/update/soft-delete
- Users: get profile, update profile (macro targets, preferences, delivery info)
- 28 tests

### Phase 2: Meal Plan Engine (Pure Python)
- Scoring: weighted normalized deviation across calories/protein/carbs/fat
- Filters: allergen exclusion, dietary tag AND-match, category filter
- Slot allocator: proportional macro distribution (breakfast 25%, lunch 35%, dinner 30%, snack 10%)
- Optimizer: branch-and-bound with upper-bound pruning
- Per-meal matcher: filter → score → sort → top N
- Daily planner: full pipeline orchestration
- 75 tests + performance benchmarks (200 meals < 100ms)

### Phase 1: Scaffolding + Models + Migrations
- pyproject.toml with all dependencies
- Pydantic Settings for env validation (DATABASE_URL, REDIS_URL, JWT, Stripe, Poster)
- SQLAlchemy async engine + session factory
- 11 models: users, user_profiles, meals, orders, order_items, subscriptions, delivery_zones, delivery_slots, meal_plans, meal_plan_items, payment_intents
- Alembic migration auto-generated from models
- Seed script: 20 meals + 3 delivery zones + 63 slots
- Docker Compose: PostgreSQL 16 + Redis 7
- Makefile with dev/test/lint/migrate/seed targets
