"""Request logging and rate limiting middleware (pure ASGI)."""

import logging
import time
from collections import defaultdict
from datetime import UTC, datetime

from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

logger = logging.getLogger("caloriehero.access")


class RequestLoggerMiddleware:
    """Logs method, path, status, and response time for each request."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["path"] == "/health":
            await self.app(scope, receive, send)
            return

        start = time.monotonic()
        status_code = 0

        async def send_wrapper(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
            await send(message)

        await self.app(scope, receive, send_wrapper)
        duration_ms = (time.monotonic() - start) * 1000
        logger.info(
            "%s %s → %d (%.1fms)",
            scope["method"],
            scope["path"],
            status_code,
            duration_ms,
        )


class RateLimitMiddleware:
    """Simple in-memory rate limiting per client IP."""

    def __init__(self, app: ASGIApp, *, requests_per_minute: int = 100) -> None:
        self.app = app
        self.rpm = requests_per_minute
        self._buckets: dict[str, list[float]] = defaultdict(list)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["path"] == "/health":
            await self.app(scope, receive, send)
            return

        request = Request(scope)
        client_ip = request.client.host if request.client else "unknown"
        now = datetime.now(UTC).timestamp()
        window_start = now - 60

        # Clean old entries and append current
        bucket = self._buckets[client_ip]
        self._buckets[client_ip] = [t for t in bucket if t > window_start]
        self._buckets[client_ip].append(now)

        if len(self._buckets[client_ip]) > self.rpm:
            response = JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded"},
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)
