"""Order request/response schemas."""

import uuid

from pydantic import BaseModel, Field


class OrderItemCreate(BaseModel):
    meal_id: uuid.UUID
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = Field(min_length=1)
    type: str = Field(default="one_time", pattern=r"^(one_time|subscription)$")
    delivery_slot_id: uuid.UUID | None = None
    delivery_address: str | None = None


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    meal_id: uuid.UUID
    meal_name: str
    quantity: int
    unit_price: float

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    type: str
    total: float
    delivery_slot_id: uuid.UUID | None
    delivery_address: str | None
    poster_order_id: str | None
    stripe_payment_intent_id: str | None
    items: list[OrderItemResponse]

    model_config = {"from_attributes": True}


class PayOrderRequest(BaseModel):
    pass


class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
