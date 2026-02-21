"""Subscription service — CRUD + state management."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscription import Subscription


async def create_subscription(
    db: AsyncSession,
    user_id: uuid.UUID,
    *,
    schedule: dict,
    macro_targets: dict,
) -> Subscription:
    sub = Subscription(
        user_id=user_id,
        status="active",
        schedule=schedule,
        macro_targets=macro_targets,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub


async def list_subscriptions(
    db: AsyncSession, user_id: uuid.UUID
) -> list[Subscription]:
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user_id)
        .order_by(Subscription.created_at.desc())
    )
    return list(result.scalars().all())


async def get_subscription(
    db: AsyncSession, sub_id: uuid.UUID
) -> Subscription | None:
    result = await db.execute(
        select(Subscription).where(Subscription.id == sub_id)
    )
    return result.scalar_one_or_none()


async def pause_subscription(
    db: AsyncSession, sub_id: uuid.UUID
) -> Subscription | None:
    sub = await get_subscription(db, sub_id)
    if sub is None:
        return None
    if sub.status != "active":
        raise ValueError("Can only pause active subscriptions")
    sub.status = "paused"
    sub.paused_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(sub)
    return sub


async def resume_subscription(
    db: AsyncSession, sub_id: uuid.UUID
) -> Subscription | None:
    sub = await get_subscription(db, sub_id)
    if sub is None:
        return None
    if sub.status != "paused":
        raise ValueError("Can only resume paused subscriptions")
    sub.status = "active"
    sub.paused_at = None
    await db.commit()
    await db.refresh(sub)
    return sub


async def cancel_subscription(
    db: AsyncSession, sub_id: uuid.UUID
) -> Subscription | None:
    sub = await get_subscription(db, sub_id)
    if sub is None:
        return None
    if sub.status == "cancelled":
        raise ValueError("Subscription already cancelled")
    sub.status = "cancelled"
    sub.cancelled_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(sub)
    return sub
