"""Subscription route tests."""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import create_test_user, make_auth_header

SAMPLE_SCHEDULE = {"monday": True, "wednesday": True, "friday": True}
SAMPLE_MACROS = {"calories": 2000, "protein": 150, "carbs": 200, "fat": 65}


@pytest.mark.asyncio
class TestCreateSubscription:
    async def test_create(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        resp = await client.post(
            "/api/v1/subscriptions",
            json={"schedule": SAMPLE_SCHEDULE, "macro_targets": SAMPLE_MACROS},
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "active"
        assert data["schedule"] == SAMPLE_SCHEDULE
        assert data["macro_targets"] == SAMPLE_MACROS

    async def test_create_requires_auth(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/api/v1/subscriptions",
            json={"schedule": SAMPLE_SCHEDULE, "macro_targets": SAMPLE_MACROS},
        )
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestListSubscriptions:
    async def test_list_empty(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        resp = await client.get(
            "/api/v1/subscriptions",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_own_only(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user1 = await create_test_user(
            db_session, google_id="g1", email="u1@test.com"
        )
        user2 = await create_test_user(
            db_session, google_id="g2", email="u2@test.com"
        )
        await client.post(
            "/api/v1/subscriptions",
            json={"schedule": SAMPLE_SCHEDULE, "macro_targets": SAMPLE_MACROS},
            headers=make_auth_header(user1.id),
        )
        resp = await client.get(
            "/api/v1/subscriptions",
            headers=make_auth_header(user2.id),
        )
        assert resp.json() == []


@pytest.mark.asyncio
class TestPauseResumeCancel:
    async def _create_sub(
        self, client: AsyncClient, headers: dict
    ) -> str:
        resp = await client.post(
            "/api/v1/subscriptions",
            json={"schedule": SAMPLE_SCHEDULE, "macro_targets": SAMPLE_MACROS},
            headers=headers,
        )
        return resp.json()["id"]

    async def test_pause(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        headers = make_auth_header(user.id)
        sub_id = await self._create_sub(client, headers)

        resp = await client.post(
            f"/api/v1/subscriptions/{sub_id}/pause",
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "paused"
        assert resp.json()["paused_at"] is not None

    async def test_resume_after_pause(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        headers = make_auth_header(user.id)
        sub_id = await self._create_sub(client, headers)

        await client.post(
            f"/api/v1/subscriptions/{sub_id}/pause", headers=headers
        )
        resp = await client.post(
            f"/api/v1/subscriptions/{sub_id}/resume", headers=headers
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "active"

    async def test_cancel(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        headers = make_auth_header(user.id)
        sub_id = await self._create_sub(client, headers)

        resp = await client.post(
            f"/api/v1/subscriptions/{sub_id}/cancel", headers=headers
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"
        assert resp.json()["cancelled_at"] is not None

    async def test_cannot_pause_cancelled(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        headers = make_auth_header(user.id)
        sub_id = await self._create_sub(client, headers)

        await client.post(
            f"/api/v1/subscriptions/{sub_id}/cancel", headers=headers
        )
        resp = await client.post(
            f"/api/v1/subscriptions/{sub_id}/pause", headers=headers
        )
        assert resp.status_code == 400

    async def test_cannot_resume_active(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        headers = make_auth_header(user.id)
        sub_id = await self._create_sub(client, headers)

        resp = await client.post(
            f"/api/v1/subscriptions/{sub_id}/resume", headers=headers
        )
        assert resp.status_code == 400

    async def test_other_user_cannot_pause(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user1 = await create_test_user(
            db_session, google_id="g1", email="u1@test.com"
        )
        user2 = await create_test_user(
            db_session, google_id="g2", email="u2@test.com"
        )
        sub_id = await self._create_sub(
            client, make_auth_header(user1.id)
        )
        resp = await client.post(
            f"/api/v1/subscriptions/{sub_id}/pause",
            headers=make_auth_header(user2.id),
        )
        assert resp.status_code == 404

    async def test_nonexistent_subscription(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        user = await create_test_user(db_session)
        resp = await client.post(
            f"/api/v1/subscriptions/{uuid.uuid4()}/pause",
            headers=make_auth_header(user.id),
        )
        assert resp.status_code == 404
