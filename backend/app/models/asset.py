from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import AssetType, AssetTransactionType

if TYPE_CHECKING:  # pragma: no cover
    from app.models.user import User
    from app.models.account import Account


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey(
        "users.id", ondelete="CASCADE"), index=True)
    account_id: Mapped[int] = mapped_column(ForeignKey(
        "accounts.id", ondelete="CASCADE"), index=True)
    symbol: Mapped[str] = mapped_column(String(32), nullable=False)
    asset_type: Mapped[AssetType] = mapped_column(
        Enum(AssetType, native_enum=False, length=16), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(
        Numeric(18, 8), default=0, nullable=False)
    average_buy_price: Mapped[Decimal] = mapped_column(
        Numeric(18, 8), default=0, nullable=False)
    currency: Mapped[str] = mapped_column(
        String(10), nullable=False, default="USD")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="assets")
    account: Mapped["Account"] = relationship(back_populates="assets")
    transactions: Mapped[list["AssetTransaction"]] = relationship(
        back_populates="asset", cascade="all, delete-orphan")


class AssetTransaction(Base):
    __tablename__ = "asset_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey(
        "assets.id", ondelete="CASCADE"), index=True)
    transaction_type: Mapped[AssetTransactionType] = mapped_column(
        Enum(AssetTransactionType, native_enum=False, length=16), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 8), nullable=False)
    price_per_unit: Mapped[Decimal] = mapped_column(
        Numeric(18, 8), nullable=False)
    fees: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), default=0, nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    asset: Mapped["Asset"] = relationship(back_populates="transactions")
