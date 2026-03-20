from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models import User
from app.schemas import AdminUserUpdate, UserRead
from app.services import user_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserRead])
def list_all_users(
    *,
    db: Session = Depends(deps.get_db),
    _: User = Depends(deps.get_current_admin_user),
) -> list[UserRead]:
    return user_service.list_users(db)


@router.patch("/users/{user_id}", response_model=UserRead)
def update_user_admin_fields(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    user_in: AdminUserUpdate,
    current_admin: User = Depends(deps.get_current_admin_user),
) -> UserRead:
    user = user_service.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent a user from accidentally removing their own admin access.
    if user.id == current_admin.id and user_in.role is not None and user_in.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own admin role",
        )

    return user_service.update_admin_fields(db, user, user_in)
