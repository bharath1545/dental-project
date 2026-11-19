import { useState } from "react";
import type { ScanResult, Tooth } from "../types";
import { api } from "../api";

interface Props {
  result: ScanResult;
  selected: Tooth | null;
  onSelect: (tooth: Tooth) => void;
  segmentation: boolean;
  labels: boolean;
  surfaces: boolean;
  findings: boolean;
  threshold: number;
  comparison: number;
}

export function ScanVisual({ result, selected, onSelect, segmentation, labels, surfaces, findings, threshold, comparison }: Props) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const { width, height } = result.image;
  const visibleTeeth = result.teeth.filter((tooth) => tooth.confidence >= threshold);
  return (
    <div className="image-stage" onPointerMove={(event) => {
      if (drag) setOffset({ x: offset.x + event.clientX - drag.x, y: offset.y + event.clientY - drag.y });
      if (drag) setDrag({ x: event.clientX, y: event.clientY });
    }} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}>
      <div className="stage-toolbar"><span><span className="live-dot" /> ORIGINAL IMAGE</span><span>{width} × {height}</span></div>
      <div className="image-viewport" onPointerDown={(event) => { if (zoom > 1) setDrag({ x: event.clientX, y: event.clientY }); }}>
        <div className="image-transform" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}>
          <img className="scan-image" src={api.image(result.scan_id, "original")} alt="Original dental X-ray" draggable={false} />
          {comparison < 100 && <img className="scan-image compare-image" src={api.image(result.scan_id, "preprocessed")} alt="Preprocessed X-ray comparison" style={{ clipPath: `inset(0 ${100 - comparison}% 0 0)` }} />}
          <svg className="scan-overlay" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Interactive tooth segmentation and finding overlay">
            {visibleTeeth.map((tooth) => {
              const isSelected = selected?.id === tooth.id;
              const poly = tooth.polygon.map(([x, y]) => `${x},${y}`).join(" ");
              return <g key={tooth.id} className={`tooth-mark ${isSelected ? "selected" : ""}`} onClick={() => onSelect(tooth)} tabIndex={0} role="button" aria-label={`Select FDI ${tooth.fdi}`}>
                {segmentation && <polygon points={poly} />}
                {!segmentation && <rect x={tooth.bbox[0]} y={tooth.bbox[1]} width={tooth.bbox[2]} height={tooth.bbox[3]} />}
                {labels && <g className="tooth-label"><rect x={tooth.bbox[0]} y={tooth.bbox[1] - height * 0.035} width={width * 0.037} height={height * 0.025} rx={4} /><text x={tooth.bbox[0] + width * 0.0185} y={tooth.bbox[1] - height * 0.018}>{tooth.fdi}</text></g>}
                {surfaces && <g className="surface-labels"><text x={tooth.surfaces.mesial_point[0]} y={tooth.surfaces.mesial_point[1]}>{tooth.surfaces.mesial_side === "left" ? "M" : "M"}</text><text x={tooth.surfaces.distal_point[0]} y={tooth.surfaces.distal_point[1] + height * 0.02}>D</text></g>}
                {findings && tooth.findings.filter((finding) => finding.confidence >= threshold).map((finding, idx) => <g key={`${finding.type}-${idx}`} className="finding-mark">
                  {finding.region_polygon && <polygon points={finding.region_polygon.map(([x, y]) => `${x},${y}`).join(" ")} />}
                  {!finding.region_polygon && <circle cx={tooth.bbox[0] + tooth.bbox[2] / 2} cy={tooth.bbox[1] + tooth.bbox[3] / 2} r={Math.max(tooth.bbox[2] * 0.24, 5)} />}
                </g>)}
              </g>;
            })}
          </svg>
        </div>
      </div>
      <div className="stage-bottom">
        <div className="legend"><span><i className="legend-tooth" /> Segmentation</span><span><i className="legend-finding" /> Finding flag</span><span><i className="legend-label" /> FDI label</span></div>
        <div className="zoom-controls"><button className="icon-button" aria-label="Zoom out" onClick={() => setZoom(Math.max(1, zoom - 0.2))}>−</button><span>{Math.round(zoom * 100)}%</span><button className="icon-button" aria-label="Zoom in" onClick={() => setZoom(Math.min(3, zoom + 0.2))}>+</button><button className="icon-button fit-button" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>Fit</button></div>
      </div>
    </div>
  );
}
