"""AppSettings model — global per-gram macro pricing."""

from sqlalchemy import Float
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class AppSettings(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "app_settings"

    protein_price_per_gram: Mapped[float] = mapped_column(
        Float, nullable=False, default=3.0
    )
    carbs_price_per_gram: Mapped[float] = mapped_column(
        Float, nullable=False, default=1.0
    )
    fat_price_per_gram: Mapped[float] = mapped_column(
        Float, nullable=False, default=1.5
    )
