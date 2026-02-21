"""Order route tests."""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.meal import Meal
from tests.conftest import create_test_user, make_auth_header


async def _seed_meal(db: AsyncSession, **overrides: object) -> Meal:
    data = {
        "name": "Order Test Meal",
        "description": "A meal for order tests",
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
class TestCreateOrder:
    async def test_create_order(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        meal = await _seed_meal(db_session)
        resp = await client.post(
            "/api/v1/orders",
            json={
                "items": [{"meal_id": str(meal.id), "quantity": 2}],
                "type": "one_time",
            },
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "pending_payment"
        assert data["total"] == 318.0  # 159 * 2
        assert len(data["items"]) == 1
        assert data["items"][0]["meal_name"] == "Order Test Meal"
        assert data["items"][0]["quantity"] == 2

    async def test_create_order_multiple_items(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        meal1 = await _seed_meal(db_session, name="Meal A", price=100.0)
        meal2 = await _seed_meal(db_session, name="Meal B", price=200.0)
        resp = await client.post(
            "/api/v1/orders",
            json={
                "items": [
                    {"meal_id": str(meal1.id), "quantity": 1},
                    {"meal_id": str(meal2.id), "quantity": 3},
                ],
            },
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 201
        assert resp.json()["total"] == 700.0  # 100 + 200*3

    async def test_create_order_invalid_meal(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        resp = await client.post(
            "/api/v1/orders",
            json={
                "items": [{"meal_id": str(uuid.uuid4()), "quantity": 1}],
            },
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 400

    async def test_create_order_inactive_meal(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        meal = await _seed_meal(db_session, active=False)
        resp = await client.post(
            "/api/v1/orders",
            json={
                "items": [{"meal_id": str(meal.id), "quantity": 1}],
            },
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 400

    async def test_create_order_empty_items(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        resp = await client.post(
            "/api/v1/orders",
            json={"items": []},
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 422

    async def test_create_order_requires_auth(
        self, client: AsyncClient
    ) -> None:
        resp = await client.post(
            "/api/v1/orders",
            json={"items": [{"meal_id": str(uuid.uuid4()), "quantity": 1}]},
        )
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestListOrders:
    async def test_list_empty(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        resp = await client.get(
            "/api/v1/orders", headers=make_auth_header(user.id)
        )
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_own_orders_only(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user1 = await create_test_user(
            db_session, google_id="g1", email="u1@test.com"
        )
        user2 = await create_test_user(
            db_session, google_id="g2", email="u2@test.com"
        )
        meal = await _seed_meal(db_session)

        # User1 creates an order
        await client.post(
            "/api/v1/orders",
            json={"items": [{"meal_id": str(meal.id), "quantity": 1}]},
            headers=make_auth_header(user1.id),
        )

        # User2 should see no orders
        resp = await client.get(
            "/api/v1/orders", headers=make_auth_header(user2.id)
        )
        assert resp.json() == []

        # User1 should see their order
        resp = await client.get(
            "/api/v1/orders", headers=make_auth_header(user1.id)
        )
        assert len(resp.json()) == 1


@pytest.mark.asyncio
class TestGetOrder:
    async def test_get_own_order(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        meal = await _seed_meal(db_session)
        create_resp = await client.post(
            "/api/v1/orders",
            json={"items": [{"meal_id": str(meal.id), "quantity": 1}]},
            headers=make_auth_header(user.id),
        )
        order_id = create_resp.json()["id"]

        resp = await client.get(
            f"/api/v1/orders/{order_id}",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == order_id

    async def test_get_other_users_order_returns_404(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user1 = await create_test_user(
            db_session, google_id="g1", email="u1@test.com"
        )
        user2 = await create_test_user(
            db_session, google_id="g2", email="u2@test.com"
        )
        meal = await _seed_meal(db_session)
        create_resp = await client.post(
            "/api/v1/orders",
            json={"items": [{"meal_id": str(meal.id), "quantity": 1}]},
            headers=make_auth_header(user1.id),
        )
        order_id = create_resp.json()["id"]

        resp = await client.get(
            f"/api/v1/orders/{order_id}",
            headers=make_auth_header(user2.id),
        )
        assert resp.status_code == 404

    async def test_get_nonexistent_order(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        resp = await client.get(
            f"/api/v1/orders/{uuid.uuid4()}",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestPayOrder:
    async def test_pay_order(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        meal = await _seed_meal(db_session)
        create_resp = await client.post(
            "/api/v1/orders",
            json={"items": [{"meal_id": str(meal.id), "quantity": 1}]},
            headers=make_auth_header(user.id),
        )
        order_id = create_resp.json()["id"]

        resp = await client.post(
            f"/api/v1/orders/{order_id}/pay",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "client_secret" in data
        assert "payment_intent_id" in data

    async def test_pay_already_paid_order(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        meal = await _seed_meal(db_session)
        create_resp = await client.post(
            "/api/v1/orders",
            json={"items": [{"meal_id": str(meal.id), "quantity": 1}]},
            headers=make_auth_header(user.id),
        )
        order_id = create_resp.json()["id"]

        # Pay once
        await client.post(
            f"/api/v1/orders/{order_id}/pay",
            headers=make_auth_header(user.id),
        )

        # Simulate webhook marking order as paid
        await client.post(
            "/api/v1/webhooks/stripe",
            json={
                "type": "payment_intent.succeeded",
                "data": {
                    "object": {
                        "id": (await client.get(
                            f"/api/v1/orders/{order_id}",
                            headers=make_auth_header(user.id),
                        )).json()["stripe_payment_intent_id"]
                    }
                },
            },
        )

        # Try to pay again — should fail
        resp = await client.post(
            f"/api/v1/orders/{order_id}/pay",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 400
