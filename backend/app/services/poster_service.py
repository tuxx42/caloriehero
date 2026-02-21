"""Poster POS service — push orders and poll status."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.providers.poster_provider import PosterProvider


async def push_order_to_poster(
    db: AsyncSession,
    provider: PosterProvider,
    order_id: uuid.UUID,
) -> str:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if order is None:
        raise ValueError("Order not found")

    poster_order_id = await provider.create_order(
        {"order_id": str(order.id), "total": order.total}
    )
    order.poster_order_id = poster_order_id
    order.status = "preparing"
    await db.commit()
    return poster_order_id


async def poll_order_status(
    db: AsyncSession,
    provider: PosterProvider,
    order_id: uuid.UUID,
) -> str | None:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if order is None or order.poster_order_id is None:
        return None

    new_status = await provider.get_order_status(order.poster_order_id)
    if new_status is not None and new_status != order.status:
        order.status = new_status
        await db.commit()
        return new_status
    return order.status
