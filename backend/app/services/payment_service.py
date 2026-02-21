"""Payment service — create payment intent, handle webhook."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.models.payment import PaymentIntent
from app.providers.payment_provider import PaymentProvider, PaymentResult


async def create_payment_for_order(
    db: AsyncSession,
    provider: PaymentProvider,
    order_id: uuid.UUID,
) -> PaymentResult:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if order is None:
        raise ValueError("Order not found")

    if order.status != "pending_payment":
        raise ValueError(f"Order is not payable (status: {order.status})")

    amount_cents = int(order.total * 100)
    payment_result = await provider.create_payment_intent(
        amount_cents=amount_cents,
        currency="thb",
        metadata={"order_id": str(order.id)},
    )

    payment_intent = PaymentIntent(
        stripe_payment_intent_id=payment_result.payment_intent_id,
        amount=order.total,
        currency="thb",
        status="pending",
        order_id=order.id,
    )
    db.add(payment_intent)

    order.stripe_payment_intent_id = payment_result.payment_intent_id
    await db.commit()

    return payment_result


async def handle_payment_success(
    db: AsyncSession, payment_intent_id: str
) -> Order | None:
    result = await db.execute(
        select(PaymentIntent).where(
            PaymentIntent.stripe_payment_intent_id == payment_intent_id
        )
    )
    pi = result.scalar_one_or_none()
    if pi is None:
        return None

    pi.status = "succeeded"

    order_result = await db.execute(
        select(Order).where(Order.id == pi.order_id)
    )
    order = order_result.scalar_one_or_none()
    if order is not None:
        order.status = "paid"

    await db.commit()
    return order
