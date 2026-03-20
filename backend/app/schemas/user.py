from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRole(StrEnum):
    USER = "USER"
    ADMIN = "ADMIN"


class SubscriptionTier(StrEnum):
    FREE = "FREE"
    PRO = "PRO"
    PREMIUM = "PREMIUM"


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = Field(default=None, max_length=120)
    currency: str = Field(default="EUR", min_length=3, max_length=3)
    monthly_income: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0"))


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72)


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=120)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    monthly_income: Decimal | None = Field(default=None, ge=Decimal("0"))


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=8, max_length=72)
    new_password: str = Field(min_length=8, max_length=72)


class UserRead(UserBase):
    id: int
    is_email_verified: bool
    role: UserRole
    subscription_tier: SubscriptionTier
    profile_picture: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminUserUpdate(BaseModel):
    role: UserRole | None = None
    subscription_tier: SubscriptionTier | None = None
