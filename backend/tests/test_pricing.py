"""Pricing service tests."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.meal import Meal
from app.models.settings import AppSettings
from app.services.pricing_service import calculate_item_price, get_settings


async def _seed_meal(db: AsyncSession, **overrides: object) -> Meal:
    data = {
        "name": "Pricing Test Meal",
        "description": "A meal for pricing tests",
        "category": "lunch",
        "calories": 500.0,
        "protein": 40.0,
        "carbs": 45.0,
        "fat": 15.0,
        "serving_size": "350g",
        "price": 200.0,
        "allergens": [],
        "dietary_tags": [],
    }
    data.update(overrides)
    meal = Meal(**data)
    db.add(meal)
    await db.commit()
    await db.refresh(meal)
    return meal


async def _seed_settings(
    db: AsyncSession,
    protein: float = 3.0,
    carbs: float = 1.0,
    fat: float = 1.5,
) -> AppSettings:
    s = AppSettings(
        protein_price_per_gram=protein,
        carbs_price_per_gram=carbs,
        fat_price_per_gram=fat,
    )
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return s


@pytest.mark.asyncio
class TestGetSettings:
    async def test_creates_default_settings_if_none(
        self, db_session: AsyncSession
    ) -> None:
        settings = await get_settings(db_session)
        assert settings.protein_price_per_gram == 3.0
        assert settings.carbs_price_per_gram == 1.0
        assert settings.fat_price_per_gram == 1.5

    async def test_returns_existing_settings(
        self, db_session: AsyncSession
    ) -> None:
        await _seed_settings(db_session, protein=5.0, carbs=2.0, fat=3.0)
        settings = await get_settings(db_session)
        assert settings.protein_price_per_gram == 5.0
        assert settings.carbs_price_per_gram == 2.0
        assert settings.fat_price_per_gram == 3.0


@pytest.mark.asyncio
class TestCalculateItemPrice:
    async def test_base_price_only_no_extras(
        self, db_session: AsyncSession
    ) -> None:
        await _seed_settings(db_session)
        meal = await _seed_meal(db_session, price=200.0)
        price = await calculate_item_price(db_session, meal, 0, 0, 0)
        assert price == 200.0

    async def test_with_extra_protein(
        self, db_session: AsyncSession
    ) -> None:
        await _seed_settings(db_session, protein=3.0, carbs=1.0, fat=1.5)
        meal = await _seed_meal(db_session, price=200.0)
        # 200 + 10g * 3.0 = 230
        price = await calculate_item_price(db_session, meal, 10, 0, 0)
        assert price == 230.0

    async def test_with_all_extras(
        self, db_session: AsyncSession
    ) -> None:
        await _seed_settings(db_session, protein=3.0, carbs=1.0, fat=1.5)
        meal = await _seed_meal(db_session, price=200.0)
        # 200 + (10 * 3) + (20 * 1) + (5 * 1.5) = 200 + 30 + 20 + 7.5 = 257.5
        price = await calculate_item_price(db_session, meal, 10, 20, 5)
        assert price == 257.5

    async def test_per_meal_override(
        self, db_session: AsyncSession
    ) -> None:
        await _seed_settings(db_session, protein=3.0, carbs=1.0, fat=1.5)
        meal = await _seed_meal(
            db_session,
            price=200.0,
            protein_price_per_gram=5.0,
        )
        # Uses meal override for protein (5.0), global for carbs/fat
        # 200 + (10 * 5) + (0 * 1) + (0 * 1.5) = 250
        price = await calculate_item_price(db_session, meal, 10, 0, 0)
        assert price == 250.0

    async def test_global_fallback_when_meal_override_is_none(
        self, db_session: AsyncSession
    ) -> None:
        await _seed_settings(db_session, protein=3.0, carbs=1.0, fat=1.5)
        meal = await _seed_meal(
            db_session,
            price=100.0,
            protein_price_per_gram=None,
            carbs_price_per_gram=None,
            fat_price_per_gram=None,
        )
        # All global rates: 100 + (10 * 3) + (10 * 1) + (10 * 1.5) = 155
        price = await calculate_item_price(db_session, meal, 10, 10, 10)
        assert price == 155.0

    async def test_all_meal_overrides(
        self, db_session: AsyncSession
    ) -> None:
        await _seed_settings(db_session, protein=3.0, carbs=1.0, fat=1.5)
        meal = await _seed_meal(
            db_session,
            price=150.0,
            protein_price_per_gram=4.0,
            carbs_price_per_gram=2.0,
            fat_price_per_gram=3.0,
        )
        # 150 + (10 * 4) + (10 * 2) + (10 * 3) = 150 + 40 + 20 + 30 = 240
        price = await calculate_item_price(db_session, meal, 10, 10, 10)
        assert price == 240.0

    async def test_price_is_rounded(
        self, db_session: AsyncSession
    ) -> None:
        await _seed_settings(db_session, protein=3.33, carbs=1.11, fat=1.55)
        meal = await _seed_meal(db_session, price=100.0)
        # 100 + (3 * 3.33) + (3 * 1.11) + (3 * 1.55) = 100 + 9.99 + 3.33 + 4.65 = 117.97
        price = await calculate_item_price(db_session, meal, 3, 3, 3)
        assert price == 117.97

    async def test_negative_extras_no_charge(
        self, db_session: AsyncSession
    ) -> None:
        """Negative extras should not reduce the price."""
        await _seed_settings(db_session, protein=3.0, carbs=1.0, fat=1.5)
        meal = await _seed_meal(db_session, price=200.0)
        # Removing macros: max(0, -10)*3 + max(0, -20)*1 + max(0, -5)*1.5 = 0
        price = await calculate_item_price(db_session, meal, -10, -20, -5)
        assert price == 200.0

    async def test_mixed_positive_negative_extras(
        self, db_session: AsyncSession
    ) -> None:
        """Only positive extras add cost; negative extras are free."""
        await _seed_settings(db_session, protein=3.0, carbs=1.0, fat=1.5)
        meal = await _seed_meal(db_session, price=200.0)
        # max(0, 10)*3 + max(0, -15)*1 + max(0, 5)*1.5 = 30 + 0 + 7.5 = 37.5
        price = await calculate_item_price(db_session, meal, 10, -15, 5)
        assert price == 237.5
