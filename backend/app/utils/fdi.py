"""Helpers for the ISO 3950 two-digit permanent-tooth notation."""

TOOTH_NAMES = {
    1: "Central incisor",
    2: "Lateral incisor",
    3: "Canine",
    4: "First premolar",
    5: "Second premolar",
    6: "First molar",
    7: "Second molar",
    8: "Third molar",
}


def is_valid_fdi(fdi: int) -> bool:
    return fdi // 10 in {1, 2, 3, 4} and fdi % 10 in TOOTH_NAMES


def quadrant(fdi: int) -> int:
    if not is_valid_fdi(fdi):
        raise ValueError(f"Invalid permanent-tooth FDI number: {fdi}")
    return fdi // 10


def tooth_position(fdi: int) -> int:
    if not is_valid_fdi(fdi):
        raise ValueError(f"Invalid permanent-tooth FDI number: {fdi}")
    return fdi % 10


def tooth_name(fdi: int) -> str:
    return TOOTH_NAMES[tooth_position(fdi)]


def quadrant_name(fdi: int) -> str:
    names = {1: "Upper right", 2: "Upper left", 3: "Lower left", 4: "Lower right"}
    return names[quadrant(fdi)]
