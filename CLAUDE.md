# CalorieHero

Macro-matched food delivery. Python + React.

## Layout

- `backend/` — FastAPI + SQLAlchemy (PostgreSQL) + Redis
- `backend/app/engine/` — Pure Python meal plan engine, zero deps
- `frontend/` — React SPA (Vite + Tailwind v4 + React Router v7 + Zustand)

## Commands

```bash
# Backend
cd backend && pytest -v              # Run tests
cd backend && ruff check app/        # Lint
cd backend && pyright                # Type-check
cd backend && uvicorn app.main:app --reload  # Dev server
cd backend && alembic upgrade head   # Run migrations
cd backend && python seed.py         # Seed database

# Frontend
cd frontend && npm run dev           # Dev server
cd frontend && npx vitest run        # Run tests
cd frontend && npx tsc --noEmit      # Type-check

# Or use Makefile shortcuts
make test                            # All tests
make dev-backend                     # Backend dev
make dev-frontend                    # Frontend dev
```

## Rules

- pytest for backend tests, Vitest for frontend tests. Write tests first.
- Pydantic v2 schemas in `backend/app/schemas/`. No `Any`.
- API routes: `/api/v1/*`. Health: `/health`.
- External services (Stripe, Poster): Protocol + real + mock impl. Tests use mocks.
- Pydantic Settings for env validation in `backend/app/config.py`.
- SQLAlchemy ORM. Migrations via Alembic. Always create an Alembic migration at the end of every database model change.
- Auth: Google OAuth only. API verifies Google ID tokens, issues JWTs. Test tokens: `test:<google_id>:<email>:<name>`.
- SSE for realtime (not WebSocket). Redis pub/sub for broadcast.
- Poster is polled for status (no webhooks). Stripe uses webhooks.
- Rate limiting: 100 req/min per IP. Health endpoint exempt.
- Docker: `docker compose up -d` for full stack, `docker compose up -d postgres redis` for dev deps.

## Order Flow

Create → Stripe pay → on `payment_intent.succeeded` → push to Poster POS → poll Poster for status → Redis pub/sub → SSE to client.

### Documentation

Update the documentation folder docs/ on all major milestones and additions to the project. Update the architecture.md if architecture choices change. Also keep changelog.md updated on major changes. Keep a written log in the project_status.md file of what has been done last.
