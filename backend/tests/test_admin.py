"""Tests for admin routes — stats, orders list, users list."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.meal import Meal
from app.models.order import Order, OrderItem
from tests.conftest import create_test_user, make_auth_header


@pytest.mark.asyncio
class TestAdminStats:
    async def test_non_admin_forbidden(self, client: AsyncClient, db_session: AsyncSession):
        user = await create_test_user(db_session)
        resp = await client.get("/api/v1/admin/stats", headers=make_auth_header(user.id))
        assert resp.status_code == 403

    async def test_admin_gets_stats(self, client: AsyncClient, db_session: AsyncSession):
        admin = await create_test_user(
            db_session, google_id="admin-1", email="admin@test.com", is_admin=True
        )
        resp = await client.get(
            "/api/v1/admin/stats", headers=make_auth_header(admin.id)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "total_users" in data
        assert "total_orders" in data
        assert "total_meals" in data
        assert "revenue" in data
        assert "orders_by_status" in data

    async def test_stats_count_correctly(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        admin = await create_test_user(
            db_session, google_id="admin-2", email="admin2@test.com", is_admin=True
        )

        # Create a meal
        meal = Meal(
            name="Test Meal",
            description="desc",
            category="lunch",
            calories=500,
            protein=40,
            carbs=45,
            fat=15,
            serving_size="350g",
            price=159,
            allergens=[],
            dietary_tags=[],
            active=True,
        )
        db_session.add(meal)
        await db_session.commit()
        await db_session.refresh(meal)

        # Create an order
        order = Order(
            user_id=admin.id,
            status="paid",
            type="one_time",
            total=159.0,
            items=[
                OrderItem(
                    meal_id=meal.id,
                    meal_name="Test Meal",
                    quantity=1,
                    unit_price=159,
                )
            ],
        )
        db_session.add(order)
        await db_session.commit()

        resp = await client.get(
            "/api/v1/admin/stats", headers=make_auth_header(admin.id)
        )
        data = resp.json()
        assert data["total_users"] >= 1
        assert data["total_orders"] >= 1
        assert data["total_meals"] >= 1
        assert data["revenue"] >= 159


@pytest.mark.asyncio
class TestAdminOrders:
    async def test_list_all_orders(self, client: AsyncClient, db_session: AsyncSession):
        admin = await create_test_user(
            db_session, google_id="admin-o", email="admin-o@test.com", is_admin=True
        )
        resp = await client.get(
            "/api/v1/admin/orders", headers=make_auth_header(admin.id)
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


@pytest.mark.asyncio
class TestAdminUsers:
    async def test_list_all_users(self, client: AsyncClient, db_session: AsyncSession):
        admin = await create_test_user(
            db_session, google_id="admin-u", email="admin-u@test.com", is_admin=True
        )
        resp = await client.get(
            "/api/v1/admin/users", headers=make_auth_header(admin.id)
        )
        assert resp.status_code == 200
        users = resp.json()
        assert len(users) >= 1
        assert users[0]["email"] == "admin-u@test.com"
