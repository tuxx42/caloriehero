"""Matching route tests."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.meal import Meal
from app.models.user import UserProfile
from tests.conftest import create_test_user, make_auth_header


async def _seed_meals(db: AsyncSession) -> list[Meal]:
    meals = []
    for i, (cat, name) in enumerate([
        ("breakfast", "Morning Oats"),
        ("breakfast", "Egg Wrap"),
        ("lunch", "Chicken Rice"),
        ("lunch", "Salmon Bowl"),
        ("dinner", "Beef Stew"),
        ("dinner", "Grilled Fish"),
        ("snack", "Protein Bar"),
        ("snack", "Fruit Bowl"),
    ]):
        meal = Meal(
            name=name,
            description=f"Test meal {i}",
            category=cat,
            calories=400 + i * 50,
            protein=30 + i * 5,
            carbs=40 + i * 3,
            fat=10 + i * 2,
            serving_size="300g",
            price=100 + i * 10,
            allergens=[],
            dietary_tags=[],
        )
        db.add(meal)
        meals.append(meal)
    await db.commit()
    for m in meals:
        await db.refresh(m)
    return meals


@pytest.mark.asyncio
class TestMatchMeals:
    async def test_match_returns_scored_meals(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        await _seed_meals(db_session)

        resp = await client.post(
            "/api/v1/matching/meals",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) > 0
        assert "score" in data[0]
        assert "meal_id" in data[0]
        assert "meal_name" in data[0]

    async def test_match_respects_limit(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        await _seed_meals(db_session)

        resp = await client.post(
            "/api/v1/matching/meals?limit=3",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 3

    async def test_match_uses_user_profile(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        profile = UserProfile(
            user_id=user.id,
            macro_targets={
                "calories": 1500, "protein": 120, "carbs": 130, "fat": 45
            },
            fitness_goal="cutting",
            allergies=[],
            dietary_preferences=[],
        )
        db_session.add(profile)
        await db_session.commit()
        await _seed_meals(db_session)

        resp = await client.post(
            "/api/v1/matching/meals",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 200
        assert len(resp.json()) > 0

    async def test_match_requires_auth(self, client: AsyncClient) -> None:
        resp = await client.post("/api/v1/matching/meals")
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestGeneratePlan:
    async def test_generate_plan(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        await _seed_meals(db_session)

        resp = await client.post(
            "/api/v1/matching/plan",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "total_score" in data
        assert "items" in data
        assert len(data["items"]) == 4  # 4 slots

    async def test_plan_items_have_slots(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        await _seed_meals(db_session)

        resp = await client.post(
            "/api/v1/matching/plan",
            headers=make_auth_header(user.id),
        )
        data = resp.json()
        slots = {item["slot"] for item in data["items"]}
        assert "breakfast" in slots
        assert "lunch" in slots
        assert "dinner" in slots
        assert "snack" in slots

    async def test_plan_no_meals_returns_404(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        resp = await client.post(
            "/api/v1/matching/plan",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 404

    async def test_plan_requires_auth(self, client: AsyncClient) -> None:
        resp = await client.post("/api/v1/matching/plan")
        assert resp.status_code in (401, 403)
