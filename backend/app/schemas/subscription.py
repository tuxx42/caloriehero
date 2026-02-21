"""Subscription schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel


class SubscriptionCreate(BaseModel):
    schedule: dict
    macro_targets: dict


class SubscriptionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    schedule: dict
    macro_targets: dict
    paused_at: datetime | None
    cancelled_at: datetime | None

    model_config = {"from_attributes": True}
