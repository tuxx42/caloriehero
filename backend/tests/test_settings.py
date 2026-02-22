"""Settings route tests."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.settings import AppSettings
from tests.conftest import create_test_user, make_auth_header


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
class TestGetPricing:
    async def test_get_pricing_returns_defaults(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        resp = await client.get("/api/v1/settings/pricing")
        assert resp.status_code == 200
        data = resp.json()
        assert data["protein_price_per_gram"] == 3.0
        assert data["carbs_price_per_gram"] == 1.0
        assert data["fat_price_per_gram"] == 1.5

    async def test_get_pricing_returns_existing(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        await _seed_settings(db_session, protein=5.0, carbs=2.0, fat=3.0)
        resp = await client.get("/api/v1/settings/pricing")
        assert resp.status_code == 200
        data = resp.json()
        assert data["protein_price_per_gram"] == 5.0
        assert data["carbs_price_per_gram"] == 2.0
        assert data["fat_price_per_gram"] == 3.0

    async def test_get_pricing_is_public(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        # No auth header — should still work
        resp = await client.get("/api/v1/settings/pricing")
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestUpdatePricing:
    async def test_update_pricing_as_admin(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        admin = await create_test_user(db_session, is_admin=True)
        resp = await client.put(
            "/api/v1/settings/pricing",
            json={"protein_price_per_gram": 5.0, "carbs_price_per_gram": 2.5},
            headers=make_auth_header(admin.id),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["protein_price_per_gram"] == 5.0
        assert data["carbs_price_per_gram"] == 2.5
        assert data["fat_price_per_gram"] == 1.5  # Unchanged

    async def test_update_pricing_partial(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        admin = await create_test_user(db_session, is_admin=True)
        resp = await client.put(
            "/api/v1/settings/pricing",
            json={"fat_price_per_gram": 4.0},
            headers=make_auth_header(admin.id),
        )
        assert resp.status_code == 200
        assert resp.json()["fat_price_per_gram"] == 4.0

    async def test_update_pricing_requires_admin(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session, is_admin=False)
        resp = await client.put(
            "/api/v1/settings/pricing",
            json={"protein_price_per_gram": 5.0},
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 403

    async def test_update_pricing_requires_auth(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        resp = await client.put(
            "/api/v1/settings/pricing",
            json={"protein_price_per_gram": 5.0},
        )
        assert resp.status_code in (401, 403)

    async def test_update_pricing_invalid_value(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        admin = await create_test_user(db_session, is_admin=True)
        resp = await client.put(
            "/api/v1/settings/pricing",
            json={"protein_price_per_gram": -1.0},
            headers=make_auth_header(admin.id),
        )
        assert resp.status_code == 422
