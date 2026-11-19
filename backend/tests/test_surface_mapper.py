import pytest

from app.services.detector_base import ToothDetection
from app.services.surface_mapper import infer_arch_midline, map_surfaces


@pytest.mark.parametrize(
    ("fdi", "x", "mesial"),
    [(16, 20, "right"), (26, 80, "left"), (46, 20, "right"), (36, 80, "left")],
)
def test_mesial_points_toward_midline_in_standard_panoramic_view(fdi, x, mesial):
    tooth = ToothDetection(fdi=fdi, confidence=0.9, bbox=(x, 20, 10, 20), polygon=[])
    result = map_surfaces(tooth, midline_x=50)
    assert result["mesial_side"] == mesial
    assert result["distal_side"] == ("left" if mesial == "right" else "right")


def test_central_incisors_define_midline_and_even_pair_is_averaged():
    teeth = [
        ToothDetection(11, 0.9, (40, 0, 4, 4), []),
        ToothDetection(21, 0.9, (56, 0, 4, 4), []),
        ToothDetection(12, 0.9, (2, 0, 4, 4), []),
    ]
    assert infer_arch_midline(teeth, image_width=100) == 50


def test_midline_falls_back_to_image_center():
    tooth = ToothDetection(16, 0.9, (10, 10, 6, 8), [])
    assert infer_arch_midline([tooth], image_width=120) == 60


def test_exact_midline_uses_quadrant_orientation():
    left = ToothDetection(16, 0.9, (45, 10, 10, 8), [])
    right = ToothDetection(26, 0.9, (45, 10, 10, 8), [])
    assert map_surfaces(left, 50)["mesial_side"] == "right"
    assert map_surfaces(right, 50)["mesial_side"] == "left"
