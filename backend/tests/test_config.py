from pathlib import Path

from app.config import Settings


def test_vercel_defaults_use_writable_temporary_storage(monkeypatch):
    monkeypatch.setenv("VERCEL", "1")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("STORAGE_DIR", raising=False)

    settings = Settings(_env_file=None)

    assert settings.database_url == "sqlite:////tmp/dental-surface-ai/dental_surface_ai.db"
    assert settings.storage_dir == Path("/tmp/dental-surface-ai/scans")


def test_explicit_storage_configuration_overrides_vercel_defaults(monkeypatch, tmp_path):
    database_path = tmp_path / "scans.db"
    storage_path = tmp_path / "images"
    monkeypatch.setenv("VERCEL", "1")
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{database_path.as_posix()}")
    monkeypatch.setenv("STORAGE_DIR", str(storage_path))

    settings = Settings(_env_file=None)

    assert settings.database_url.endswith("/scans.db")
    assert settings.storage_dir == storage_path
