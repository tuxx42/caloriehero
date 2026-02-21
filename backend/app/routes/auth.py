"""Auth routes — Google OAuth login."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.schemas.auth import TokenResponse
from app.schemas.user import GoogleLoginRequest
from app.services.user_service import find_or_create_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


async def _verify_google_token(id_token: str) -> dict:
    """Verify Google ID token and return user info.

    In production, calls Google's tokeninfo endpoint.
    For testing, accepts tokens in format "test:<google_id>:<email>:<name>".
    """
    if id_token.startswith("test:"):
        parts = id_token.split(":")
        if len(parts) != 4:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid test token format",
            )
        return {"sub": parts[1], "email": parts[2], "name": parts[3]}

    # Production: verify with Google
    try:
        import httpx

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google token",
                )
            data = resp.json()
            if data.get("aud") != settings.google_client_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token audience mismatch",
                )
            return data
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to verify Google token",
        )


@router.post("/google", response_model=TokenResponse)
async def google_login(
    body: GoogleLoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    google_user = await _verify_google_token(body.id_token)

    user, _ = await find_or_create_user(
        db,
        google_id=google_user["sub"],
        email=google_user["email"],
        name=google_user["name"],
    )

    access_token = jwt.encode(
        {"sub": str(user.id)},
        settings.jwt_secret,
        algorithm="HS256",
    )

    return TokenResponse(
        access_token=access_token,
        user=user,  # type: ignore[arg-type]
    )
