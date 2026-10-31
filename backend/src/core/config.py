from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Настройки приложения, загружаемые из переменных окружения или файла .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Smart Emullators"
    DEBUG: bool = False
    CORS_ORIGINS: list[str] = []

    # Database settings
    POSTGRES_USER: str
    POSTGRES_PASSWORD: SecretStr
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_DB: str

    # JWT settings
    JWT_SECRET: SecretStr
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REMEMBER_ME_EXPIRE_DAYS: int = 30

    @property
    def DATABASE_URL(self) -> str:
        """Строка подключения к PostgreSQL (драйвер asyncpg)."""

        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD.get_secret_value()}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()