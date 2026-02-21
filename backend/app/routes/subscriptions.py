"""Subscription routes."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse
from app.services.subscription_service import (
    cancel_subscription,
    create_subscription,
    get_subscription,
    list_subscriptions,
    pause_subscription,
    resume_subscription,
)

router = APIRouter(prefix="/api/v1/subscriptions", tags=["subscriptions"])


@router.post(
    "", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED
)
async def create_subscription_route(
    data: SubscriptionCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SubscriptionResponse:
    sub = await create_subscription(
        db, user.id, schedule=data.schedule, macro_targets=data.macro_targets
    )
    return SubscriptionResponse.model_validate(sub)


@router.get("", response_model=list[SubscriptionResponse])
async def list_subscriptions_route(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[SubscriptionResponse]:
    subs = await list_subscriptions(db, user.id)
    return [SubscriptionResponse.model_validate(s) for s in subs]


def _check_ownership(sub: object | None, user_id: uuid.UUID) -> None:
    if sub is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )
    if getattr(sub, "user_id", None) != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )


@router.post("/{sub_id}/pause", response_model=SubscriptionResponse)
async def pause_subscription_route(
    sub_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SubscriptionResponse:
    sub = await get_subscription(db, sub_id)
    _check_ownership(sub, user.id)
    try:
        result = await pause_subscription(db, sub_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    return SubscriptionResponse.model_validate(result)


@router.post("/{sub_id}/resume", response_model=SubscriptionResponse)
async def resume_subscription_route(
    sub_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SubscriptionResponse:
    sub = await get_subscription(db, sub_id)
    _check_ownership(sub, user.id)
    try:
        result = await resume_subscription(db, sub_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    return SubscriptionResponse.model_validate(result)


@router.post("/{sub_id}/cancel", response_model=SubscriptionResponse)
async def cancel_subscription_route(
    sub_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SubscriptionResponse:
    sub = await get_subscription(db, sub_id)
    _check_ownership(sub, user.id)
    try:
        result = await cancel_subscription(db, sub_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    return SubscriptionResponse.model_validate(result)
