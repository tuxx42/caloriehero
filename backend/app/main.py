from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.redis import close_redis, get_redis
from app.routes.auth import router as auth_router
from app.routes.health import router as health_router
from app.routes.meals import router as meals_router
from app.routes.users import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    # Startup
    await get_redis()
    yield
    # Shutdown
    await engine.dispose()
    await close_redis()


def create_app() -> FastAPI:
    app = FastAPI(title="CalorieHero API", version="1.0.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(meals_router)
    app.include_router(users_router)

    return app


app = create_app()
