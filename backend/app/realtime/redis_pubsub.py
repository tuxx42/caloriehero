"""Redis pub/sub for order status changes."""

import json
import logging

from app.redis import get_redis

logger = logging.getLogger(__name__)

CHANNEL_PREFIX = "order_status:"


async def publish_order_status(order_id: str, status: str) -> None:
    """Publish an order status change to Redis."""
    redis = await get_redis()
    if redis is None:
        return
    channel = f"{CHANNEL_PREFIX}{order_id}"
    message = json.dumps({"order_id": order_id, "status": status})
    await redis.publish(channel, message)


async def subscribe_order_status(order_id: str):  # type: ignore[no-untyped-def]
    """Subscribe to order status changes via Redis pub/sub.

    Returns an async generator of status messages.
    """
    redis = await get_redis()
    if redis is None:
        return
    channel = f"{CHANNEL_PREFIX}{order_id}"
    pubsub = redis.pubsub()
    await pubsub.subscribe(channel)
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                yield data
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
