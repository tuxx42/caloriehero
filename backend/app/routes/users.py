"""User routes — profile management."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserProfileResponse, UserProfileUpdate, UserWithProfileResponse
from app.services.user_service import get_user_with_profile, update_profile

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/me", response_model=UserWithProfileResponse)
async def get_me(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserWithProfileResponse:
    full_user = await get_user_with_profile(db, user.id)
    return UserWithProfileResponse.model_validate(full_user)


@router.put("/me/profile", response_model=UserProfileResponse)
async def update_my_profile(
    data: UserProfileUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserProfileResponse:
    profile = await update_profile(db, user.id, data)
    return UserProfileResponse.model_validate(profile)
