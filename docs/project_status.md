# CalorieHero - Project Status

## Last Updated: 2026-02-22

## Current Phase: Railway Deployment Ready

The project has been completely rewritten from a Node.js/TypeScript Turborepo monorepo to a Python + React stack, and is now configured for Railway.app deployment.

### Architecture

- **Backend**: Python (FastAPI + SQLAlchemy async + Alembic + PostgreSQL + Redis optional)
- **Frontend**: React 19 SPA (Vite 6 + Tailwind v4 + React Router v7 + Zustand 5)
- **Auth**: Google OAuth only → API verifies ID tokens → issues JWTs
- **Realtime**: SSE via Redis pub/sub (or in-memory when Redis disabled)
- **POS**: Poster integration via polling (no webhooks)
- **Payments**: Stripe PaymentIntents + webhooks
- **Deployment**: Railway single-service (FastAPI serves API + static frontend) + Postgres add-on

### Latest: Cart Plan Context + Body Stats + Weight Projection
- **Body stats persistence**: 5 new nullable columns on UserProfile (weight_kg, height_cm, age, gender, activity_level)
  - Backend schemas with validation (gender: male/female, activity_level: sedentary-very_active)
  - Onboarding wizard sends body stats alongside macro targets
  - Profile page shows read-only "Body Stats" card
  - Alembic migration `0b061bb3f9ef`
- **Cart plan context**: When adding a meal plan to cart, preserves plan metadata
  - `PlanContext` in cart store: planType, numDays, targetMacros, dailySummaries, totalScore
  - `PlanSummaryBadge` component: emerald badge showing plan type, match %, avg kcal/day
  - Shown in Cart page and Checkout page above item list
  - Cart cleared before adding new plan (prevents mixing plans)
- **Weight projection**: Caloric surplus/deficit → estimated weight change
  - `calculateWeightProjection()` utility using TDEE from body stats
  - `WeightProjectionCard` component: colored card (blue=gain, amber=loss, emerald=maintenance)
  - Integrated in PlanDatasheet modal and Cart page
  - Shows: projected weight change, current → projected weight, TDEE, plan avg, daily surplus/deficit
- 5 new backend tests + 4 weight projection tests + 3 cart context tests + 2 Cart page tests

### Previous: Multi-Day Meal Planning (4-30 Days)
- **Multi-day engine**: New `generate_multi_day_plan()` loops daily planner with progressive meal exclusion
  - Tracks used meals across days, falls back to full pool when exhausted
  - Reports per-day repeated meal IDs and aggregate stats (unique/repeated counts)
- **API**: `POST /api/v1/matching/multi-day-plan?days=7` (ephemeral, not persisted)
- **DB model**: `MultiDayMealPlan` parent table + nullable FK on `MealPlan` (multi_day_plan_id, day_number)
- **Frontend**: Mode toggle (1 Day / Multi-Day), day count selector (4-30), horizontal DayTabBar
  - Amber dot on tabs with repeated meals, "Repeated" badge on slot cards
  - Repeat warning banner when menu variety is limited
  - Summary header with unique meal count and avg match score
  - "Add All Days to Cart" adds every day's meals
  - Swap works per-day with client-side repeat recomputation
- **Alembic migration**: `55c9f1d75a78` adds multi_day_meal_plans table + meal_plans FK columns
- 8 new engine tests + 5 new route tests + 4 DayTabBar tests + 8 PlanGenerator multi-day tests

### Previous: Meal Nutrition Datasheet + Dedup
- **Meal Datasheet modal**: Tap any meal in generated plan to see detailed nutritional breakdown
- **Nutritional benefits field**: Added `nutritional_benefits` text column to Meal model
- **Seed script dedup**: Re-running seed no longer creates duplicates
- 12 new frontend tests (MealDatasheet component)

### Railway Deployment Setup
- Multi-stage `Dockerfile` at repo root (Node builds frontend, Python serves all)
- `railway.toml` with build config, start command, health check
- Redis made optional (`REDIS_URL` empty = disabled)
- `alembic/env.py` reads `DATABASE_URL` from environment
- FastAPI serves static frontend: `/config.js` runtime config, `/assets` static mount, SPA catch-all
- Existing Docker Compose workflow unchanged

### Completed Phases

#### Phase 1: Scaffolding + Models + Migrations
- FastAPI app factory with async SQLAlchemy (asyncpg)
- 11 SQLAlchemy models with UUID PKs and timestamps
- Alembic migration, seed script (20 meals, 3 zones, 63 slots)
- Pydantic Settings for env validation

#### Phase 2: Meal Plan Engine (Pure Python)
- Scoring: weighted normalized deviation (0-1)
- Filters: allergen exclusion, dietary AND-match, category
- Slot allocator: proportional distribution with rounding correction
- Optimizer: branch-and-bound with two-level pruning
- 75 engine tests + performance benchmarks

#### Phase 3: API Foundation
- Auth: Google OAuth login + JWT issuance + test token support
- Meals: public list/get + admin CRUD (create/update/soft-delete)
- Users: profile management (macro targets, preferences, delivery info)
- 28 route tests

#### Phase 4: Orders, Payments, Delivery
- Order lifecycle: create → validate meals → snapshot prices
- Stripe PaymentIntents (provider protocol + mock)
- Delivery zones + slots with Haversine distance and optimistic booking
- 27 route tests

#### Phase 5: Poster + Matching + Subscriptions + SSE
- Poster POS integration (provider protocol + mock)
- Meal matching + daily plan generation via engine
- Subscriptions: create, pause, resume, cancel with state validation
- SSE manager + Redis pub/sub for live order tracking
- 29 route tests

#### Phase 6: Frontend Core
- Google OAuth login flow
- Meal browsing with category filters
- User profile management (macros, fitness goal, allergies, dietary prefs)
- Zustand stores (auth persisted, cart, profile)
- Mobile-first responsive layout with bottom nav
- 18 frontend tests

#### Phase 7: Frontend Advanced
- Cart with quantity controls
- Checkout with Stripe payment flow
- AI meal plan generator with macro overview bars
- Order history list with status badges
- Live order tracking with SSE + OrderTimeline component
- 15 frontend tests

#### Phase 8: Admin Dashboard + Production Hardening
- Admin pages: Dashboard (stats), Meals (table), Orders (table), Customers (table)
- Admin layout with route guard (isAdmin check)
- Rate limiting middleware (100 req/min per IP, pure ASGI)
- Request logging middleware
- Dockerfiles for API and frontend (nginx SPA)
- Docker Compose with all services
- GitHub Actions CI (lint + typecheck + test)
- 11 new tests (8 backend + 3 frontend)

#### Phase 9: Onboarding Wizard + Per-Macro Pricing
- **Onboarding wizard**: 5-step first-login TDEE calculator (Mifflin-St Jeor)
  - Welcome → Fitness Goal → Body Stats → Macro Review → Dietary Preferences
  - Skip button on every step (saves defaults)
  - Auto-redirect on first login (profile === null detection)
  - Recalculate button on Profile page
- **Per-macro pricing**: Base price + per-gram add-on pricing
  - AppSettings model (global protein/carbs/fat price per gram)
  - Per-meal pricing overrides (nullable, falls back to global)
  - OrderItem captures extra_protein/carbs/fat for auditing
  - Pricing service calculates total from base + extras
  - MealCustomizer modal with +/- 5g steppers and live price
  - Cart/Checkout show extras and computed prices
  - Admin pricing page for global rates
  - Admin meals table shows per-meal pricing overrides
- **Backend**: AppSettings model, pricing_service, settings routes, Alembic migration
- **Frontend**: TDEE utility, constants extraction, onboarding page, routing restructure
- 20 backend tests + 25 frontend tests (45 new total)

#### Phase 10: Bidirectional Macro Extras + Auto-Extras in Meal Plans
- **Bidirectional customization**: MealCustomizer allows adding AND subtracting macros
  - Floor: can't subtract more than the meal contains
  - Only positive extras add cost; negative extras are free
- **Auto-extras in meal plans**: After engine selects optimal meals, calculates per-item extras to close the macro gap
  - Distribution by slot percentage (25/35/30/10), clamped to available macros
  - Full meal data included in plan response for cart integration
  - "Add Plan to Cart" button on PlanGenerator page
- **Backend**: Schema changes, pricing service update, order validation, plan service post-processing
- **Frontend**: Types, cart store, MealCustomizer, PlanGenerator, Cart, Checkout updates
- **Migration**: `meal_plan_items` gets extra_protein/carbs/fat columns
- 11 new backend tests + 7 new frontend tests

#### Phase 11: Multiple Plan Variants + Per-Slot Meal Swapping
- **Plan variants**: Generate 3 diverse plan suggestions, each using different meals
  - Variant generator excludes meals from prior variants for diversity
  - Plans are transient (not persisted) until added to cart
  - Variant tabs (Plan A / Plan B / Plan C) for easy comparison
- **Meal swapping**: Swap any meal in a slot with scored alternatives
  - SlotSwapModal shows alternatives with match scores, macros, and prices
  - Recalculates auto-extras when a meal is swapped
  - Alternatives exclude meals already in the plan
- **Backend**: variant_generator engine, 3 new API endpoints, refactored plan service
- **Frontend**: SlotSwapModal component, PlanGenerator rewrite with tabs + swap
- 11 new backend tests + 11 new frontend tests

## Test Summary

| Component | Tests |
|-----------|-------|
| Backend - Engine | 83 |
| Backend - Health | 1 |
| Backend - Auth | 4 |
| Backend - Meals | 14 |
| Backend - Users | 10 |
| Backend - Orders | 14 |
| Backend - Delivery | 10 |
| Backend - Webhooks | 3 |
| Backend - Matching | 22 |
| Backend - Subscriptions | 11 |
| Backend - SSE | 8 |
| Backend - Poster | 4 |
| Backend - Admin | 5 |
| Backend - Rate Limit | 3 |
| Backend - Pricing | 11 |
| Backend - Settings | 8 |
| Backend - Body Stats | 5 |
| Backend - E2E | 3 |
| Frontend - Stores | 19 |
| Frontend - Components | 19 |
| Frontend - Hooks | 8 |
| Frontend - Pages | 37 |
| Frontend - MealDatasheet | 12 |
| Frontend - Weight Projection | 4 |
| **Total** | **344** |
