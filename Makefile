.PHONY: dev test migrate seed lint typecheck install

# Backend
install-backend:
	cd backend && pip install -e ".[dev]"

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

test-backend:
	cd backend && pytest -v

lint-backend:
	cd backend && ruff check app/ tests/

typecheck-backend:
	cd backend && pyright

migrate:
	cd backend && alembic upgrade head

migrate-gen:
	cd backend && alembic revision --autogenerate -m "$(msg)"

seed:
	cd backend && python seed.py

# Frontend
install-frontend:
	cd frontend && npm install

dev-frontend:
	cd frontend && npm run dev

test-frontend:
	cd frontend && npx vitest run

typecheck-frontend:
	cd frontend && npx tsc --noEmit

# Combined
install: install-backend install-frontend

dev:
	@echo "Run 'make dev-backend' and 'make dev-frontend' in separate terminals"

test: test-backend test-frontend

lint: lint-backend

typecheck: typecheck-backend typecheck-frontend
