"""Pricing service — per-macro price calculations."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.meal import Meal
from app.models.settings import AppSettings
from app.schemas.settings import SettingsUpdate


async def get_settings(db: AsyncSession) -> AppSettings:
    result = await db.execute(select(AppSettings).limit(1))
    settings = result.scalar_one_or_none()
    if settings is None:
        settings = AppSettings(
            protein_price_per_gram=3.0,
            carbs_price_per_gram=1.0,
            fat_price_per_gram=1.5,
        )
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


async def update_settings(
    db: AsyncSession, data: SettingsUpdate
) -> AppSettings:
    settings = await get_settings(db)
    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(settings, key, value)
    await db.commit()
    await db.refresh(settings)
    return settings


async def calculate_item_price(
    db: AsyncSession,
    meal: Meal,
    extra_protein: float,
    extra_carbs: float,
    extra_fat: float,
) -> float:
    settings = await get_settings(db)
    protein_rate = meal.protein_price_per_gram or settings.protein_price_per_gram
    carbs_rate = meal.carbs_price_per_gram or settings.carbs_price_per_gram
    fat_rate = meal.fat_price_per_gram or settings.fat_price_per_gram
    extra_cost = (
        max(0, extra_protein) * protein_rate
        + max(0, extra_carbs) * carbs_rate
        + max(0, extra_fat) * fat_rate
    )
    return round(meal.price + extra_cost, 2)
