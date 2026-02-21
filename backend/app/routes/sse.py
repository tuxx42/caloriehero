"""SSE routes — real-time order status updates."""

import asyncio
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.realtime.sse_manager import sse_manager
from app.services.order_service import get_order

router = APIRouter(prefix="/api/v1/sse", tags=["sse"])


@router.get("/orders/{order_id}")
async def stream_order_status(
    order_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EventSourceResponse:
    order = await get_order(db, order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    channel = f"order:{order_id}"
    queue = sse_manager.subscribe(channel)

    async def event_generator():  # type: ignore[no-untyped-def]
        try:
            while True:
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield {"event": "status", "data": data}
                except TimeoutError:
                    yield {"event": "ping", "data": ""}
        finally:
            sse_manager.unsubscribe(channel, queue)

    return EventSourceResponse(event_generator())
