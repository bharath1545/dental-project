# DentalSurface AI

An academic prototype for **AI-Based Dental Surface Identification and Abnormality Detection**, developed for ECE at AJ Institute of Engineering and Technology. It demonstrates an end-to-end dental X-ray workflow with an adapter-based mock model until trained weights are ready.

> **Important:** Mock detections and findings are synthetic UI/demo output. This project is not a medical device and is not suitable for diagnosis. Every real result requires review by a qualified dental professional.

## Features

- FastAPI API with upload validation, SQLite scan history, image variants, annotated PNG and PDF report.
- Image enhancement pipeline: grayscale, CLAHE, denoising, normalization and model-size resize.
- FDI permanent-tooth helpers and geometry-based mesial/distal mapping. Orientation assumes a standard panoramic view where patient right appears on the image left.
- Identical detector and classifier interfaces for mock mode and future trained-model integration.
- Responsive React/TypeScript interface: upload, interactive annotated results, history, evaluation and methodology.
- Uploaded data is re-encoded to PNG before local persistence to remove embedded EXIF metadata; original filenames are not used in storage paths.

## Requirements

- Python 3.11 (recommended; backend dependencies are declared in `backend/requirements.txt`)
- Node.js 22.12+ (or 20.19+) and npm

## Run locally (mock mode)

Open two terminals from the project root.

### 1. Backend

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:MODEL_MODE = "mock"
uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`; interactive API documentation is at `http://127.0.0.1:8000/docs`.

Optional: copy `backend/.env.example` to `backend/.env` and adjust configuration. Environment variables take precedence.

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). Vite proxies `/api` requests to `http://127.0.0.1:8000`.

### Run tests and build

```powershell
cd backend
python -m pytest
```

```powershell
cd frontend
npm test
npm run build
```

## Screenshots

The interface includes the overview, upload, results, history, evaluation and about pages. Capture and place project screenshots in `docs/screenshots/` when preparing the college submission.

## API

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Model mode, load state and API version |
| `POST` | `/api/analyze` | Multipart X-ray upload and full analysis JSON |
| `GET` | `/api/scans` | Recent scan history |
| `GET` | `/api/scans/{scan_id}` | Full stored analysis |
| `GET` | `/api/scans/{scan_id}/image?variant=original\|annotated\|preprocessed\|before` | Image asset |
| `GET` | `/api/scans/{scan_id}/report.pdf` | Downloadable PDF |
| `DELETE` | `/api/scans/{scan_id}` | Delete scan record and its stored images |
| `GET` | `/api/metrics` | Clearly labelled sample evaluation metrics |

Supported uploads are PNG/JPEG up to `MAX_UPLOAD_MB`. DICOM is not enabled in this prototype. The backend re-encodes images and stores no submitted filename or patient-identifying metadata. Scan results and images are persisted locally under `backend/data/` by default; deleting a scan removes its assets.

## How to plug in the trained model

1. Keep the public model contract unchanged: implement `ToothDetector.predict(image) -> list[ToothDetection]` and `FindingClassifier.predict(image, tooth) -> list[Finding]`.
2. Place the trained YOLOv8-seg weights at the configured `MODEL_PATH` and install the compatible `ultralytics` version in the backend environment.
3. Add a `class_map.json` mapping model class IDs to FDI tooth identifiers and finding labels. Complete the marked TODOs in `backend/app/services/detector_yolo.py` for model loading, class mapping, confidence filtering (`CONF_THRESHOLD`), and mask-to-polygon conversion.
4. Implement the supported finding mapping in `backend/app/services/classifier_real.py`: `caries`, `deep_caries`, `periapical_lesion`, `impacted`, and `buccal_labial`. Keep the returned Pydantic `Finding` shape the same as the mock.
5. Set `MODEL_MODE=real` before starting the API. The frontend and endpoints use the same schema; no client/API changes are needed.
6. Validate on a held-out, clinically labelled dataset. Use `backend/scripts/evaluate.py <labelled_folder>` for FDI box labels stored beside each image in `.txt` files (`FDI x_center y_center width height`, normalized to `[0,1]`). Do not treat mock-mode scores as model performance.

The current surface mapper is geometry-based rather than model-based. Its orientation convention is appropriate for a standard panoramic display and may need a validated orientation transform for differently oriented input images.

## Project team

- Bharath Bhat — 4JK24EC010
- Mithun — 4JK24EC054
- Poojitha R Sanil — 4JK24EC070
- Guide: Dr. Jennifer Charlotte Saldanha
- Electronics & Communication Engineering, AJ Institute of Engineering and Technology
