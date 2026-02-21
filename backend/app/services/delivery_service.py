"""Delivery service — zones, slots, booking."""

import math
import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.delivery import DeliverySlot, DeliveryZone


async def list_zones(db: AsyncSession, active_only: bool = True) -> list[DeliveryZone]:
    query = select(DeliveryZone)
    if active_only:
        query = query.where(DeliveryZone.active.is_(True))
    query = query.order_by(DeliveryZone.name)
    result = await db.execute(query)
    return list(result.scalars().all())


async def list_slots(
    db: AsyncSession,
    zone_id: uuid.UUID,
    date: str | None = None,
) -> list[DeliverySlot]:
    query = select(DeliverySlot).where(DeliverySlot.zone_id == zone_id)
    if date:
        query = query.where(DeliverySlot.date == date)
    query = query.order_by(DeliverySlot.date, DeliverySlot.start_time)
    result = await db.execute(query)
    return list(result.scalars().all())


async def book_slot(
    db: AsyncSession, slot_id: uuid.UUID
) -> DeliverySlot | None:
    """Book a delivery slot with optimistic concurrency."""
    result = await db.execute(
        select(DeliverySlot).where(DeliverySlot.id == slot_id)
    )
    slot = result.scalar_one_or_none()
    if slot is None:
        return None
    if slot.booked_count >= slot.capacity:
        raise ValueError("Slot is fully booked")

    # Optimistic concurrency: only update if booked_count hasn't changed
    stmt = (
        update(DeliverySlot)
        .where(
            DeliverySlot.id == slot_id,
            DeliverySlot.booked_count == slot.booked_count,
        )
        .values(booked_count=slot.booked_count + 1)
    )
    update_result = await db.execute(stmt)
    if update_result.rowcount == 0:
        raise ValueError("Slot booking conflict — please retry")

    await db.commit()
    await db.refresh(slot)
    return slot


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate the great-circle distance between two points (km)."""
    r = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lng / 2) ** 2
    )
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
