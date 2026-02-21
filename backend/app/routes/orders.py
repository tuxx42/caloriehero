"""Order routes — create, list, get, pay."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.providers.payment_provider import MockPaymentProvider
from app.schemas.order import OrderCreate, OrderResponse, PaymentIntentResponse
from app.services.order_service import create_order, get_order, list_orders
from app.services.payment_service import create_payment_for_order

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])

_payment_provider = MockPaymentProvider()


def get_payment_provider() -> MockPaymentProvider:
    return _payment_provider


@router.post(
    "", response_model=OrderResponse, status_code=status.HTTP_201_CREATED
)
async def create_order_route(
    data: OrderCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OrderResponse:
    try:
        order = await create_order(db, user.id, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    return OrderResponse.model_validate(order)


@router.get("", response_model=list[OrderResponse])
async def list_orders_route(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[OrderResponse]:
    orders = await list_orders(db, user.id)
    return [OrderResponse.model_validate(o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_route(
    order_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OrderResponse:
    order = await get_order(db, order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )
    return OrderResponse.model_validate(order)


@router.post("/{order_id}/pay", response_model=PaymentIntentResponse)
async def pay_order_route(
    order_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PaymentIntentResponse:
    order = await get_order(db, order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )
    try:
        provider = get_payment_provider()
        result = await create_payment_for_order(db, provider, order_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    return PaymentIntentResponse(
        client_secret=result.client_secret,
        payment_intent_id=result.payment_intent_id,
    )
