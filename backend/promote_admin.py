"""One-time script to promote a user to admin. Safe to re-run."""
import asyncio
import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def main() -> None:
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        print("No DATABASE_URL set, skipping admin promotion")
        return
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(url)
    async with engine.begin() as conn:
        result = await conn.execute(
            text(
                "UPDATE users SET is_admin = true "
                "WHERE email = 'joelkaithomas@gmail.com' "
                "RETURNING email"
            )
        )
        row = result.fetchone()
        if row:
            print(f"Promoted {row[0]} to admin")
        else:
            print("User not found yet (will promote on next deploy after login)")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
