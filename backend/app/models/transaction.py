from typing import TYPE_CHECKING
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import TransactionType


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey(
        "users.id", ondelete="CASCADE"), index=True)
    account_id: Mapped[int | None] = mapped_column(ForeignKey(
        "accounts.id", ondelete="SET NULL"), index=True, nullable=True)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="EUR")
    transaction_type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType, native_enum=False, length=16), nullable=False
    )
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="transactions")
    account: Mapped["Account"] = relationship(back_populates="transactions")


if TYPE_CHECKING:  # pragma: no cover
    from app.models.user import User
    from app.models.account import Account
