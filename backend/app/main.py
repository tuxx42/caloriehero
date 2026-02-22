import json
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine
from app.middleware import RateLimitMiddleware, RequestLoggerMiddleware
from app.redis import close_redis, get_redis
from app.routes.admin import router as admin_router
from app.routes.auth import router as auth_router
from app.routes.delivery import router as delivery_router
from app.routes.health import router as health_router
from app.routes.matching import router as matching_router
from app.routes.meals import router as meals_router
from app.routes.orders import router as orders_router
from app.routes.settings import router as settings_router
from app.routes.sse import router as sse_router
from app.routes.subscriptions import router as subscriptions_router
from app.routes.users import router as users_router
from app.routes.webhooks import router as webhooks_router

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    # Startup
    if settings.redis_url:
        await get_redis()
    yield
    # Shutdown
    await engine.dispose()
    if settings.redis_url:
        await close_redis()


def create_app() -> FastAPI:
    app = FastAPI(title="CalorieHero API", version="1.0.0", lifespan=lifespan)

    app.add_middleware(RequestLoggerMiddleware)
    app.add_middleware(RateLimitMiddleware, requests_per_minute=100)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # API routes (registered first — take priority over static catch-all)
    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(meals_router)
    app.include_router(users_router)
    app.include_router(orders_router)
    app.include_router(delivery_router)
    app.include_router(webhooks_router)
    app.include_router(matching_router)
    app.include_router(subscriptions_router)
    app.include_router(sse_router)
    app.include_router(admin_router)
    app.include_router(settings_router)

    # --- Static frontend serving (Railway single-service deployment) ---
    if STATIC_DIR.is_dir():
        @app.get("/config.js")
        async def runtime_config() -> Response:
            """Inject runtime env vars for the frontend (replaces Docker entrypoint)."""
            config = {
                "GOOGLE_CLIENT_ID": settings.google_client_id,
                "STRIPE_PUBLISHABLE_KEY": settings.stripe_publishable_key,
                "API_URL": "",
            }
            js = f"window.__RUNTIME_CONFIG__ = {json.dumps(config)};"
            return Response(content=js, media_type="application/javascript")

        app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="static-assets")

        @app.get("/{path:path}")
        async def spa_fallback(request: Request, path: str) -> FileResponse:
            """Serve static files or fall back to index.html for SPA routing."""
            file_path = STATIC_DIR / path
            if path and file_path.is_file():
                return FileResponse(file_path)
            return FileResponse(STATIC_DIR / "index.html")

    return app


app = create_app()
