from dataclasses import dataclass

import cv2
import numpy as np


@dataclass
class PreprocessResult:
    image: np.ndarray
    steps: list[str]
    before_preview: np.ndarray
    after_preview: np.ndarray


def preprocess_image(image: np.ndarray, max_dimension: int = 1600) -> PreprocessResult:
    if image is None or image.size == 0:
        raise ValueError("The uploaded image could not be decoded.")
    if image.ndim == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    elif image.ndim == 2:
        gray = image.copy()
    else:
        raise ValueError("Expected a grayscale or color image.")

    before = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    enhanced = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
    denoised = cv2.fastNlMeansDenoising(enhanced, None, h=6, templateWindowSize=7, searchWindowSize=21)
    normalized = cv2.normalize(denoised, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)
    height, width = normalized.shape
    scale = min(1.0, max_dimension / max(height, width))
    if scale < 1:
        normalized = cv2.resize(
            normalized, (max(1, round(width * scale)), max(1, round(height * scale))), interpolation=cv2.INTER_AREA
        )
    after = cv2.cvtColor(normalized, cv2.COLOR_GRAY2BGR)
    return PreprocessResult(
        image=after,
        before_preview=before,
        after_preview=after,
        steps=["Grayscale conversion", "CLAHE contrast enhancement", "Non-local means denoising", "Intensity normalization", "Resize to model limits"],
    )
