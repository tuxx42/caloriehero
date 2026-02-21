"""Meal CRUD service."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.meal import Meal
from app.schemas.meal import MealCreate, MealUpdate


async def list_meals(
    db: AsyncSession,
    *,
    category: str | None = None,
    active_only: bool = True,
) -> list[Meal]:
    query = select(Meal)
    if active_only:
        query = query.where(Meal.active.is_(True))
    if category:
        query = query.where(Meal.category == category)
    query = query.order_by(Meal.name)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_meal(db: AsyncSession, meal_id: uuid.UUID) -> Meal | None:
    result = await db.execute(select(Meal).where(Meal.id == meal_id))
    return result.scalar_one_or_none()


async def create_meal(db: AsyncSession, data: MealCreate) -> Meal:
    meal = Meal(**data.model_dump())
    db.add(meal)
    await db.commit()
    await db.refresh(meal)
    return meal


async def update_meal(
    db: AsyncSession, meal_id: uuid.UUID, data: MealUpdate
) -> Meal | None:
    meal = await get_meal(db, meal_id)
    if meal is None:
        return None
    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(meal, key, value)
    await db.commit()
    await db.refresh(meal)
    return meal


async def delete_meal(db: AsyncSession, meal_id: uuid.UUID) -> Meal | None:
    meal = await get_meal(db, meal_id)
    if meal is None:
        return None
    meal.active = False
    await db.commit()
    await db.refresh(meal)
    return meal
