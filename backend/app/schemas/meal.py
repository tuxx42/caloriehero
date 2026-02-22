"""Meal request/response schemas."""

import uuid

from pydantic import BaseModel, Field


class MealBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    category: str = Field(pattern=r"^(breakfast|lunch|dinner|snack)$")
    calories: float = Field(gt=0)
    protein: float = Field(ge=0)
    carbs: float = Field(ge=0)
    fat: float = Field(ge=0)
    fiber: float | None = None
    sugar: float | None = None
    serving_size: str = Field(min_length=1, max_length=50)
    price: float = Field(gt=0)
    allergens: list[str] = Field(default_factory=list)
    dietary_tags: list[str] = Field(default_factory=list)
    image_url: str | None = None
    poster_product_id: str | None = None
    protein_price_per_gram: float | None = None
    carbs_price_per_gram: float | None = None
    fat_price_per_gram: float | None = None
    nutritional_benefits: str | None = None


class MealCreate(MealBase):
    pass


class MealUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, min_length=1)
    category: str | None = Field(
        default=None, pattern=r"^(breakfast|lunch|dinner|snack)$"
    )
    calories: float | None = Field(default=None, gt=0)
    protein: float | None = Field(default=None, ge=0)
    carbs: float | None = Field(default=None, ge=0)
    fat: float | None = Field(default=None, ge=0)
    fiber: float | None = None
    sugar: float | None = None
    serving_size: str | None = Field(default=None, min_length=1, max_length=50)
    price: float | None = Field(default=None, gt=0)
    allergens: list[str] | None = None
    dietary_tags: list[str] | None = None
    image_url: str | None = None
    active: bool | None = None
    poster_product_id: str | None = None
    protein_price_per_gram: float | None = None
    carbs_price_per_gram: float | None = None
    fat_price_per_gram: float | None = None
    nutritional_benefits: str | None = None


class MealResponse(MealBase):
    id: uuid.UUID
    active: bool

    model_config = {"from_attributes": True}
