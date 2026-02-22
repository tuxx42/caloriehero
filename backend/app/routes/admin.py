"""Admin routes — dashboard stats, all-orders list, all-users list."""

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.meal import Meal
from app.models.order import Order
from app.models.subscription import Subscription
from app.models.user import User

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


class DashboardStats(BaseModel):
    total_users: int
    total_orders: int
    total_meals: int
    active_subscriptions: int
    revenue: float
    orders_by_status: dict[str, int]


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(get_current_admin)],
) -> DashboardStats:
    users_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    orders_count = (await db.execute(select(func.count(Order.id)))).scalar() or 0
    meals_count = (
        await db.execute(select(func.count(Meal.id)).where(Meal.active.is_(True)))
    ).scalar() or 0
    active_subs = (
        await db.execute(
            select(func.count(Subscription.id)).where(Subscription.status == "active")
        )
    ).scalar() or 0
    revenue = (
        await db.execute(
            select(func.coalesce(func.sum(Order.total), 0)).where(
                Order.status.notin_(["pending_payment", "cancelled"])
            )
        )
    ).scalar() or 0

    # Orders by status
    status_rows = (
        await db.execute(
            select(Order.status, func.count(Order.id)).group_by(Order.status)
        )
    ).all()
    orders_by_status = {row[0]: row[1] for row in status_rows}

    return DashboardStats(
        total_users=users_count,
        total_orders=orders_count,
        total_meals=meals_count,
        active_subscriptions=active_subs,
        revenue=float(revenue),
        orders_by_status=orders_by_status,
    )


@router.get("/orders")
async def list_all_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(get_current_admin)],
) -> list[dict]:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
        .limit(100)
    )
    orders = result.scalars().all()
    return [
        {
            "id": str(o.id),
            "user_id": str(o.user_id),
            "status": o.status,
            "total": o.total,
            "type": o.type,
            "items_count": len(o.items),
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]


@router.get("/users")
async def list_all_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(get_current_admin)],
) -> list[dict]:
    result = await db.execute(select(User).order_by(User.created_at.desc()).limit(100))
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "name": u.name,
            "is_admin": u.is_admin,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]
