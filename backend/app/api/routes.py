import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import Scan
from app.schemas import ScanListItem, ScanResult
from app.services.annotator import annotate_image
from app.services.classifier_mock import MockFindingClassifier
from app.services.classifier_real import RealFindingClassifier
from app.services.detector_mock import MockToothDetector
from app.services.detector_yolo import YoloToothDetector
from app.services.preprocess import preprocess_image
from app.services.report import create_pdf_report
from app.services.surface_mapper import infer_arch_midline, map_surfaces
from app.utils.fdi import quadrant, quadrant_name, tooth_name

router = APIRouter(prefix="/api")
SUPPORTED_TYPES = {"image/png", "image/jpeg"}
DISCLAIMER = "Preliminary diagnostic aid, not a replacement for clinical review."


def _image_bytes(image: np.ndarray) -> bytes:
    success, encoded = cv2.imencode(".png", image)
    if not success:
        raise HTTPException(status_code=500, detail="Unable to encode scan image.")
    return encoded.tobytes()


def _make_pipeline():
    settings = get_settings()
    if settings.model_mode == "mock":
        return MockToothDetector(), MockFindingClassifier()
    return YoloToothDetector(), RealFindingClassifier()


@router.post("/analyze", response_model=ScanResult, status_code=201)
async def analyze(
    file: UploadFile = File(...),
    xray_type: str = Form(default="panoramic"),
    db: Session = Depends(get_db),
):
    settings = get_settings()
    if xray_type not in {"panoramic", "bitewing", "periapical"}:
        raise HTTPException(status_code=422, detail="xray_type must be panoramic, bitewing, or periapical.")
    suffix = Path(file.filename or "").suffix.lower()
    if file.content_type not in SUPPORTED_TYPES or suffix not in {".png", ".jpg", ".jpeg"}:
        raise HTTPException(status_code=415, detail="Upload a PNG or JPEG X-ray image.")
    payload = await file.read(settings.max_upload_mb * 1024 * 1024 + 1)
    if not payload:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(payload) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds the {settings.max_upload_mb} MB upload limit.")
    decoded = cv2.imdecode(np.frombuffer(payload, dtype=np.uint8), cv2.IMREAD_COLOR)
    if decoded is None:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid PNG or JPEG image.")
    if decoded.shape[0] * decoded.shape[1] > 40_000_000:
        raise HTTPException(status_code=413, detail="Image dimensions exceed the 40-megapixel processing limit.")

    original_height, original_width = decoded.shape[:2]
    processed = preprocess_image(decoded)
    detector, classifier = _make_pipeline()
    try:
        detections = detector.predict(processed.image)
    except (NotImplementedError, RuntimeError) as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    scale_x = original_width / processed.image.shape[1]
    scale_y = original_height / processed.image.shape[0]
    # Keep all public coordinates in original-image pixels, independent of model resize.
    for detection in detections:
        x, y, width, height = detection.bbox
        detection.bbox = (x * scale_x, y * scale_y, width * scale_x, height * scale_y)
        detection.polygon = [(px * scale_x, py * scale_y) for px, py in detection.polygon]

    midline = infer_arch_midline(detections, original_width)
    teeth = []
    for index, detection in enumerate(detections, start=1):
        surface = map_surfaces(detection, midline)
        try:
            findings = classifier.predict(decoded, detection)
        except (NotImplementedError, RuntimeError) as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        teeth.append({
            "id": f"tooth-{index}",
            "fdi": detection.fdi,
            "quadrant": quadrant(detection.fdi),
            "tooth_name": tooth_name(detection.fdi),
            "confidence": detection.confidence,
            "bbox": list(detection.bbox),
            "polygon": [list(point) for point in detection.polygon],
            "surfaces": {key: value for key, value in surface.items() if key != "quadrant_side_mismatch"},
            "findings": [finding.model_dump() for finding in findings],
        })

    counts: dict[str, int] = {}
    for tooth in teeth:
        for finding in tooth["findings"]:
            counts[finding["type"]] = counts.get(finding["type"], 0) + 1
    now = datetime.now(timezone.utc)
    scan_id = str(uuid.uuid4())
    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    scan_dir = settings.storage_dir / scan_id
    scan_dir.mkdir(parents=True, exist_ok=False)
    original_path = scan_dir / "original.png"
    annotated_path = scan_dir / "annotated.png"
    preprocessed_path = scan_dir / "preprocessed.png"
    before_path = scan_dir / "before.png"
    # Re-encoding removes EXIF and other embedded metadata; never persist original bytes.
    original_path.write_bytes(_image_bytes(decoded))
    before_path.write_bytes(_image_bytes(processed.before_preview))
    preprocessed_path.write_bytes(_image_bytes(processed.after_preview))

    result = ScanResult(
        scan_id=scan_id,
        created_at=now,
        xray_type=xray_type,
        image={"width": original_width, "height": original_height},
        preprocessing={
            "steps": processed.steps,
            "before_url": f"/api/scans/{scan_id}/image?variant=before",
            "after_url": f"/api/scans/{scan_id}/image?variant=preprocessed",
        },
        teeth=teeth,
        summary={
            "teeth_detected": len(teeth),
            "teeth_with_findings": sum(bool(tooth["findings"]) for tooth in teeth),
            "counts_by_finding": counts,
        },
        disclaimer=DISCLAIMER,
    )
    annotated_path.write_bytes(_image_bytes(annotate_image(decoded, result)))
    db.add(Scan(
        id=scan_id,
        created_at=now,
        xray_type=xray_type,
        width=original_width,
        height=original_height,
        original_path=str(original_path.resolve()),
        annotated_path=str(annotated_path.resolve()),
        preprocessed_path=str(preprocessed_path.resolve()),
        result_json=result.model_dump_json(),
    ))
    db.commit()
    return result


@router.get("/scans", response_model=list[ScanListItem])
def list_scans(db: Session = Depends(get_db)):
    scans = db.scalars(select(Scan).order_by(Scan.created_at.desc())).all()
    return [
        {
            "scan_id": scan.id,
            "created_at": scan.created_at,
            "xray_type": scan.xray_type,
            "width": scan.width,
            "height": scan.height,
            "teeth_detected": json.loads(scan.result_json)["summary"]["teeth_detected"],
            "teeth_with_findings": json.loads(scan.result_json)["summary"]["teeth_with_findings"],
        }
        for scan in scans
    ]


def _get_scan(scan_id: str, db: Session) -> Scan:
    scan = db.get(Scan, scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found.")
    return scan


@router.get("/scans/{scan_id}", response_model=ScanResult)
def get_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = _get_scan(scan_id, db)
    return ScanResult.model_validate_json(scan.result_json)


@router.get("/scans/{scan_id}/image")
def get_scan_image(scan_id: str, variant: str = "original", db: Session = Depends(get_db)):
    scan = _get_scan(scan_id, db)
    if variant == "original":
        path = scan.original_path
    elif variant == "annotated":
        path = scan.annotated_path
    elif variant == "preprocessed":
        path = scan.preprocessed_path
    elif variant == "before":
        path = str(Path(scan.original_path).with_name("before.png"))
    else:
        raise HTTPException(status_code=422, detail="variant must be original, annotated, preprocessed, or before.")
    if not Path(path).is_file():
        raise HTTPException(status_code=404, detail="Image asset not found.")
    return FileResponse(path, media_type="image/png", filename=f"{scan_id}-{variant}.png")


@router.get("/scans/{scan_id}/report.pdf")
def get_scan_report(scan_id: str, db: Session = Depends(get_db)):
    scan = _get_scan(scan_id, db)
    result = ScanResult.model_validate_json(scan.result_json)
    content = create_pdf_report(result, scan.annotated_path)
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="dental-surface-{scan_id}.pdf"'},
    )


@router.delete("/scans/{scan_id}", status_code=204)
def delete_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = _get_scan(scan_id, db)
    scan_dir = Path(scan.original_path).parent
    db.delete(scan)
    db.commit()
    # Restrict cleanup to the UUID-named scan folder directly beneath configured storage.
    if scan_dir.parent.resolve() == get_settings().storage_dir.resolve():
        for filename in ("original.png", "annotated.png", "preprocessed.png", "before.png"):
            (scan_dir / filename).unlink(missing_ok=True)
        scan_dir.rmdir()


@router.get("/metrics")
def evaluation_metrics():
    return {
        "status": "sample",
        "label": "Sample values for UI preview only — replace with real validation-set results.",
        "metrics": {"iou": 0.72, "dice": 0.81, "map": 0.76, "precision": 0.84, "recall": 0.78},
        "evaluation_set": "Illustrative placeholder",
    }
