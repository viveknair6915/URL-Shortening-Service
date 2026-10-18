from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, RedisDsn, computed_field

class Settings(BaseSettings):
    PROJECT_NAME: str = "URL Shortener"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = []

    # Database
    DATABASE_URL: Optional[str] = None
    POSTGRES_SERVER: Optional[str] = None
    POSTGRES_USER: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_DB: Optional[str] = None
    POSTGRES_PORT: int = 5432

    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            import urllib.parse as up
            uri = self.DATABASE_URL
            if uri.startswith("postgres://"):
                uri = uri.replace("postgres://", "postgresql+asyncpg://", 1)
            elif uri.startswith("postgresql://") and not uri.startswith("postgresql+asyncpg://"):
                uri = uri.replace("postgresql://", "postgresql+asyncpg://", 1)

            parsed = up.urlparse(uri)
            if parsed.query:
                q = up.parse_qs(parsed.query)
                q.pop("channel_binding", None)
                ssl_mode = q.pop("sslmode", None)
                if ssl_mode:
                    q["ssl"] = ssl_mode
                new_query = up.urlencode(q, doseq=True)
                uri = up.urlunparse(parsed._replace(query=new_query))
            return uri
        return str(
            PostgresDsn.build(
                scheme="postgresql+asyncpg",
                username=self.POSTGRES_USER or "postgres",
                password=self.POSTGRES_PASSWORD or "postgres",
                host=self.POSTGRES_SERVER or "localhost",
                port=self.POSTGRES_PORT,
                path=self.POSTGRES_DB or "urlshortener",
            )
        )

    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_URL: Optional[str] = None
    
    @computed_field
    @property
    def ASYNC_REDIS_URL(self) -> str:
        if self.REDIS_URL:
            return self.REDIS_URL
        return str(
            RedisDsn.build(
                scheme="redis",
                host=self.REDIS_HOST,
                port=self.REDIS_PORT,
            )
        )

    # App
    ENVIRONMENT: str = "production"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
