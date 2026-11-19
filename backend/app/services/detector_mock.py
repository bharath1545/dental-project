import math
import random

import numpy as np

from app.services.detector_base import ToothDetection, ToothDetector


class MockToothDetector(ToothDetector):
    """Creates a reproducible illustrative dentition; never use for diagnosis."""

    def predict(self, image: np.ndarray) -> list[ToothDetection]:
        height, width = image.shape[:2]
        rng = random.Random(width * 1009 + height)
        teeth = []
        # A compact 28-tooth panoramic arrangement keeps labels readable in a demo.
        for quadrant in range(1, 5):
            for position in range(1, 8):
                fdi = quadrant * 10 + position
                side = -1 if quadrant in {1, 4} else 1
                upper = quadrant in {1, 2}
                offset = (position - 0.5) * width * 0.035
                center_x = width / 2 + side * offset
                arch_y = height * (0.43 if upper else 0.61)
                curve = (offset / max(width * 0.38, 1)) ** 2 * height * 0.10
                center_y = arch_y - curve if upper else arch_y + curve
                box_w = max(13, width * (0.027 if position >= 4 else 0.022))
                box_h = max(18, height * (0.075 if position >= 4 else 0.09))
                jitter_x, jitter_y = rng.uniform(-0.006, 0.006) * width, rng.uniform(-0.012, 0.012) * height
                x = min(max(center_x - box_w / 2 + jitter_x, 0), width - box_w)
                y = min(max(center_y - box_h / 2 + jitter_y, 0), height - box_h)
                points = []
                for index in range(8):
                    angle = 2 * math.pi * index / 8
                    px = x + box_w / 2 + math.cos(angle) * box_w * 0.48
                    py = y + box_h / 2 + math.sin(angle) * box_h * 0.48
                    points.append((round(px, 2), round(py, 2)))
                teeth.append(
                    ToothDetection(
                        fdi=fdi,
                        confidence=round(rng.uniform(0.78, 0.97), 3),
                        bbox=(round(x, 2), round(y, 2), round(box_w, 2), round(box_h, 2)),
                        polygon=points,
                    )
                )
        return teeth
