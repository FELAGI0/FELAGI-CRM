from typing import Literal

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "FELAGI CRM"
    environment: Literal["dev", "staging", "prod"] = "dev"
    debug: bool = False
    log_level: str = "INFO"
    api_v1_prefix: str = "/api/v1"
    database_url: str | None = None
    postgres_db: str = "felagi_crm"
    postgres_user: str = "felagi_crm"
    postgres_password: SecretStr | None = None
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_ssl: bool = False
    jwt_secret_key: SecretStr
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @model_validator(mode="after")
    def validate_database_credentials(self) -> "Settings":
        if not self.database_url and self.postgres_password is None:
            raise ValueError("Either database_url or postgres_password is required")
        return self


settings = Settings.model_validate({})
