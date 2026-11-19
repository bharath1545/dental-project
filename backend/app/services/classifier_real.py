import numpy as np

from app.schemas import Finding
from app.services.classifier_base import FindingClassifier
from app.services.detector_base import ToothDetection


class RealFindingClassifier(FindingClassifier):
    def predict(self, image: np.ndarray, tooth: ToothDetection) -> list[Finding]:
        # TODO: load the trained finding classifier and map its classes to the
        # supported finding types using the same output contract as the mock.
        raise NotImplementedError("Real finding classifier is pending trained model integration.")
