import uuid

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Order(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "orders"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending_payment")
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    total: Mapped[float] = mapped_column(Float, nullable=False)
    delivery_slot_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("delivery_slots.id"), nullable=True
    )
    delivery_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    poster_order_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete")


class OrderItem(Base, UUIDMixin):
    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False
    )
    meal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meals.id"), nullable=False
    )
    meal_name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    extra_protein: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    extra_carbs: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    extra_fat: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    order: Mapped["Order"] = relationship(back_populates="items")
