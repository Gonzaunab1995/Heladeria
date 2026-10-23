from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Flavor(Base):
    __tablename__ = "flavors"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[str] = mapped_column(String(255), default="")
    image_url: Mapped[str] = mapped_column(String(500), default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    total: Mapped[float] = mapped_column(Float)
    mp_preference_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    flavors: Mapped[list["Flavor"]] = relationship(secondary="order_flavors", lazy="selectin")


class OrderFlavor(Base):
    __tablename__ = "order_flavors"
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), primary_key=True)
    flavor_id: Mapped[int] = mapped_column(ForeignKey("flavors.id"), primary_key=True)
