import cv2
import numpy as np
import pytest

from app.services.preprocess import preprocess_image


def test_preprocess_returns_gray_pipeline_previews_and_resizes_large_images():
    image = np.zeros((80, 120, 3), dtype=np.uint8)
    image[:, 60:] = 180
    result = preprocess_image(image, max_dimension=60)
    assert result.image.shape == (40, 60, 3)
    assert result.before_preview.shape == (80, 120, 3)
    assert result.after_preview.shape == result.image.shape
    assert len(result.steps) == 5


def test_preprocess_accepts_grayscale_and_rejects_empty_image():
    result = preprocess_image(np.full((32, 32), 90, dtype=np.uint8))
    assert result.image.shape == (32, 32, 3)
    with pytest.raises(ValueError):
        preprocess_image(np.array([], dtype=np.uint8))
