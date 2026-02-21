"""Delivery service unit tests."""

import pytest

from app.services.delivery_service import haversine_km


class TestHaversine:
    def test_same_point_is_zero(self) -> None:
        assert haversine_km(13.7563, 100.5018, 13.7563, 100.5018) == 0.0

    def test_bangkok_to_nearby(self) -> None:
        # Bangkok to ~1km away
        dist = haversine_km(13.7563, 100.5018, 13.7653, 100.5018)
        assert 0.5 < dist < 2.0

    def test_known_distance(self) -> None:
        # Bangkok to Chiang Mai ~600km
        dist = haversine_km(13.7563, 100.5018, 18.7883, 98.9853)
        assert 550 < dist < 650

    def test_symmetric(self) -> None:
        d1 = haversine_km(0.0, 0.0, 1.0, 1.0)
        d2 = haversine_km(1.0, 1.0, 0.0, 0.0)
        assert d1 == pytest.approx(d2)
