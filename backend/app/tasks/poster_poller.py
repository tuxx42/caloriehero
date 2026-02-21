"""Background task to poll Poster POS for order status changes."""

import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.order import Order
from app.providers.poster_provider import PosterProvider

logger = logging.getLogger(__name__)

ACTIVE_STATUSES = {"preparing", "ready", "delivering"}


async def poll_active_orders(
    session_factory: async_sessionmaker[AsyncSession],
    provider: PosterProvider,
    publish_fn: object | None = None,
) -> int:
    """Poll all active orders for status changes. Returns count of updated."""
    updated = 0
    async with session_factory() as db:
        result = await db.execute(
            select(Order).where(
                Order.status.in_(ACTIVE_STATUSES),
                Order.poster_order_id.isnot(None),
            )
        )
        orders = result.scalars().all()

        for order in orders:
            try:
                new_status = await provider.get_order_status(
                    order.poster_order_id  # type: ignore[arg-type]
                )
                if new_status and new_status != order.status:
                    old_status = order.status
                    order.status = new_status
                    updated += 1
                    logger.info(
                        "Order %s: %s -> %s",
                        order.id, old_status, new_status,
                    )
            except Exception:
                logger.exception("Failed to poll order %s", order.id)

        if updated > 0:
            await db.commit()

    return updated


async def poster_poller_loop(
    session_factory: async_sessionmaker[AsyncSession],
    provider: PosterProvider,
    interval_ms: int = 30000,
) -> None:
    """Long-running background loop."""
    while True:
        try:
            await poll_active_orders(session_factory, provider)
        except Exception:
            logger.exception("Poster poller error")
        await asyncio.sleep(interval_ms / 1000)
