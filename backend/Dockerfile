FROM python:3.12-slim AS base

WORKDIR /app
ENV PYTHONPATH=/app

# Install deps
COPY pyproject.toml ./
RUN pip install --no-cache-dir .

# Copy app
COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini seed.py ./

EXPOSE 8000

CMD ["sh", "-c", "until alembic upgrade head; do echo 'Waiting for database...'; sleep 2; done && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
