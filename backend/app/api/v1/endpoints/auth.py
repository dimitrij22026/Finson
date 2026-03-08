from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api import deps
from app.core.config import settings
from app.core.security import create_access_token, token_expiration
from app.schemas import LoginRequest, Token, UserCreate, UserRead
from app.services import user_service
from app.services.email_service import (
    create_verification_token,
    send_verification_email,
    verify_email_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: str


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(*, db: Session = Depends(deps.get_db), user_in: UserCreate) -> UserRead:
    existing = user_service.get_by_email(db, user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    try:
        user = user_service.create(db, user_in)
        # Send verification email
        token = create_verification_token(user.email)
        send_verification_email(user.email, token)
        return user
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        ) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again.",
        ) from exc


@router.post("/verify-email", status_code=status.HTTP_200_OK)
def verify_email(*, db: Session = Depends(deps.get_db), request: VerifyEmailRequest):
    """Verify user's email address using the token sent to their email."""
    email = verify_email_token(request.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Невалиден или истечен токен за верификација",
        )

    user = user_service.get_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Корисникот не е пронајден",
        )

    if user.is_email_verified:
        return {"message": "Email-от е веќе потврден"}

    user.is_email_verified = True
    db.commit()
    return {"message": "Email-от е успешно потврден"}


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
def resend_verification(*, db: Session = Depends(deps.get_db), request: ResendVerificationRequest):
    """Resend verification email."""
    user = user_service.get_by_email(db, request.email)
    if not user:
        # Don't reveal if email exists
        return {"message": "Ако email-от постои, ќе добиете нов линк за верификација"}

    if user.is_email_verified:
        return {"message": "Email-от е веќе потврден"}

    token = create_verification_token(user.email)
    send_verification_email(user.email, token)
    return {"message": "Ако email-от постои, ќе добиете нов линк за верификација"}


@router.post("/login", response_model=Token)
def login(*, db: Session = Depends(deps.get_db), credentials: LoginRequest) -> Token:
    user = user_service.authenticate(
        db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Incorrect email or password")
    access_token = create_access_token(
        user.id, token_expiration(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(access_token=access_token)
