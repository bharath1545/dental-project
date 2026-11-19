from pathlib import Path

import numpy as np

from app.config import get_settings
from app.services.detector_base import ToothDetection, ToothDetector


class YoloToothDetector(ToothDetector):
    """Integration point for the trained YOLOv8-seg model."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.model = None
        # TODO: load ultralytics.YOLO(MODEL_PATH) once weights are available.
        # TODO: map predicted class IDs to FDI using a class_map.json config file.

    def predict(self, image: np.ndarray) -> list[ToothDetection]:
        if not Path(self.settings.model_path).is_file():
            raise RuntimeError(f"Real detector weights were not found at {self.settings.model_path}")
        if self.model is None:
            try:
                from ultralytics import YOLO
            except ImportError as exc:
                raise RuntimeError("Install ultralytics to use MODEL_MODE=real.") from exc
            self.model = YOLO(self.settings.model_path)
        # TODO: apply CONF_THRESHOLD, run segmentation, map class IDs to FDI, and
        # convert instance masks to polygons while preserving this adapter contract.
        raise NotImplementedError("YOLO inference mapping is pending trained model integration.")
