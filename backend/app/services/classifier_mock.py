import random

import numpy as np

from app.schemas import Finding
from app.services.detector_base import ToothDetection
from app.services.classifier_base import FindingClassifier


class MockFindingClassifier(FindingClassifier):
    def predict(self, image: np.ndarray, tooth: ToothDetection) -> list[Finding]:
        rng = random.Random(tooth.fdi * 37 + image.shape[1])
        if rng.random() > 0.16:
            return []
        finding_type = rng.choice(["caries", "deep_caries", "periapical_lesion", "impacted", "buccal_labial"])
        surface = "periapical" if finding_type == "periapical_lesion" else (
            "none" if finding_type == "impacted" else rng.choice(["mesial", "distal"])
        )
        x, y, width, height = tooth.bbox
        region = [[x + width * 0.55, y + height * 0.42], [x + width * 0.9, y + height * 0.42],
                  [x + width * 0.9, y + height * 0.72], [x + width * 0.55, y + height * 0.72]]
        return [Finding(type=finding_type, surface=surface, confidence=round(rng.uniform(0.61, 0.91), 3), region_polygon=region)]
