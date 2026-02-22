# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/pnpm-lock.yaml* ./
RUN corepack enable && pnpm install
COPY frontend/ .
RUN pnpm build

# Stage 2: Python backend + static files
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONPATH=/app
COPY backend/pyproject.toml ./
RUN pip install --no-cache-dir .
COPY backend/app/ app/
COPY backend/alembic/ alembic/
COPY backend/alembic.ini backend/seed.py backend/promote_admin.py backend/start.py ./
COPY --from=frontend-build /app/dist static/
EXPOSE 8000
CMD ["python", "start.py"]
