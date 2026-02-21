"""Delivery route tests."""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.delivery import DeliverySlot, DeliveryZone


async def _seed_zone(db: AsyncSession, **overrides: object) -> DeliveryZone:
    data = {
        "name": "Test Zone",
        "lat": 13.7563,
        "lng": 100.5018,
        "radius_km": 5.0,
        "delivery_fee": 50.0,
    }
    data.update(overrides)
    zone = DeliveryZone(**data)
    db.add(zone)
    await db.commit()
    await db.refresh(zone)
    return zone


async def _seed_slot(
    db: AsyncSession, zone_id: uuid.UUID, **overrides: object
) -> DeliverySlot:
    data = {
        "date": "2026-03-01",
        "start_time": "09:00",
        "end_time": "12:00",
        "zone_id": zone_id,
        "capacity": 10,
    }
    data.update(overrides)
    slot = DeliverySlot(**data)
    db.add(slot)
    await db.commit()
    await db.refresh(slot)
    return slot


@pytest.mark.asyncio
class TestListZones:
    async def test_list_empty(self, client: AsyncClient) -> None:
        resp = await client.get("/api/v1/delivery/zones")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_active_zones(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        await _seed_zone(db_session, name="Active Zone")
        await _seed_zone(db_session, name="Inactive Zone", active=False)
        resp = await client.get("/api/v1/delivery/zones")
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Active Zone"

    async def test_zone_response_fields(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        await _seed_zone(db_session)
        resp = await client.get("/api/v1/delivery/zones")
        data = resp.json()[0]
        assert data["lat"] == pytest.approx(13.7563)
        assert data["lng"] == pytest.approx(100.5018)
        assert data["radius_km"] == 5.0
        assert data["delivery_fee"] == 50.0


@pytest.mark.asyncio
class TestListSlots:
    async def test_list_slots_for_zone(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        zone = await _seed_zone(db_session)
        await _seed_slot(db_session, zone.id)
        await _seed_slot(
            db_session, zone.id, start_time="12:00", end_time="15:00"
        )
        resp = await client.get(
            f"/api/v1/delivery/zones/{zone.id}/slots"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    async def test_slot_includes_available_count(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        zone = await _seed_zone(db_session)
        await _seed_slot(db_session, zone.id, capacity=10, booked_count=3)
        resp = await client.get(
            f"/api/v1/delivery/zones/{zone.id}/slots"
        )
        data = resp.json()[0]
        assert data["capacity"] == 10
        assert data["booked_count"] == 3
        assert data["available"] == 7

    async def test_filter_slots_by_date(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        zone = await _seed_zone(db_session)
        await _seed_slot(db_session, zone.id, date="2026-03-01")
        await _seed_slot(db_session, zone.id, date="2026-03-02")
        resp = await client.get(
            f"/api/v1/delivery/zones/{zone.id}/slots?date=2026-03-01"
        )
        data = resp.json()
        assert len(data) == 1
        assert data[0]["date"] == "2026-03-01"

    async def test_empty_slots_for_unknown_zone(
        self, client: AsyncClient
    ) -> None:
        resp = await client.get(
            f"/api/v1/delivery/zones/{uuid.uuid4()}/slots"
        )
        assert resp.status_code == 200
        assert resp.json() == []
