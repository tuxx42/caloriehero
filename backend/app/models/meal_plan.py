import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin


class MealPlan(Base, UUIDMixin):
    __tablename__ = "meal_plans"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    date: Mapped[str] = mapped_column(String(10), nullable=False)
    total_score: Mapped[float] = mapped_column(Float, nullable=False)
    actual_macros: Mapped[dict] = mapped_column(JSON, nullable=False)
    target_macros: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    items: Mapped[list["MealPlanItem"]] = relationship(
        back_populates="plan", cascade="all, delete"
    )


class MealPlanItem(Base, UUIDMixin):
    __tablename__ = "meal_plan_items"

    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meal_plans.id"), nullable=False
    )
    slot: Mapped[str] = mapped_column(String(20), nullable=False)
    meal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meals.id"), nullable=False
    )
    score: Mapped[float] = mapped_column(Float, nullable=False)
    slot_targets: Mapped[dict] = mapped_column(JSON, nullable=False)

    plan: Mapped["MealPlan"] = relationship(back_populates="items")
