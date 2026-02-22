"""Settings routes — global pricing config."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.user import User
from app.schemas.settings import SettingsResponse, SettingsUpdate
from app.services.pricing_service import get_settings, update_settings

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


@router.get("/pricing", response_model=SettingsResponse)
async def get_pricing(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SettingsResponse:
    settings = await get_settings(db)
    return SettingsResponse.model_validate(settings)


@router.put("/pricing", response_model=SettingsResponse)
async def update_pricing(
    data: SettingsUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(get_current_admin)],
) -> SettingsResponse:
    settings = await update_settings(db, data)
    return SettingsResponse.model_validate(settings)
