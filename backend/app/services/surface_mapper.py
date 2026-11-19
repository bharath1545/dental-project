from app.services.detector_base import ToothDetection
from app.utils.fdi import quadrant


def infer_arch_midline(detections: list[ToothDetection], image_width: int) -> float:
    central = sorted(d.centroid[0] for d in detections if d.fdi % 10 == 1)
    if central:
        middle = len(central) // 2
        if len(central) % 2:
            return float(central[middle])
        return (central[middle - 1] + central[middle]) / 2
    return image_width / 2


def map_surfaces(detection: ToothDetection, midline_x: float) -> dict:
    # Orientation assumes a standard panoramic view where patient right appears on the image left.
    is_image_left = detection.centroid[0] < midline_x
    # FDI quadrants 1 and 4 lie on image-left; 2 and 3 lie on image-right.
    expected_image_left = quadrant(detection.fdi) in {1, 4}
    if detection.centroid[0] == midline_x:
        mesial_side = "left" if quadrant(detection.fdi) in {2, 3} else "right"
    else:
        mesial_side = "right" if is_image_left else "left"
    distal_side = "left" if mesial_side == "right" else "right"
    x, y, width, height = detection.bbox
    return {
        "mesial_side": mesial_side,
        "distal_side": distal_side,
        "mesial_point": [round(x + width if mesial_side == "right" else x, 2), round(y + height / 2, 2)],
        "distal_point": [round(x + width if distal_side == "right" else x, 2), round(y + height / 2, 2)],
        "quadrant_side_mismatch": is_image_left != expected_image_left,
    }
