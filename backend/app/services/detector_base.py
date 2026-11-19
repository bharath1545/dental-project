from abc import ABC, abstractmethod
from dataclasses import dataclass

import numpy as np


@dataclass
class ToothDetection:
    fdi: int
    confidence: float
    bbox: tuple[float, float, float, float]
    polygon: list[tuple[float, float]]

    @property
    def centroid(self) -> tuple[float, float]:
        x, y, width, height = self.bbox
        return x + width / 2, y + height / 2


class ToothDetector(ABC):
    @abstractmethod
    def predict(self, image: np.ndarray) -> list[ToothDetection]:
        raise NotImplementedError
