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

    async def test_plan_items_include_extras(
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
        for item in data["items"]:
            assert "extra_protein" in item
            assert "extra_carbs" in item
            assert "extra_fat" in item
            assert "extra_price" in item
            assert isinstance(item["extra_protein"], (int, float))
            assert isinstance(item["extra_carbs"], (int, float))
            assert isinstance(item["extra_fat"], (int, float))
            assert item["extra_price"] >= 0  # Only positive extras priced

    async def test_plan_includes_full_meal_data(
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
        for item in data["items"]:
            assert "meal" in item
            meal = item["meal"]
            assert "id" in meal
            assert "name" in meal
            assert "price" in meal
            assert "protein" in meal
            assert "carbs" in meal
            assert "fat" in meal

    async def test_plan_includes_total_extra_price(
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
        assert "total_extra_price" in data
        assert isinstance(data["total_extra_price"], (int, float))
        assert data["total_extra_price"] >= 0

    async def test_plan_extras_clamped_to_meal_macros(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Extras should never subtract more than the meal contains."""
        user = await create_test_user(db_session)
        await _seed_meals(db_session)

        resp = await client.post(
            "/api/v1/matching/plan",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 200
        data = resp.json()
        for item in data["items"]:
            meal = item["meal"]
            assert item["extra_protein"] >= -meal["protein"]
            assert item["extra_carbs"] >= -meal["carbs"]
            assert item["extra_fat"] >= -meal["fat"]


@pytest.mark.asyncio
class TestGeneratePlans:
    async def test_generate_plans_returns_list(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        await _seed_meals(db_session)

        resp = await client.post(
            "/api/v1/matching/plans",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        # Each variant has the standard plan shape
        for plan in data:
            assert "total_score" in plan
            assert "items" in plan
            assert len(plan["items"]) == 4

    async def test_plans_have_different_meals(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        await _seed_meals(db_session)

        resp = await client.post(
            "/api/v1/matching/plans",
            headers=make_auth_header(user.id),
        )
        data = resp.json()
        if len(data) > 1:
            meals_0 = {item["meal_id"] for item in data[0]["items"]}
            meals_1 = {item["meal_id"] for item in data[1]["items"]}
            assert meals_0 != meals_1

    async def test_plans_requires_auth(self, client: AsyncClient) -> None:
        resp = await client.post("/api/v1/matching/plans")
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestMultiDayPlan:
    async def test_generate_multi_day_plan(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        await _seed_meals(db_session)

        resp = await client.post(
            "/api/v1/matching/multi-day-plan?days=4",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["days"] == 4
        assert "has_repeats" in data
        assert "total_unique_meals" in data
        assert "total_repeated_meals" in data
        assert "plans" in data
        assert len(data["plans"]) == 4
        assert "total_price" in data

    async def test_multi_day_plan_has_day_info(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        await _seed_meals(db_session)

        resp = await client.post(
            "/api/v1/matching/multi-day-plan?days=4",
            headers=make_auth_header(user.id),
        )
        data = resp.json()
        for i, plan in enumerate(data["plans"]):
            assert plan["day"] == i + 1
            assert "date" in plan
            assert "repeated_meal_ids" in plan
            assert "items" in plan
            assert len(plan["items"]) == 4

    async def test_multi_day_plan_no_meals_returns_404(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        resp = await client.post(
            "/api/v1/matching/multi-day-plan?days=7",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 404

    async def test_multi_day_plan_requires_auth(self, client: AsyncClient) -> None:
        resp = await client.post("/api/v1/matching/multi-day-plan?days=7")
        assert resp.status_code in (401, 403)

    async def test_multi_day_plan_validates_days_range(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        await _seed_meals(db_session)

        # Too few days
        resp = await client.post(
            "/api/v1/matching/multi-day-plan?days=2",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 422

        # Too many days
        resp = await client.post(
            "/api/v1/matching/multi-day-plan?days=31",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestSlotAlternatives:
    async def test_get_alternatives(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        meals = await _seed_meals(db_session)

        resp = await client.post(
            "/api/v1/matching/plan/alternatives",
            headers=make_auth_header(user.id),
            json={"slot": "breakfast", "exclude_meal_ids": [], "limit": 5},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        # Should return breakfast meals
        for alt in data:
            assert "meal_id" in alt
            assert "score" in alt
            assert alt["category"] == "breakfast"

    async def test_alternatives_exclude_meals(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        meals = await _seed_meals(db_session)
        exclude_id = str(meals[0].id)  # Morning Oats

        resp = await client.post(
            "/api/v1/matching/plan/alternatives",
            headers=make_auth_header(user.id),
            json={
                "slot": "breakfast",
                "exclude_meal_ids": [exclude_id],
                "limit": 5,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        returned_ids = {alt["meal_id"] for alt in data}
        assert exclude_id not in returned_ids


@pytest.mark.asyncio
class TestRecalculatePlan:
    async def test_recalculate_plan(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        meals = await _seed_meals(db_session)

        # Pick one meal per slot
        items = []
        for cat in ["breakfast", "lunch", "dinner", "snack"]:
            meal = next(m for m in meals if m.category == cat)
            items.append({"slot": cat, "meal_id": str(meal.id)})

        resp = await client.post(
            "/api/v1/matching/plan/recalculate",
            headers=make_auth_header(user.id),
            json={"items": items},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "total_score" in data
        assert "items" in data
        assert len(data["items"]) == 4
        assert "actual_macros" in data
        assert "total_extra_price" in data
