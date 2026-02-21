"""User and profile service."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User, UserProfile
from app.schemas.user import UserProfileUpdate


async def find_or_create_user(
    db: AsyncSession,
    *,
    google_id: str,
    email: str,
    name: str,
) -> tuple[User, bool]:
    """Find existing user by google_id or create new one.

    Returns (user, created) tuple.
    """
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.google_id == google_id)
    )
    user = result.scalar_one_or_none()
    if user is not None:
        return user, False

    user = User(google_id=google_id, email=email, name=name)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user, True


async def get_user_with_profile(
    db: AsyncSession, user_id: uuid.UUID
) -> User | None:
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == user_id)
    )
    return result.scalar_one_or_none()


async def update_profile(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: UserProfileUpdate,
) -> UserProfile:
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()

    updates = data.model_dump(exclude_unset=True)
    if "macro_targets" in updates and updates["macro_targets"] is not None:
        mt = updates["macro_targets"]
        if hasattr(mt, "model_dump"):
            updates["macro_targets"] = mt.model_dump()
        # Otherwise it's already a dict from model_dump()

    if profile is None:
        # Create default profile, then apply updates
        profile = UserProfile(
            user_id=user_id,
            macro_targets={"calories": 2000, "protein": 150, "carbs": 200, "fat": 65},
            fitness_goal="maintenance",
            allergies=[],
            dietary_preferences=[],
        )
        for key, value in updates.items():
            setattr(profile, key, value)
        db.add(profile)
    else:
        for key, value in updates.items():
            setattr(profile, key, value)

    await db.commit()
    await db.refresh(profile)
    return profile
