from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Measurement(Base):
    __tablename__ = "measurements"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    device: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    temperature: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    humidity: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    pressure: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    rssi: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    firmware: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    uptime: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    free_heap: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    successful_uploads: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    failed_uploads: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )
