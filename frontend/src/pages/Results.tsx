import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, Clipboard, Download, Eye, EyeOff, FileDown, Filter, Layers, ScanLine, Sparkles, TriangleAlert } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../api";
import { Disclaimer } from "../components/Disclaimer";
import { Loading } from "../components/Loading";
import { ScanVisual } from "../components/ScanVisual";
import type { FindingType, Tooth } from "../types";

const filters: Array<{ value: FindingType | "all"; label: string }> = [
  { value: "all", label: "All findings" }, { value: "caries", label: "Caries" }, { value: "deep_caries", label: "Deep caries" },
  { value: "periapical_lesion", label: "Periapical" }, { value: "impacted", label: "Impacted" }, { value: "buccal_labial", label: "Buccal / labial" },
];
const humanize = (value: string) => value.replace(/_/g, " ");

export function Results() {
  const { id = "" } = useParams();
  const { data: result, isLoading, error } = useQuery({ queryKey: ["scan", id], queryFn: () => api.scan(id), enabled: !!id });
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState<FindingType | "all">("all");
  const [threshold, setThreshold] = useState(0.35);
  const [segmentation, setSegmentation] = useState(true);
  const [labels, setLabels] = useState(true);
  const [surfaces, setSurfaces] = useState(true);
  const [findings, setFindings] = useState(true);
  const [comparison, setComparison] = useState(100);
  const [showCompare, setShowCompare] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const selected = result?.teeth.find((tooth) => tooth.id === selectedId) ?? null;
  const visibleTeeth = useMemo(() => result?.teeth.filter((tooth) => tooth.confidence >= threshold && (filter === "all" || tooth.findings.some((item) => item.type === filter && item.confidence >= threshold))) ?? [], [result, filter, threshold]);
  if (isLoading) return <div className="page"><Loading label="Loading analysis…" /></div>;
  if (error || !result) return <div className="page"><div className="empty-state"><TriangleAlert size={25} /><h2>Could not load this analysis</h2><p>{error instanceof Error ? error.message : "Scan does not exist."}</p><Link className="button secondary" to="/history"><ArrowLeft size={15} /> Back to history</Link></div></div>;
  const copyResult = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(result, null, 2)); toast.success("Result JSON copied"); }
    catch { toast.error("Clipboard permission is unavailable."); }
  };
  const toggle = (setter: (value: boolean) => void, value: boolean) => setter(!value);
  return <div className="page result-page">
    <div className="result-heading"><div><Link className="back-link" to="/history"><ArrowLeft size={14} /> Scan history</Link><h1>Analysis <span className="scan-id">#{id.slice(0, 8)}</span></h1><p>{new Date(result.created_at).toLocaleString()} <span>·</span> {result.xray_type} X-ray <span>·</span> Original image coordinates</p></div><div className="result-actions"><button className="button secondary compact" onClick={copyResult}><Clipboard size={15} /> Copy JSON</button><a className="button secondary compact" href={api.image(id, "annotated")} download={`dental-surface-${id}.png`}><Download size={15} /> Annotated PNG</a><a className="button primary compact" href={api.report(id)}><FileDown size={15} /> PDF report</a></div></div>
    <div className="summary-row">
      <div className="summary-card"><span className="summary-icon teal"><ScanLine size={17} /></span><div><small>TEETH DETECTED</small><strong>{result.summary.teeth_detected}</strong></div><span className="summary-caption">across 4 quadrants</span></div>
      <div className="summary-card"><span className="summary-icon amber"><TriangleAlert size={17} /></span><div><small>FLAGGED FOR REVIEW</small><strong>{result.summary.teeth_with_findings}</strong></div><span className="summary-caption">teeth with findings</span></div>
      {filters.slice(1, 4).map(({ value, label }) => <div className="summary-card finding-summary" key={value}><span className="summary-dot" /><div><small>{label.toUpperCase()}</small><strong>{result.summary.counts_by_finding[value] ?? 0}</strong></div></div>)}
    </div>
    <div className="viewer-layout">
      <section className="viewer-main">
        <div className="viewer-controls">
          <div className="toggle-group">
            {[["Segmentation", segmentation, setSegmentation, Layers], ["FDI labels", labels, setLabels, ScanLine], ["Surfaces", surfaces, setSurfaces, Eye], ["Findings", findings, setFindings, TriangleAlert]].map(([label, value, setter, Icon]) => {
              const ToggleIcon = Icon as typeof Eye;
              return <button key={label as string} className={`view-toggle ${value ? "on" : ""}`} onClick={() => toggle(setter as (value: boolean) => void, value as boolean)}><ToggleIcon size={13} />{label as string}</button>;
            })}
          </div>
          <button className={`view-toggle ${showCompare ? "on" : ""}`} onClick={() => setShowCompare(!showCompare)}><EyeOff size={13} /> Compare preprocess</button>
        </div>
        <ScanVisual result={result} selected={selected} onSelect={(tooth) => setSelectedId(tooth.id)} segmentation={segmentation} labels={labels} surfaces={surfaces} findings={findings} threshold={threshold} comparison={showCompare ? comparison : 100} />
        {showCompare && <div className="compare-slider"><span>Original</span><input aria-label="Preprocessing comparison" type="range" min="0" max="100" value={comparison} onChange={(event) => setComparison(Number(event.target.value))} /><span>Enhanced {comparison}%</span></div>}
        <div className="preprocess-info"><span><Sparkles size={14} /> PREPROCESSING</span><div>{result.preprocessing.steps.map((step, index) => <span key={step}>{index + 1}. {step.replace(" conversion", "")}</span>)}</div></div>
        <Disclaimer text={result.disclaimer} />
      </section>
      <aside className="tooth-panel glass-card">
        <div className="panel-title"><div><h2>Tooth review</h2><p>{visibleTeeth.length} of {result.teeth.length} teeth visible</p></div><span className="panel-fdi">FDI</span></div>
        <label className="filter-select"><Filter size={14} /><select value={filter} onChange={(event) => setFilter(event.target.value as FindingType | "all")}>{filters.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><ChevronDown size={14} /></label>
        <div className="threshold-control"><div><span>Confidence threshold</span><strong>{Math.round(threshold * 100)}%</strong></div><input aria-label="Confidence threshold" type="range" min="0" max="0.9" step="0.05" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} /></div>
        {selected && <div className="selected-detail">
          <div className="detail-head"><div className="tooth-number">{selected.fdi}</div><div><strong>{selected.tooth_name}</strong><small>Quadrant {selected.quadrant} · {Math.round(selected.confidence * 100)}% confidence</small></div><button className="icon-button" aria-label="Clear selected tooth" onClick={() => setSelectedId("")}>×</button></div>
          <div className="answer-list"><div><span>IDENTITY</span><strong>FDI {selected.fdi}</strong></div><div><span>SURFACE</span><strong>Mesial: {selected.surfaces.mesial_side} <i /> Distal: {selected.surfaces.distal_side}</strong></div><div><span>FINDING</span><strong>{selected.findings.length ? selected.findings.map((item) => `${humanize(item.type)} · ${item.surface}`).join(", ") : "No flagged finding"}</strong></div><div><span>REVIEW</span><strong className={selected.findings.length ? "review-flag" : ""}>{selected.findings.length ? "Clinician review suggested" : "Review image in context"}</strong></div></div>
        </div>}
        <div className="tooth-list" role="list" aria-label="Detected teeth">
          {visibleTeeth.map((tooth) => <ToothRow key={tooth.id} tooth={tooth} active={selectedId === tooth.id} expanded={expanded === tooth.id} onClick={() => { setSelectedId(tooth.id); setExpanded(expanded === tooth.id ? null : tooth.id); }} />)}
          {!visibleTeeth.length && <div className="no-teeth">No teeth match these filters.</div>}
        </div>
        <div className="panel-foot"><span><i className="confidence-dot" /> Confidence ≥ {Math.round(threshold * 100)}%</span><button className="text-link" onClick={() => { setFilter("all"); setThreshold(0.35); }}>Reset</button></div>
      </aside>
    </div>
  </div>;
}

function ToothRow({ tooth, active, expanded, onClick }: { tooth: Tooth; active: boolean; expanded: boolean; onClick: () => void }) {
  return <button className={`tooth-row ${active ? "active" : ""}`} onClick={onClick} role="listitem">
    <span className="row-tooth">{tooth.fdi}</span><span className="row-main"><strong>{tooth.tooth_name}</strong><small>{tooth.findings.length ? tooth.findings.map((finding) => humanize(finding.type)).join(" · ") : "No flagged finding"}</small>{expanded && <small className="expanded-finding">Mesial {tooth.surfaces.mesial_side} · Distal {tooth.surfaces.distal_side}</small>}</span><span className={`row-confidence ${tooth.findings.length ? "flagged" : ""}`}>{Math.round(tooth.confidence * 100)}%</span>
  </button>;
}
