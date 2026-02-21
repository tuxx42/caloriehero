"""Webhook routes — Stripe payment events."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.payment_service import handle_payment_success

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, str]:
    body = await request.json()

    event_type = body.get("type")
    if event_type == "payment_intent.succeeded":
        pi_id = body.get("data", {}).get("object", {}).get("id")
        if pi_id:
            order = await handle_payment_success(db, pi_id)
            if order is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Payment intent not found",
                )
            return {"status": "ok", "order_status": order.status}

    return {"status": "ok"}
