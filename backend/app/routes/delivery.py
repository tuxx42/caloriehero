"""Delivery routes — zones and slots."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.delivery import DeliverySlotResponse, DeliveryZoneResponse
from app.services.delivery_service import list_slots, list_zones

router = APIRouter(prefix="/api/v1/delivery", tags=["delivery"])


@router.get("/zones", response_model=list[DeliveryZoneResponse])
async def get_zones(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[DeliveryZoneResponse]:
    zones = await list_zones(db)
    return [DeliveryZoneResponse.model_validate(z) for z in zones]


@router.get("/zones/{zone_id}/slots", response_model=list[DeliverySlotResponse])
async def get_slots(
    zone_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    date: Annotated[str | None, Query()] = None,
) -> list[DeliverySlotResponse]:
    slots = await list_slots(db, zone_id, date=date)
    return [
        DeliverySlotResponse(
            id=s.id,
            date=s.date,
            start_time=s.start_time,
            end_time=s.end_time,
            zone_id=s.zone_id,
            capacity=s.capacity,
            booked_count=s.booked_count,
            available=s.capacity - s.booked_count,
        )
        for s in slots
    ]
