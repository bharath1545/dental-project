def iou(predicted: set, actual: set) -> float:
    union = predicted | actual
    return len(predicted & actual) / len(union) if union else 1.0


def dice(predicted: set, actual: set) -> float:
    total = len(predicted) + len(actual)
    return 2 * len(predicted & actual) / total if total else 1.0


def precision(true_positive: int, false_positive: int) -> float:
    total = true_positive + false_positive
    return true_positive / total if total else 0.0


def recall(true_positive: int, false_negative: int) -> float:
    total = true_positive + false_negative
    return true_positive / total if total else 0.0


def mean_average_precision(average_precisions: list[float]) -> float:
    return sum(average_precisions) / len(average_precisions) if average_precisions else 0.0
