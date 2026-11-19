from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

FindingType = Literal["caries", "deep_caries", "periapical_lesion", "impacted", "buccal_labial"]


class Finding(BaseModel):
    type: FindingType
    surface: Literal["mesial", "distal", "periapical", "none"]
    confidence: float = Field(ge=0, le=1)
    region_polygon: list[list[float]] | None = None
    bbox: list[float] | None = None


class SurfaceInfo(BaseModel):
    mesial_side: Literal["left", "right"]
    distal_side: Literal["left", "right"]
    mesial_point: list[float]
    distal_point: list[float]


class ToothResult(BaseModel):
    id: str
    fdi: int
    quadrant: int
    tooth_name: str
    confidence: float = Field(ge=0, le=1)
    bbox: list[float]
    polygon: list[list[float]]
    surfaces: SurfaceInfo
    findings: list[Finding]


class ImageInfo(BaseModel):
    width: int
    height: int


class PreprocessingInfo(BaseModel):
    steps: list[str]
    before_url: str
    after_url: str


class Summary(BaseModel):
    teeth_detected: int
    teeth_with_findings: int
    counts_by_finding: dict[str, int]


class ScanResult(BaseModel):
    scan_id: str
    created_at: datetime
    xray_type: Literal["panoramic", "bitewing", "periapical"]
    image: ImageInfo
    preprocessing: PreprocessingInfo
    teeth: list[ToothResult]
    summary: Summary
    disclaimer: str = "Preliminary diagnostic aid, not a replacement for clinical review."


class ScanListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    scan_id: str
    created_at: datetime
    xray_type: str
    width: int
    height: int
    teeth_detected: int
    teeth_with_findings: int


class HealthResponse(BaseModel):
    status: str
    model_mode: str
    model_loaded: bool
    version: str
