"""Mock poster provider tests."""

import pytest

from app.providers.poster_provider import POSTER_STATUS_MAP, MockPosterProvider


@pytest.mark.asyncio
class TestMockPosterProvider:
    async def test_create_order(self) -> None:
        provider = MockPosterProvider()
        order_id = await provider.create_order({"total": 100})
        assert order_id.startswith("poster_mock_")

    async def test_get_status_after_create(self) -> None:
        provider = MockPosterProvider()
        order_id = await provider.create_order({"total": 100})
        status = await provider.get_order_status(order_id)
        assert status == "preparing"  # "new" maps to "preparing"

    async def test_set_status(self) -> None:
        provider = MockPosterProvider()
        order_id = await provider.create_order({"total": 100})
        provider.set_status(order_id, "ready")
        status = await provider.get_order_status(order_id)
        assert status == "ready"

    async def test_unknown_order(self) -> None:
        provider = MockPosterProvider()
        status = await provider.get_order_status("unknown")
        assert status is None


class TestPosterStatusMap:
    def test_status_map_completeness(self) -> None:
        expected = {
            "new", "accepted", "cooking", "ready",
            "delivering", "delivered", "cancelled",
        }
        assert set(POSTER_STATUS_MAP.keys()) == expected
