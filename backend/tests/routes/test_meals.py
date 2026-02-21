"""Meals route tests."""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.meal import Meal
from tests.conftest import create_test_user, make_auth_header

SAMPLE_MEAL = {
    "name": "Test Chicken Bowl",
    "description": "Grilled chicken with rice",
    "category": "lunch",
    "calories": 550.0,
    "protein": 45.0,
    "carbs": 50.0,
    "fat": 15.0,
    "serving_size": "400g",
    "price": 189.0,
    "allergens": ["soy"],
    "dietary_tags": ["high_protein"],
}


async def _seed_meal(db: AsyncSession, **overrides: object) -> Meal:
    data = {
        "name": "Seed Meal",
        "description": "A test meal",
        "category": "lunch",
        "calories": 500.0,
        "protein": 40.0,
        "carbs": 45.0,
        "fat": 15.0,
        "serving_size": "350g",
        "price": 159.0,
        "allergens": [],
        "dietary_tags": [],
    }
    data.update(overrides)
    meal = Meal(**data)
    db.add(meal)
    await db.commit()
    await db.refresh(meal)
    return meal


@pytest.mark.asyncio
class TestListMeals:
    async def test_list_empty(self, client: AsyncClient) -> None:
        resp = await client.get("/api/v1/meals")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_returns_active_meals(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        await _seed_meal(db_session, name="Active Meal")
        await _seed_meal(db_session, name="Inactive Meal", active=False)
        resp = await client.get("/api/v1/meals")
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Active Meal"

    async def test_list_filter_by_category(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        await _seed_meal(db_session, name="Breakfast Item", category="breakfast")
        await _seed_meal(db_session, name="Lunch Item", category="lunch")
        resp = await client.get("/api/v1/meals?category=breakfast")
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Breakfast Item"


@pytest.mark.asyncio
class TestGetMeal:
    async def test_get_existing(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        meal = await _seed_meal(db_session)
        resp = await client.get(f"/api/v1/meals/{meal.id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Seed Meal"

    async def test_get_nonexistent(self, client: AsyncClient) -> None:
        fake_id = uuid.uuid4()
        resp = await client.get(f"/api/v1/meals/{fake_id}")
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestCreateMeal:
    async def test_create_as_admin(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        admin = await create_test_user(db_session, is_admin=True)
        resp = await client.post(
            "/api/v1/meals",
            json=SAMPLE_MEAL,
            headers=make_auth_header(admin.id),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Test Chicken Bowl"
        assert data["calories"] == 550.0
        assert data["active"] is True

    async def test_create_forbidden_for_non_admin(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        resp = await client.post(
            "/api/v1/meals",
            json=SAMPLE_MEAL,
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 403

    async def test_create_requires_auth(self, client: AsyncClient) -> None:
        resp = await client.post("/api/v1/meals", json=SAMPLE_MEAL)
        assert resp.status_code in (401, 403)

    async def test_create_validation_error(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        admin = await create_test_user(db_session, is_admin=True)
        resp = await client.post(
            "/api/v1/meals",
            json={"name": ""},
            headers=make_auth_header(admin.id),
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestUpdateMeal:
    async def test_update_as_admin(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        admin = await create_test_user(db_session, is_admin=True)
        meal = await _seed_meal(db_session)
        resp = await client.put(
            f"/api/v1/meals/{meal.id}",
            json={"name": "Updated Name", "price": 199.0},
            headers=make_auth_header(admin.id),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Updated Name"
        assert data["price"] == 199.0

    async def test_update_nonexistent(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        admin = await create_test_user(db_session, is_admin=True)
        resp = await client.put(
            f"/api/v1/meals/{uuid.uuid4()}",
            json={"name": "Nope"},
            headers=make_auth_header(admin.id),
        )
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestDeleteMeal:
    async def test_soft_delete(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        admin = await create_test_user(db_session, is_admin=True)
        meal = await _seed_meal(db_session)
        resp = await client.delete(
            f"/api/v1/meals/{meal.id}",
            headers=make_auth_header(admin.id),
        )
        assert resp.status_code == 200
        assert resp.json()["active"] is False

        # Verify not in public listing
        list_resp = await client.get("/api/v1/meals")
        assert len(list_resp.json()) == 0

    async def test_delete_nonexistent(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        admin = await create_test_user(db_session, is_admin=True)
        resp = await client.delete(
            f"/api/v1/meals/{uuid.uuid4()}",
            headers=make_auth_header(admin.id),
        )
        assert resp.status_code == 404
