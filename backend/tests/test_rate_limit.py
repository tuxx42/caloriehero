"""Tests for rate limiting middleware."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.middleware import RateLimitMiddleware


@pytest.mark.asyncio
class TestRateLimit:
    async def test_health_not_rate_limited(self, client: AsyncClient):
        """Health endpoint bypasses rate limiting."""
        for _ in range(5):
            resp = await client.get("/health")
            assert resp.status_code == 200

    async def test_rate_limit_enforced(self):
        """Requests exceeding limit get 429."""
        from fastapi import FastAPI

        app = FastAPI()

        @app.get("/test")
        async def test_endpoint():
            return {"ok": True}

        app.add_middleware(RateLimitMiddleware, requests_per_minute=3)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # First 3 should succeed
            for _ in range(3):
                resp = await client.get("/test")
                assert resp.status_code == 200

            # 4th should be rate limited
            resp = await client.get("/test")
            assert resp.status_code == 429
            assert resp.json()["detail"] == "Rate limit exceeded"

    async def test_health_bypasses_rate_limit(self):
        """Health endpoint is excluded from rate limit counting."""
        from fastapi import FastAPI

        app = FastAPI()

        @app.get("/health")
        async def health():
            return {"status": "ok"}

        @app.get("/test")
        async def test_endpoint():
            return {"ok": True}

        app.add_middleware(RateLimitMiddleware, requests_per_minute=2)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Hit health 10 times — should not count
            for _ in range(10):
                resp = await client.get("/health")
                assert resp.status_code == 200

            # Should still have full budget for /test
            resp = await client.get("/test")
            assert resp.status_code == 200
