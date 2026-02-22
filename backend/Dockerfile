FROM python:3.12-slim AS base

WORKDIR /app
ENV PYTHONPATH=/app

# Install deps
COPY pyproject.toml ./
RUN pip install --no-cache-dir .

# Copy app
COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini seed.py start.py ./

EXPOSE 8000

CMD ["python", "start.py"]
