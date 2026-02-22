"""Railway startup script: run migrations then start uvicorn."""

import asyncio
import os
import subprocess
import sys

import asyncpg


async def reset_alembic_version() -> None:
    """Drop alembic_version so migrations run fresh (one-time recovery)."""
    url = os.environ.get("DATABASE_URL")
    if not url:
        return
    try:
        conn = await asyncpg.connect(url)
        # Check if core tables exist; if not, alembic_version is stale
        row = await conn.fetchval(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')"
        )
        if not row:
            print("Tables missing but alembic_version may exist — resetting migration state")
            await conn.execute("DROP TABLE IF EXISTS alembic_version")
        await conn.close()
    except Exception as e:
        print(f"DB check failed: {e}")


def run_migrations() -> bool:
    """Run alembic upgrade head. Returns True on success."""
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        capture_output=False,
    )
    return result.returncode == 0


def start_uvicorn() -> None:
    port = os.environ.get("PORT", "8000")
    os.execvp(
        sys.executable,
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", port],
    )


if __name__ == "__main__":
    asyncio.run(reset_alembic_version())

    if run_migrations():
        print("Migrations completed successfully")
    else:
        print("WARNING: Migrations failed — starting server anyway")

    start_uvicorn()
