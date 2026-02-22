"""Settings request/response schemas."""

import uuid

from pydantic import BaseModel, Field


class SettingsResponse(BaseModel):
    id: uuid.UUID
    protein_price_per_gram: float
    carbs_price_per_gram: float
    fat_price_per_gram: float

    model_config = {"from_attributes": True}


class SettingsUpdate(BaseModel):
    protein_price_per_gram: float | None = Field(default=None, gt=0)
    carbs_price_per_gram: float | None = Field(default=None, gt=0)
    fat_price_per_gram: float | None = Field(default=None, gt=0)
