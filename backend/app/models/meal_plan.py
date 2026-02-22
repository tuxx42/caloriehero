import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin


class MultiDayMealPlan(Base, UUIDMixin):
    __tablename__ = "multi_day_meal_plans"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    num_days: Mapped[int] = mapped_column(Integer, nullable=False)
    has_repeats: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    total_unique_meals: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_repeated_meals: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    plans: Mapped[list["MealPlan"]] = relationship(
        back_populates="multi_day_plan", cascade="all, delete"
    )


class MealPlan(Base, UUIDMixin):
    __tablename__ = "meal_plans"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    date: Mapped[str] = mapped_column(String(10), nullable=False)
    total_score: Mapped[float] = mapped_column(Float, nullable=False)
    actual_macros: Mapped[dict] = mapped_column(JSON, nullable=False)
    target_macros: Mapped[dict] = mapped_column(JSON, nullable=False)
    multi_day_plan_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("multi_day_meal_plans.id"), nullable=True
    )
    day_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    items: Mapped[list["MealPlanItem"]] = relationship(
        back_populates="plan", cascade="all, delete"
    )
    multi_day_plan: Mapped["MultiDayMealPlan | None"] = relationship(
        back_populates="plans"
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
    extra_protein: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    extra_carbs: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    extra_fat: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    plan: Mapped["MealPlan"] = relationship(back_populates="items")
