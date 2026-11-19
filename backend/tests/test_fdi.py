import pytest

from app.utils.fdi import is_valid_fdi, quadrant, quadrant_name, tooth_name, tooth_position


@pytest.mark.parametrize("fdi", [11, 18, 21, 28, 31, 38, 41, 48])
def test_fdi_helpers_for_valid_teeth(fdi):
    assert is_valid_fdi(fdi)
    assert quadrant(fdi) == fdi // 10
    assert tooth_position(fdi) == fdi % 10
    assert tooth_name(fdi)
    assert quadrant_name(fdi)


@pytest.mark.parametrize("fdi", [10, 19, 20, 29, 30, 39, 40, 49, 118])
def test_rejects_invalid_fdi(fdi):
    assert not is_valid_fdi(fdi)
    with pytest.raises(ValueError):
        quadrant(fdi)


def test_position_names_are_standard():
    assert tooth_name(11) == "Central incisor"
    assert tooth_name(46) == "First molar"
