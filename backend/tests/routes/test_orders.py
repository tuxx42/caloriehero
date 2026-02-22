"""Order route tests."""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.meal import Meal
from app.models.settings import AppSettings
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


async def _seed_three_meals(db: AsyncSession) -> list[Meal]:
    """Seed 3 meals (breakfast + lunch + dinner) to satisfy minimum order size."""
    m1 = await _seed_meal(db, name="Breakfast", category="breakfast", price=100.0)
    m2 = await _seed_meal(db, name="Lunch", category="lunch", price=150.0)
    m3 = await _seed_meal(db, name="Dinner", category="dinner", price=200.0)
    return [m1, m2, m3]


def _three_item_payload(meals: list[Meal]) -> list[dict]:
    """Build a 3-item order payload from a list of meals."""
    return [{"meal_id": str(m.id), "quantity": 1} for m in meals]


@pytest.mark.asyncio
class TestCreateOrder:
    async def test_create_order(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        meals = await _seed_three_meals(db_session)
        resp = await client.post(
            "/api/v1/orders",
            json={
                "items": _three_item_payload(meals),
                "type": "one_time",
            },
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "pending_payment"
        # 100 + 150 + 200 = 450
        assert data["total"] == 450.0
        assert len(data["items"]) == 3

    async def test_create_order_multiple_quantities(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        meals = await _seed_three_meals(db_session)
        resp = await client.post(
            "/api/v1/orders",
            json={
                "items": [
                    {"meal_id": str(meals[0].id), "quantity": 1},
                    {"meal_id": str(meals[1].id), "quantity": 2},
                    {"meal_id": str(meals[2].id), "quantity": 3},
                ],
            },
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 201
        # 100*1 + 150*2 + 200*3 = 1000
        assert resp.json()["total"] == 1000.0

    async def test_create_order_invalid_meal(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        meals = await _seed_three_meals(db_session)
        resp = await client.post(
            "/api/v1/orders",
            json={
                "items": [
                    {"meal_id": str(meals[0].id), "quantity": 1},
                    {"meal_id": str(meals[1].id), "quantity": 1},
                    {"meal_id": str(uuid.uuid4()), "quantity": 1},
                ],
            },
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 400

    async def test_create_order_inactive_meal(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        meals = await _seed_three_meals(db_session)
        inactive = await _seed_meal(db_session, name="Inactive", active=False)
        resp = await client.post(
            "/api/v1/orders",
            json={
                "items": [
                    {"meal_id": str(meals[0].id), "quantity": 1},
                    {"meal_id": str(meals[1].id), "quantity": 1},
                    {"meal_id": str(inactive.id), "quantity": 1},
                ],
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

    async def test_create_order_too_few_items(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Orders with fewer than 3 items should be rejected (plan-only ordering)."""
        user = await create_test_user(db_session)
        meal = await _seed_meal(db_session)
        resp = await client.post(
            "/api/v1/orders",
            json={"items": [{"meal_id": str(meal.id), "quantity": 1}]},
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 422

    async def test_create_order_requires_auth(
        self, client: AsyncClient
    ) -> None:
        resp = await client.post(
            "/api/v1/orders",
            json={
                "items": [
                    {"meal_id": str(uuid.uuid4()), "quantity": 1},
                    {"meal_id": str(uuid.uuid4()), "quantity": 1},
                    {"meal_id": str(uuid.uuid4()), "quantity": 1},
                ],
            },
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
        meals = await _seed_three_meals(db_session)

        # User1 creates an order
        await client.post(
            "/api/v1/orders",
            json={"items": _three_item_payload(meals)},
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
        meals = await _seed_three_meals(db_session)
        create_resp = await client.post(
            "/api/v1/orders",
            json={"items": _three_item_payload(meals)},
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
        meals = await _seed_three_meals(db_session)
        create_resp = await client.post(
            "/api/v1/orders",
            json={"items": _three_item_payload(meals)},
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
        meals = await _seed_three_meals(db_session)
        create_resp = await client.post(
            "/api/v1/orders",
            json={"items": _three_item_payload(meals)},
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
        meals = await _seed_three_meals(db_session)
        create_resp = await client.post(
            "/api/v1/orders",
            json={"items": _three_item_payload(meals)},
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


@pytest.mark.asyncio
class TestOrderWithMacroExtras:
    async def _seed_settings(self, db: AsyncSession) -> AppSettings:
        s = AppSettings(
            protein_price_per_gram=3.0,
            carbs_price_per_gram=1.0,
            fat_price_per_gram=1.5,
        )
        db.add(s)
        await db.commit()
        await db.refresh(s)
        return s

    async def test_order_with_extra_protein(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        await self._seed_settings(db_session)
        meals = await _seed_three_meals(db_session)
        resp = await client.post(
            "/api/v1/orders",
            json={
                "items": [
                    {
                        "meal_id": str(meals[0].id),
                        "quantity": 1,
                        "extra_protein": 10,
                        "extra_carbs": 0,
                        "extra_fat": 0,
                    },
                    {"meal_id": str(meals[1].id), "quantity": 1},
                    {"meal_id": str(meals[2].id), "quantity": 1},
                ],
            },
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 201
        data = resp.json()
        # meals[0]: 100 + 10*3 = 130, meals[1]: 150, meals[2]: 200 → 480
        assert data["total"] == 480.0
        # Find the item with extra protein
        extra_item = next(i for i in data["items"] if i["extra_protein"] == 10)
        assert extra_item["extra_carbs"] == 0
        assert extra_item["extra_fat"] == 0

    async def test_order_with_all_extras(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        await self._seed_settings(db_session)
        meals = await _seed_three_meals(db_session)
        resp = await client.post(
            "/api/v1/orders",
            json={
                "items": [
                    {
                        "meal_id": str(meals[0].id),
                        "quantity": 2,
                        "extra_protein": 10,
                        "extra_carbs": 20,
                        "extra_fat": 5,
                    },
                    {"meal_id": str(meals[1].id), "quantity": 1},
                    {"meal_id": str(meals[2].id), "quantity": 1},
                ],
            },
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 201
        data = resp.json()
        # meals[0]: (100 + 10*3 + 20*1 + 5*1.5) * 2 = 157.5 * 2 = 315
        # meals[1]: 150, meals[2]: 200 → 665
        assert data["total"] == 665.0
        extra_item = next(i for i in data["items"] if i["extra_protein"] == 10)
        assert extra_item["unit_price"] == 157.5

    async def test_order_defaults_extras_to_zero(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        meals = await _seed_three_meals(db_session)
        resp = await client.post(
            "/api/v1/orders",
            json={"items": _three_item_payload(meals)},
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 201
        data = resp.json()
        for item in data["items"]:
            assert item["extra_protein"] == 0
            assert item["extra_carbs"] == 0
            assert item["extra_fat"] == 0
        # 100 + 150 + 200 = 450
        assert data["total"] == 450.0

    async def test_order_with_negative_extras_no_price_reduction(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Negative extras don't reduce the price."""
        user = await create_test_user(db_session)
        await self._seed_settings(db_session)
        meals = await _seed_three_meals(db_session)
        resp = await client.post(
            "/api/v1/orders",
            json={
                "items": [
                    {
                        "meal_id": str(meals[0].id),
                        "quantity": 1,
                        "extra_protein": -10,
                        "extra_carbs": -20,
                        "extra_fat": -5,
                    },
                    {"meal_id": str(meals[1].id), "quantity": 1},
                    {"meal_id": str(meals[2].id), "quantity": 1},
                ],
            },
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 201
        data = resp.json()
        # Price should stay at base: 100 + 150 + 200 = 450
        assert data["total"] == 450.0
        neg_item = next(i for i in data["items"] if i["extra_protein"] == -10)
        assert neg_item["extra_carbs"] == -20
        assert neg_item["extra_fat"] == -5

    async def test_order_rejects_excessive_negative_protein(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Can't remove more protein than the meal contains."""
        user = await create_test_user(db_session)
        await self._seed_settings(db_session)
        # Meal has 40g protein
        meals = await _seed_three_meals(db_session)
        bad_meal = await _seed_meal(db_session, name="High Protein", price=200.0, protein=40.0)
        resp = await client.post(
            "/api/v1/orders",
            json={
                "items": [
                    {
                        "meal_id": str(bad_meal.id),
                        "quantity": 1,
                        "extra_protein": -50,
                    },
                    {"meal_id": str(meals[0].id), "quantity": 1},
                    {"meal_id": str(meals[1].id), "quantity": 1},
                ],
            },
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 400

    async def test_order_with_mixed_extras(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Mixed positive and negative extras: only positive adds cost."""
        user = await create_test_user(db_session)
        await self._seed_settings(db_session)
        meals = await _seed_three_meals(db_session)
        resp = await client.post(
            "/api/v1/orders",
            json={
                "items": [
                    {
                        "meal_id": str(meals[0].id),
                        "quantity": 1,
                        "extra_protein": 10,
                        "extra_carbs": -15,
                        "extra_fat": 0,
                    },
                    {"meal_id": str(meals[1].id), "quantity": 1},
                    {"meal_id": str(meals[2].id), "quantity": 1},
                ],
            },
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 201
        data = resp.json()
        # meals[0]: 100 + max(0,10)*3 + max(0,-15)*1 + max(0,0)*1.5 = 130
        # meals[1]: 150, meals[2]: 200 → 480
        assert data["total"] == 480.0
