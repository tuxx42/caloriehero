"""Matching routes — meal matching and plan generation."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.matching import RecalculatePlanRequest, SlotAlternativesRequest
from app.services.plan_service import (
    generate_multi_day_plan_for_user,
    generate_plan_for_user,
    generate_plans_for_user,
    get_slot_alternatives,
    match_meals_for_user,
    recalculate_plan,
)

router = APIRouter(prefix="/api/v1/matching", tags=["matching"])


@router.post("/meals")
async def match_meals_route(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
) -> list[dict]:
    try:
        return await match_meals_for_user(db, user.id, limit=limit)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )


@router.post("/plan")
async def generate_plan_route(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await generate_plan_for_user(db, user.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not generate plan — no suitable meals found",
        )
    return result


@router.post("/plans")
async def generate_plans_route(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    count: Annotated[int, Query(ge=1, le=5)] = 3,
) -> list[dict]:
    """Generate multiple plan variants for comparison."""
    try:
        return await generate_plans_for_user(db, user.id, count=count)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )


@router.post("/multi-day-plan")
async def generate_multi_day_plan_route(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    days: Annotated[int, Query(ge=4, le=30)] = 7,
) -> dict:
    """Generate a multi-day meal plan."""
    try:
        result = await generate_multi_day_plan_for_user(db, user.id, days)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not generate multi-day plan — no suitable meals found",
        )
    return result


@router.post("/plan/alternatives")
async def get_alternatives_route(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    body: SlotAlternativesRequest,
) -> list[dict]:
    """Get alternative meals for a specific slot."""
    try:
        return await get_slot_alternatives(
            db, user.id, body.slot, body.exclude_meal_ids, body.limit
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )


@router.post("/plan/recalculate")
async def recalculate_plan_route(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    body: RecalculatePlanRequest,
) -> dict:
    """Recalculate plan after swapping a meal."""
    try:
        result = await recalculate_plan(
            db, user.id, [item.model_dump() for item in body.items]
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not recalculate plan",
        )
    return result
