"""SSE connection manager — asyncio.Queue per connection."""

import asyncio
import json
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)


class SSEManager:
    def __init__(self) -> None:
        self._connections: dict[str, list[asyncio.Queue[str]]] = defaultdict(list)

    def subscribe(self, channel: str) -> asyncio.Queue[str]:
        queue: asyncio.Queue[str] = asyncio.Queue()
        self._connections[channel].append(queue)
        logger.info("SSE subscribe: %s (total: %d)", channel, len(self._connections[channel]))
        return queue

    def unsubscribe(self, channel: str, queue: asyncio.Queue[str]) -> None:
        if channel in self._connections:
            self._connections[channel] = [
                q for q in self._connections[channel] if q is not queue
            ]
            if not self._connections[channel]:
                del self._connections[channel]

    async def publish(self, channel: str, data: dict) -> None:
        message = json.dumps(data)
        queues = self._connections.get(channel, [])
        for queue in queues:
            await queue.put(message)

    def connection_count(self, channel: str) -> int:
        return len(self._connections.get(channel, []))


sse_manager = SSEManager()
