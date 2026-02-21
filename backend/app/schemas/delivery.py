"""Delivery zone and slot schemas."""

import uuid

from pydantic import BaseModel


class DeliveryZoneResponse(BaseModel):
    id: uuid.UUID
    name: str
    lat: float
    lng: float
    radius_km: float
    delivery_fee: float
    active: bool

    model_config = {"from_attributes": True}


class DeliverySlotResponse(BaseModel):
    id: uuid.UUID
    date: str
    start_time: str
    end_time: str
    zone_id: uuid.UUID
    capacity: int
    booked_count: int
    available: int

    model_config = {"from_attributes": True}
