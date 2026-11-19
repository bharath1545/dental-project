from functools import lru_cache
import os
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _is_vercel_runtime() -> bool:
    return os.getenv("VERCEL", "").lower() in {"1", "true"}


def _default_database_url() -> str:
    if _is_vercel_runtime():
        return "sqlite:////tmp/dental-surface-ai/dental_surface_ai.db"
    return "sqlite:///./data/dental_surface_ai.db"


def _default_storage_dir() -> Path:
    if _is_vercel_runtime():
        return Path("/tmp/dental-surface-ai/scans")
    return Path("./data/scans")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "DentalSurface AI"
    model_mode: str = "mock"
    model_path: str = "models/best.pt"
    conf_threshold: float = Field(default=0.35, ge=0, le=1)
    max_upload_mb: int = Field(default=12, ge=1, le=100)
    database_url: str = Field(default_factory=_default_database_url)
    storage_dir: Path = Field(default_factory=_default_storage_dir)
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @field_validator("model_mode")
    @classmethod
    def valid_model_mode(cls, value: str) -> str:
        normalized = value.lower().strip()
        if normalized not in {"mock", "real"}:
            raise ValueError("MODEL_MODE must be 'mock' or 'real'")
        return normalized

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
