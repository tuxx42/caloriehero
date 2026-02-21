"""SSE manager tests."""

import asyncio
import json

import pytest

from app.realtime.sse_manager import SSEManager


@pytest.mark.asyncio
class TestSSEManager:
    async def test_subscribe_and_publish(self) -> None:
        mgr = SSEManager()
        queue = mgr.subscribe("ch1")
        await mgr.publish("ch1", {"status": "paid"})

        msg = await asyncio.wait_for(queue.get(), timeout=1.0)
        assert json.loads(msg) == {"status": "paid"}

    async def test_multiple_subscribers(self) -> None:
        mgr = SSEManager()
        q1 = mgr.subscribe("ch1")
        q2 = mgr.subscribe("ch1")
        await mgr.publish("ch1", {"test": True})

        m1 = await asyncio.wait_for(q1.get(), timeout=1.0)
        m2 = await asyncio.wait_for(q2.get(), timeout=1.0)
        assert json.loads(m1) == {"test": True}
        assert json.loads(m2) == {"test": True}

    async def test_unsubscribe(self) -> None:
        mgr = SSEManager()
        queue = mgr.subscribe("ch1")
        assert mgr.connection_count("ch1") == 1
        mgr.unsubscribe("ch1", queue)
        assert mgr.connection_count("ch1") == 0

    async def test_separate_channels(self) -> None:
        mgr = SSEManager()
        q1 = mgr.subscribe("ch1")
        q2 = mgr.subscribe("ch2")
        await mgr.publish("ch1", {"msg": "for ch1"})

        m1 = await asyncio.wait_for(q1.get(), timeout=1.0)
        assert json.loads(m1) == {"msg": "for ch1"}
        assert q2.empty()

    async def test_connection_count(self) -> None:
        mgr = SSEManager()
        assert mgr.connection_count("ch1") == 0
        q1 = mgr.subscribe("ch1")
        assert mgr.connection_count("ch1") == 1
        q2 = mgr.subscribe("ch1")
        assert mgr.connection_count("ch1") == 2
        mgr.unsubscribe("ch1", q1)
        assert mgr.connection_count("ch1") == 1
        mgr.unsubscribe("ch1", q2)
        assert mgr.connection_count("ch1") == 0
