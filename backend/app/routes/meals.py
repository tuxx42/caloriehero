"""Meals routes — public listing + admin CRUD."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.user import User
from app.schemas.meal import MealCreate, MealResponse, MealUpdate
from app.services.meal_service import (
    create_meal,
    delete_meal,
    get_meal,
    list_meals,
    update_meal,
)

router = APIRouter(prefix="/api/v1/meals", tags=["meals"])


@router.get("", response_model=list[MealResponse])
async def get_meals(
    db: Annotated[AsyncSession, Depends(get_db)],
    category: Annotated[str | None, Query()] = None,
) -> list[MealResponse]:
    meals = await list_meals(db, category=category)
    return [MealResponse.model_validate(m) for m in meals]


@router.get("/{meal_id}", response_model=MealResponse)
async def get_meal_by_id(
    meal_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MealResponse:
    meal = await get_meal(db, meal_id)
    if meal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found"
        )
    return MealResponse.model_validate(meal)


@router.post(
    "", response_model=MealResponse, status_code=status.HTTP_201_CREATED
)
async def create_meal_route(
    data: MealCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(get_current_admin)],
) -> MealResponse:
    meal = await create_meal(db, data)
    return MealResponse.model_validate(meal)


@router.put("/{meal_id}", response_model=MealResponse)
async def update_meal_route(
    meal_id: uuid.UUID,
    data: MealUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(get_current_admin)],
) -> MealResponse:
    meal = await update_meal(db, meal_id, data)
    if meal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found"
        )
    return MealResponse.model_validate(meal)


@router.delete("/{meal_id}", response_model=MealResponse)
async def delete_meal_route(
    meal_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(get_current_admin)],
) -> MealResponse:
    meal = await delete_meal(db, meal_id)
    if meal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found"
        )
    return MealResponse.model_validate(meal)
