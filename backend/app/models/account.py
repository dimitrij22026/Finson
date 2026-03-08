from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import AccountType

if TYPE_CHECKING:  # pragma: no cover
    from app.models.user import User
    from app.models.transaction import Transaction
    from app.models.asset import Asset


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey(
        "users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    type: Mapped[AccountType] = mapped_column(
        Enum(AccountType, native_enum=False, length=32), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    balance: Mapped[Decimal] = mapped_column(
        Numeric(18, 8), default=0, nullable=False)
    is_default: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="accounts")
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="account", cascade="all, delete-orphan")
    assets: Mapped[list["Asset"]] = relationship(
        back_populates="account", cascade="all, delete-orphan")
