export type FindingType = "caries" | "deep_caries" | "periapical_lesion" | "impacted" | "buccal_labial";
export type XrayType = "panoramic" | "bitewing" | "periapical";

export interface Finding {
  type: FindingType;
  surface: "mesial" | "distal" | "periapical" | "none";
  confidence: number;
  region_polygon?: number[][] | null;
  bbox?: number[] | null;
}

export interface Tooth {
  id: string;
  fdi: number;
  quadrant: number;
  tooth_name: string;
  confidence: number;
  bbox: number[];
  polygon: number[][];
  surfaces: {
    mesial_side: "left" | "right";
    distal_side: "left" | "right";
    mesial_point: number[];
    distal_point: number[];
  };
  findings: Finding[];
}

export interface ScanResult {
  scan_id: string;
  created_at: string;
  xray_type: XrayType;
  image: { width: number; height: number };
  preprocessing: { steps: string[]; before_url: string; after_url: string };
  teeth: Tooth[];
  summary: { teeth_detected: number; teeth_with_findings: number; counts_by_finding: Record<string, number> };
  disclaimer: string;
}

export interface ScanListItem {
  scan_id: string;
  created_at: string;
  xray_type: XrayType;
  width: number;
  height: number;
  teeth_detected: number;
  teeth_with_findings: number;
}

export interface Health {
  status: string;
  model_mode: "mock" | "real";
  model_loaded: boolean;
  version: string;
}

export interface EvaluationMetrics {
  status: "sample" | "measured";
  label: string;
  metrics: Record<"iou" | "dice" | "map" | "precision" | "recall", number>;
  evaluation_set: string;
}
