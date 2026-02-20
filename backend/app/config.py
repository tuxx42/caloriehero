from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://caloriehero:caloriehero@localhost:5432/caloriehero"
    redis_url: str = "redis://localhost:6379"

    google_client_id: str = ""
    google_client_secret: str = ""
    jwt_secret: str = "dev-secret-change-me"

    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""

    poster_api_url: str = "https://joinposter.com/api"
    poster_access_token: str = ""
    poster_poll_interval_ms: int = 30000

    api_port: int = 8000
    api_host: str = "0.0.0.0"
    environment: str = "development"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
