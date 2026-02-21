"""Webhook route tests."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.meal import Meal
from tests.conftest import create_test_user, make_auth_header


async def _seed_meal(db: AsyncSession) -> Meal:
    meal = Meal(
        name="Webhook Test Meal",
        description="A meal for webhook tests",
        category="lunch",
        calories=500.0,
        protein=40.0,
        carbs=45.0,
        fat=15.0,
        serving_size="350g",
        price=159.0,
        allergens=[],
        dietary_tags=[],
    )
    db.add(meal)
    await db.commit()
    await db.refresh(meal)
    return meal


@pytest.mark.asyncio
class TestStripeWebhook:
    async def test_payment_success_webhook(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        meal = await _seed_meal(db_session)

        # Create order
        order_resp = await client.post(
            "/api/v1/orders",
            json={"items": [{"meal_id": str(meal.id), "quantity": 1}]},
            headers=make_auth_header(user.id),
        )
        order_id = order_resp.json()["id"]

        # Pay for order (creates payment intent)
        pay_resp = await client.post(
            f"/api/v1/orders/{order_id}/pay",
            headers=make_auth_header(user.id),
        )
        pi_id = pay_resp.json()["payment_intent_id"]

        # Simulate webhook
        resp = await client.post(
            "/api/v1/webhooks/stripe",
            json={
                "type": "payment_intent.succeeded",
                "data": {"object": {"id": pi_id}},
            },
        )
        assert resp.status_code == 200
        assert resp.json()["order_status"] == "paid"

        # Verify order status changed
        order = await client.get(
            f"/api/v1/orders/{order_id}",
            headers=make_auth_header(user.id),
        )
        assert order.json()["status"] == "paid"

    async def test_unknown_event_type(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/api/v1/webhooks/stripe",
            json={"type": "charge.refunded", "data": {}},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    async def test_unknown_payment_intent(
        self, client: AsyncClient
    ) -> None:
        resp = await client.post(
            "/api/v1/webhooks/stripe",
            json={
                "type": "payment_intent.succeeded",
                "data": {"object": {"id": "pi_nonexistent"}},
            },
        )
        assert resp.status_code == 404
