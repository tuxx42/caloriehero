"""Auth route tests."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import create_test_user


@pytest.mark.asyncio
class TestGoogleLogin:
    async def test_login_creates_user(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/api/v1/auth/google",
            json={"id_token": "test:google-1:user@test.com:Test User"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["token_type"] == "bearer"
        assert "access_token" in data
        assert data["user"]["email"] == "user@test.com"
        assert data["user"]["name"] == "Test User"

    async def test_login_returns_existing_user(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ) -> None:
        await create_test_user(
            db_session, google_id="google-exist", email="exist@test.com", name="Existing"
        )
        resp = await client.post(
            "/api/v1/auth/google",
            json={"id_token": "test:google-exist:exist@test.com:Existing"},
        )
        assert resp.status_code == 200
        assert resp.json()["user"]["email"] == "exist@test.com"

    async def test_login_invalid_test_token(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/api/v1/auth/google",
            json={"id_token": "test:bad"},
        )
        assert resp.status_code == 401

    async def test_login_missing_id_token(self, client: AsyncClient) -> None:
        resp = await client.post("/api/v1/auth/google", json={})
        assert resp.status_code == 422

    async def test_login_returns_valid_jwt(
        self, client: AsyncClient
    ) -> None:
        resp = await client.post(
            "/api/v1/auth/google",
            json={"id_token": "test:g1:jwt@test.com:JWT User"},
        )
        token = resp.json()["access_token"]
        # Use the token to access a protected route
        me_resp = await client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == "jwt@test.com"
