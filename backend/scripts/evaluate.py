"""Evaluate bounding boxes from labelled text files in a folder.

Each image must have a sibling .txt file containing one row per tooth:
FDI x_center y_center width height (all box values normalized to [0, 1]).
"""

import argparse
from pathlib import Path

import cv2

from app.config import get_settings
from app.services.detector_mock import MockToothDetector
from app.services.detector_yolo import YoloToothDetector
from app.services.metrics import dice, iou, mean_average_precision, precision, recall


def _read_labels(path: Path, image_width: int, image_height: int) -> dict[int, tuple[int, int, int, int]]:
    labels = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        fields = line.split()
        if not fields:
            continue
        if len(fields) != 5:
            raise ValueError(f"{path}: each label row must contain FDI and four normalized box values.")
        fdi = int(fields[0])
        cx, cy, width, height = (float(value) for value in fields[1:])
        if fdi not in range(11, 49) or fdi // 10 not in {1, 2, 3, 4} or fdi % 10 not in range(1, 9):
            raise ValueError(f"{path}: invalid permanent-tooth FDI number {fdi}.")
        labels[fdi] = (
            round((cx - width / 2) * image_width),
            round((cy - height / 2) * image_height),
            round(width * image_width),
            round(height * image_height),
        )
    return labels


def _box_iou(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> float:
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    intersection = max(0, min(ax + aw, bx + bw) - max(ax, bx)) * max(0, min(ay + ah, by + bh) - max(ay, by))
    union = aw * ah + bw * bh - intersection
    return intersection / union if union else 0


def evaluate(folder: Path) -> dict[str, float]:
    image_paths = sorted(path for path in folder.iterdir() if path.suffix.lower() in {".png", ".jpg", ".jpeg"})
    if not image_paths:
        raise ValueError(f"No PNG or JPEG images found in {folder}.")
    detector = MockToothDetector() if get_settings().model_mode == "mock" else YoloToothDetector()
    tp = fp = fn = 0
    overlaps = []
    average_precisions = []
    for image_path in image_paths:
        label_path = image_path.with_suffix(".txt")
        if not label_path.is_file():
            raise ValueError(f"Missing sibling label file: {label_path}")
        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"Could not decode image: {image_path}")
        height, width = image.shape[:2]
        actual = _read_labels(label_path, width, height)
        predicted = {detection.fdi: tuple(round(value) for value in detection.bbox) for detection in detector.predict(image)}
        matches = [(_box_iou(predicted[fdi], box), fdi) for fdi, box in actual.items() if fdi in predicted]
        image_tp = sum(score >= 0.5 for score, _ in matches)
        image_fp = max(0, len(predicted) - image_tp)
        image_fn = max(0, len(actual) - image_tp)
        tp += image_tp
        fp += image_fp
        fn += image_fn
        overlaps.extend(score for score, _ in matches)
        average_precisions.append(sum(score >= 0.5 for score, _ in matches) / max(len(predicted), 1))

    return {
        "iou": sum(overlaps) / len(overlaps) if overlaps else 0.0,
        "dice": dice(set(range(tp)), set(range(tp + fp + fn))) if tp + fp + fn else 0.0,
        "map": mean_average_precision(average_precisions),
        "precision": precision(tp, fp),
        "recall": recall(tp, fn),
        "images": float(len(image_paths)),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("labelled_folder", type=Path)
    args = parser.parse_args()
    for name, value in evaluate(args.labelled_folder).items():
        print(f"{name}: {value:.4f}")
