"""User route tests."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import create_test_user, make_auth_header


@pytest.mark.asyncio
class TestGetMe:
    async def test_get_me_authenticated(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        resp = await client.get(
            "/api/v1/users/me", headers=make_auth_header(user.id)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"
        assert data["profile"] is None

    async def test_get_me_unauthenticated(self, client: AsyncClient) -> None:
        resp = await client.get("/api/v1/users/me")
        assert resp.status_code in (401, 403)

    async def test_get_me_invalid_token(self, client: AsyncClient) -> None:
        resp = await client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestUpdateProfile:
    async def test_create_profile_on_first_update(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        resp = await client.put(
            "/api/v1/users/me/profile",
            json={
                "fitness_goal": "cutting",
                "macro_targets": {
                    "calories": 1800,
                    "protein": 160,
                    "carbs": 150,
                    "fat": 55,
                },
            },
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["fitness_goal"] == "cutting"
        assert data["macro_targets"]["calories"] == 1800

    async def test_update_existing_profile(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        # First create profile
        await client.put(
            "/api/v1/users/me/profile",
            json={"fitness_goal": "maintenance"},
            headers=make_auth_header(user.id),
        )
        # Then update it
        resp = await client.put(
            "/api/v1/users/me/profile",
            json={"fitness_goal": "bulking"},
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 200
        assert resp.json()["fitness_goal"] == "bulking"

    async def test_update_allergies_and_preferences(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        resp = await client.put(
            "/api/v1/users/me/profile",
            json={
                "allergies": ["dairy", "peanuts"],
                "dietary_preferences": ["high_protein"],
                "fitness_goal": "maintenance",
            },
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["allergies"] == ["dairy", "peanuts"]
        assert data["dietary_preferences"] == ["high_protein"]

    async def test_update_delivery_info(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        resp = await client.put(
            "/api/v1/users/me/profile",
            json={
                "delivery_address": "123 Test St",
                "delivery_lat": 13.7563,
                "delivery_lng": 100.5018,
                "fitness_goal": "maintenance",
            },
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["delivery_address"] == "123 Test St"
        assert data["delivery_lat"] == pytest.approx(13.7563)

    async def test_profile_shows_in_get_me(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        await client.put(
            "/api/v1/users/me/profile",
            json={"fitness_goal": "keto"},
            headers=make_auth_header(user.id),
        )
        resp = await client.get(
            "/api/v1/users/me", headers=make_auth_header(user.id)
        )
        assert resp.status_code == 200
        assert resp.json()["profile"]["fitness_goal"] == "keto"

    async def test_update_profile_requires_auth(
        self, client: AsyncClient
    ) -> None:
        resp = await client.put(
            "/api/v1/users/me/profile",
            json={"fitness_goal": "maintenance"},
        )
        assert resp.status_code in (401, 403)

    async def test_invalid_fitness_goal(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        resp = await client.put(
            "/api/v1/users/me/profile",
            json={"fitness_goal": "invalid_goal"},
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 422
