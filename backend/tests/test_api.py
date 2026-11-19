import cv2
import numpy as np
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.api import routes
from app.db import Base, get_db
from app.main import app
from app.config import Settings


def test_upload_history_assets_pdf_and_delete(monkeypatch, tmp_path):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    test_session = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_db():
        db = test_session()
        try:
            yield db
        finally:
            db.close()

    settings = Settings(model_mode="mock", storage_dir=tmp_path / "scans")
    monkeypatch.setattr(routes, "get_settings", lambda: settings)
    app.dependency_overrides[get_db] = override_db
    image = np.full((220, 360, 3), 145, dtype=np.uint8)
    success, encoded = cv2.imencode(".png", image)
    assert success
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/analyze",
                files={"file": ("sample.png", encoded.tobytes(), "image/png")},
                data={"xray_type": "panoramic"},
            )
            assert response.status_code == 201
            result = response.json()
            scan_id = result["scan_id"]
            assert result["summary"]["teeth_detected"] == 28
            assert len(result["teeth"][0]["surfaces"]["mesial_point"]) == 2
            assert client.get(f"/api/scans/{scan_id}").status_code == 200
            assert len(client.get("/api/scans").json()) == 1
            assert client.get(f"/api/scans/{scan_id}/image?variant=annotated").status_code == 200
            assert client.get(f"/api/scans/{scan_id}/image?variant=before").status_code == 200
            report = client.get(f"/api/scans/{scan_id}/report.pdf")
            assert report.status_code == 200
            assert report.headers["content-type"] == "application/pdf"
            assert client.delete(f"/api/scans/{scan_id}").status_code == 204
            assert client.get(f"/api/scans/{scan_id}").status_code == 404
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_upload_rejects_bad_type_and_invalid_xray_type():
    with TestClient(app) as client:
        bad_type = client.post(
            "/api/analyze", files={"file": ("notes.txt", b"no image", "text/plain")},
            data={"xray_type": "panoramic"},
        )
        assert bad_type.status_code == 415


def test_real_model_stub_returns_service_unavailable(monkeypatch, tmp_path):
    settings = Settings(model_mode="real", model_path=str(tmp_path / "not-ready.pt"), storage_dir=tmp_path / "scans")
    monkeypatch.setattr(routes, "get_settings", lambda: settings)
    image = np.full((120, 180, 3), 145, dtype=np.uint8)
    success, encoded = cv2.imencode(".png", image)
    assert success
    with TestClient(app) as client:
        response = client.post(
            "/api/analyze",
            files={"file": ("sample.png", encoded.tobytes(), "image/png")},
            data={"xray_type": "panoramic"},
        )
    assert response.status_code == 503
    assert "weights were not found" in response.json()["detail"]
