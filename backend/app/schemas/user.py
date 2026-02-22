"""User and profile request/response schemas."""

import uuid

from pydantic import BaseModel, Field


class MacroTargets(BaseModel):
    calories: float = Field(gt=0)
    protein: float = Field(ge=0)
    carbs: float = Field(ge=0)
    fat: float = Field(ge=0)


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    is_admin: bool

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    macro_targets: MacroTargets | None = None
    fitness_goal: str | None = Field(
        default=None,
        pattern=r"^(maintenance|cutting|bulking|keto)$",
    )
    allergies: list[str] | None = None
    dietary_preferences: list[str] | None = None
    delivery_address: str | None = None
    delivery_lat: float | None = None
    delivery_lng: float | None = None
    weight_kg: float | None = Field(default=None, gt=0, le=500)
    height_cm: float | None = Field(default=None, gt=0, le=300)
    age: int | None = Field(default=None, gt=0, le=150)
    gender: str | None = Field(
        default=None,
        pattern=r"^(male|female)$",
    )
    activity_level: str | None = Field(
        default=None,
        pattern=r"^(sedentary|light|moderate|active|very_active)$",
    )


class UserProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    macro_targets: dict
    fitness_goal: str
    allergies: list[str]
    dietary_preferences: list[str]
    delivery_address: str | None
    delivery_lat: float | None
    delivery_lng: float | None
    weight_kg: float | None
    height_cm: float | None
    age: int | None
    gender: str | None
    activity_level: str | None

    model_config = {"from_attributes": True}


class UserWithProfileResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    is_admin: bool
    profile: UserProfileResponse | None

    model_config = {"from_attributes": True}


class GoogleLoginRequest(BaseModel):
    id_token: str
