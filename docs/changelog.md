# CalorieHero - Changelog

## 2026-02-20

### Phase 7: Mobile App (Complete)
- Zustand stores: auth (persisted via AsyncStorage), cart (addItem/removeItem/updateQuantity)
- API client (`src/api/client.ts`) with auto Bearer token from auth store
- 13 screens via Expo Router file-based routing
- Auth flow: mock Google sign-in, auth guard redirect
- 4-tab bottom navigation: Home, Meals, Plan, Profile
- Meals browser with FlatList and category filter tabs (All/Breakfast/Lunch/Dinner/Snack)
- Meal plan generator calling POST /api/v1/matching/plan
- Profile screen: macro targets, fitness goal, allergies, dietary preferences
- Meal detail modal with macro breakdown, allergen badges, add-to-cart
- Cart with +/- quantity controls and checkout flow
- Order tracking with progress steps and 15s polling
- Shared components: MacroBar, MealCard, StatusBadge
- Dependencies added: zustand, @react-native-async-storage/async-storage, expo-web-browser, expo-auth-session, expo-crypto

### Phase 6: Admin Dashboard — Full (Complete)
- API client (`lib/api.ts`) wrapping all Fastify endpoints with token management
- React hooks (`hooks/use-api.ts`) with automatic fallback to mock data on API error
- Dashboard page wired to real orders API
- Meals page: full CRUD via API with error handling and refresh
- Orders page: table with status badges, SSE live connection indicator
- Customers page: table joined with subscription status
- Subscriptions page: table with schedule details and macro targets
- Delivery page: zone cards grid + slots table with capacity progress bars
- Analytics page: stat cards + CSS bar charts for category distribution and order status
- Graceful degradation: amber "API unavailable" banner, falls through to typed mock data

### Phase 4: API Integrations (Complete)
- Added DB schemas: delivery_zones, delivery_slots, subscriptions, meal_plans, meal_plan_items, payment_intents
- Added Redis plugin (ioredis) with pub/sub support (3 connections: general, pub, sub)
- Updated env.ts with Stripe, Poster POS config validation
- Updated app.ts to support Redis injection and Stripe config decoration
- Added Stripe and ioredis dependencies to API
- Built Poster POS client package: HTTP client with retries, incoming orders, products, status polling (23 tests)
- Built API services: plan-service, order-service, payment-service, poster-service, subscription-service, delivery-service
- Built API routes: matching, orders, subscriptions, delivery, webhooks/stripe
- Payment provider interface pattern (real Stripe + mock for tests)
- Poster provider interface pattern (real + mock for tests)
- Order lifecycle: create → validate meals → calculate total → insert to DB
- Delivery service with Haversine distance calculation and optimistic slot booking
- 95 new API tests across 7 test files

### Phase 5: Real-Time (Complete)
- SSE manager: connection tracking per order, event broadcasting
- Redis pub/sub: order:status channel, message routing to SSE connections
- Cache service: get/set/del with TTL, scanStream pattern invalidation, convenience methods for meals/slots
- SSE route: GET /api/v1/sse/orders/:orderId with auth + ownership check
- 36 SSE/Redis/cache tests across 4 test files
- Fixed SSE route duplicate registration in tests (buildApp already registers sseRoutes)

### Phase 3.5: Admin Dashboard (Preview)
- Built Next.js admin dashboard with Tailwind CSS
- Dashboard home with stat cards and mock order queue
- Meals page with table, search, create/edit modal form
- Sidebar navigation with lucide-react icons
- Mock data for 7 Thai-inspired meals

### Phase 3: API Foundation & Database
- Fastify app factory with `buildApp()` pattern
- Drizzle ORM schemas: meals, users, user_profiles, orders, order_items
- Auth plugin: real JWT + mock auth (base64 JSON tokens for tests)
- CRUD routes: meals (admin write, public read), users/me, users/me/profile
- Services: meal-service, user-service, profile-service
- Error handler plugin (ZodError → structured 400)
- 34 tests

### Phase 2: Meal Plan Engine
- Scoring: weighted normalized distance, 0-1 range
- Filters: allergen removal, dietary tag AND logic, category filter
- Per-meal matcher: filter → score → rank → limit
- Slot allocator: proportional distribution with rounding correction
- Optimizer: branch-and-bound with two-level pruning
- Daily planner: orchestrates full pipeline
- 75 tests (8 test files)

### Phase 1: Shared Types
- 8 domain Zod schemas + engine types + API contracts
- All TypeScript types derived via z.infer<>
- 37 tests (3 test files)

### Phase 0: Monorepo Scaffolding
- Turborepo + pnpm workspace (3 apps + 3 packages)
- TypeScript config: ES2022, strict, bundler moduleResolution
- Docker Compose: PostgreSQL 16 + Redis 7
- node-linker=hoisted in .npmrc for Expo compatibility
- React 18 forced via pnpm overrides (Expo SDK 52 compatibility)
