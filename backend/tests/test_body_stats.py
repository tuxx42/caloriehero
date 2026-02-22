"""Tests for body stats persistence on user profile."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import UserProfile
from tests.conftest import create_test_user, make_auth_header


@pytest.mark.asyncio
class TestBodyStats:
    async def test_save_body_stats_via_profile_update(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        user = await create_test_user(db_session)
        resp = await client.put(
            "/api/v1/users/me/profile",
            headers=make_auth_header(user.id),
            json={
                "macro_targets": {"calories": 2200, "protein": 180, "carbs": 220, "fat": 70},
                "fitness_goal": "bulking",
                "weight_kg": 80,
                "height_cm": 180,
                "age": 25,
                "gender": "male",
                "activity_level": "active",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["weight_kg"] == 80
        assert data["height_cm"] == 180
        assert data["age"] == 25
        assert data["gender"] == "male"
        assert data["activity_level"] == "active"

    async def test_get_me_returns_body_stats(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        user = await create_test_user(
            db_session, google_id="bs-2", email="bs2@test.com"
        )
        # Create profile with body stats
        profile = UserProfile(
            user_id=user.id,
            macro_targets={"calories": 2000, "protein": 150, "carbs": 200, "fat": 65},
            fitness_goal="maintenance",
            allergies=[],
            dietary_preferences=[],
            weight_kg=70,
            height_cm=175,
            age=30,
            gender="female",
            activity_level="moderate",
        )
        db_session.add(profile)
        await db_session.commit()

        resp = await client.get(
            "/api/v1/users/me", headers=make_auth_header(user.id)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["profile"]["weight_kg"] == 70
        assert data["profile"]["height_cm"] == 175
        assert data["profile"]["age"] == 30
        assert data["profile"]["gender"] == "female"
        assert data["profile"]["activity_level"] == "moderate"

    async def test_body_stats_optional_null_when_not_set(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        user = await create_test_user(
            db_session, google_id="bs-3", email="bs3@test.com"
        )
        # Create profile without body stats
        resp = await client.put(
            "/api/v1/users/me/profile",
            headers=make_auth_header(user.id),
            json={
                "macro_targets": {"calories": 2000, "protein": 150, "carbs": 200, "fat": 65},
                "fitness_goal": "maintenance",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["weight_kg"] is None
        assert data["height_cm"] is None
        assert data["age"] is None
        assert data["gender"] is None
        assert data["activity_level"] is None

    async def test_invalid_gender_rejected(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        user = await create_test_user(
            db_session, google_id="bs-4", email="bs4@test.com"
        )
        resp = await client.put(
            "/api/v1/users/me/profile",
            headers=make_auth_header(user.id),
            json={
                "macro_targets": {"calories": 2000, "protein": 150, "carbs": 200, "fat": 65},
                "fitness_goal": "maintenance",
                "gender": "invalid",
            },
        )
        assert resp.status_code == 422

    async def test_invalid_activity_level_rejected(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        user = await create_test_user(
            db_session, google_id="bs-5", email="bs5@test.com"
        )
        resp = await client.put(
            "/api/v1/users/me/profile",
            headers=make_auth_header(user.id),
            json={
                "macro_targets": {"calories": 2000, "protein": 150, "carbs": 200, "fat": 65},
                "fitness_goal": "maintenance",
                "activity_level": "super_active",
            },
        )
        assert resp.status_code == 422
