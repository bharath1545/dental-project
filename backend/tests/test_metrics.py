from app.services.metrics import dice, iou, mean_average_precision, precision, recall


def test_overlap_metrics_and_empty_regions():
    assert iou({1, 2, 3}, {2, 3, 4}) == 0.5
    assert dice({1, 2, 3}, {2, 3, 4}) == 2 / 3
    assert iou(set(), set()) == 1
    assert dice(set(), set()) == 1


def test_detection_metrics_handle_zero_denominators():
    assert precision(2, 1) == 2 / 3
    assert recall(2, 2) == 0.5
    assert precision(0, 0) == 0
    assert recall(0, 0) == 0
    assert mean_average_precision([0.6, 0.8]) == 0.7
    assert mean_average_precision([]) == 0
