from abc import ABC, abstractmethod

import numpy as np

from app.schemas import Finding
from app.services.detector_base import ToothDetection


class FindingClassifier(ABC):
    @abstractmethod
    def predict(self, image: np.ndarray, tooth: ToothDetection) -> list[Finding]:
        raise NotImplementedError
