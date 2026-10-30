from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "bloodbridge"
    db_user: str = "postgres"
    db_password: str

    jwt_secret: str
    frontend_origin: str = "  http://localhost:8080/"
    cookie_secure: bool = False
    
    nebius_api_key: str
    nebius_model: str
    nebius_base_url: str = "https://api.tokenfactory.nebius.com/v1/"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        extra="ignore",
    )


settings = Settings()