import cv2
import numpy as np

from app.schemas import ScanResult

TEAL = (220, 190, 30)
AMBER = (20, 170, 255)


def annotate_image(image: np.ndarray, result: ScanResult) -> np.ndarray:
    canvas = image.copy()
    for tooth in result.teeth:
        points = np.array(tooth.polygon, dtype=np.int32)
        cv2.polylines(canvas, [points], True, TEAL, 2, cv2.LINE_AA)
        x, y, width, height = map(int, tooth.bbox)
        cv2.putText(canvas, str(tooth.fdi), (x, max(y - 6, 12)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, TEAL, 1, cv2.LINE_AA)
        for finding in tooth.findings:
            cx, cy = x + width // 2, y + height // 2
            cv2.circle(canvas, (cx, cy), max(5, min(width, height) // 5), AMBER, 2, cv2.LINE_AA)
    return canvas
