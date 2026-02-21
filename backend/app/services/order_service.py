"""Order service — create, list, get, update status."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.meal import Meal
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate


async def create_order(
    db: AsyncSession, user_id: uuid.UUID, data: OrderCreate
) -> Order:
    # Validate meals and snapshot prices
    meal_ids = [item.meal_id for item in data.items]
    result = await db.execute(
        select(Meal).where(Meal.id.in_(meal_ids), Meal.active.is_(True))
    )
    meals_by_id = {m.id: m for m in result.scalars().all()}

    missing = [str(mid) for mid in meal_ids if mid not in meals_by_id]
    if missing:
        raise ValueError(f"Meals not found or inactive: {', '.join(missing)}")

    order_items = []
    total = 0.0
    for item in data.items:
        meal = meals_by_id[item.meal_id]
        line_total = meal.price * item.quantity
        total += line_total
        order_items.append(
            OrderItem(
                meal_id=meal.id,
                meal_name=meal.name,
                quantity=item.quantity,
                unit_price=meal.price,
            )
        )

    order = Order(
        user_id=user_id,
        status="pending_payment",
        type=data.type,
        total=round(total, 2),
        delivery_slot_id=data.delivery_slot_id,
        delivery_address=data.delivery_address,
        items=order_items,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order, attribute_names=["items"])
    return order


async def get_order(
    db: AsyncSession, order_id: uuid.UUID
) -> Order | None:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    return result.scalar_one_or_none()


async def list_orders(
    db: AsyncSession, user_id: uuid.UUID
) -> list[Order]:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


async def update_order_status(
    db: AsyncSession, order_id: uuid.UUID, new_status: str
) -> Order | None:
    order = await get_order(db, order_id)
    if order is None:
        return None
    order.status = new_status
    await db.commit()
    await db.refresh(order)
    return order
