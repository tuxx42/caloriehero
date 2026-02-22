"""Schemas for matching endpoints."""

from pydantic import BaseModel, Field


class SlotAlternativesRequest(BaseModel):
    slot: str  # "breakfast" | "lunch" | "dinner" | "snack"
    exclude_meal_ids: list[str] = []
    limit: int = Field(default=5, ge=1, le=20)


class PlanItemInput(BaseModel):
    slot: str
    meal_id: str


class RecalculatePlanRequest(BaseModel):
    items: list[PlanItemInput]
