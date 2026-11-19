import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BarChart3, CircleHelp, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Loading } from "../components/Loading";

const descriptions: Record<string, string> = {
  iou: "Intersection over Union · overlap between predicted and labelled regions.",
  dice: "Dice coefficient · spatial agreement between predicted and labelled masks.",
  map: "Mean Average Precision · detection precision averaged over thresholds.",
  precision: "Precision · share of predicted findings that match reference labels.",
  recall: "Recall · share of reference findings recovered by the model.",
};

export function Evaluation() {
  const { data, isLoading, error } = useQuery({ queryKey: ["metrics"], queryFn: api.metrics });
  return <div className="page evaluation-page">
    <div className="page-heading"><div><div className="eyebrow muted-eyebrow">MODEL VALIDATION · TRANSPARENT BY DEFAULT</div><h1>Evaluation</h1><p>Metrics are meaningful only when evaluated against a labelled reference set.</p></div><span className="sample-badge"><Info size={14} /> Sample data</span></div>
    {isLoading ? <Loading label="Loading evaluation metrics…" /> : error || !data ? <div className="empty-state">Evaluation metrics are currently unavailable.</div> : <>
      <div className="metric-banner"><div className="metric-banner-icon"><BarChart3 size={21} /></div><div><strong>{data.status === "sample" ? "Illustrative sample values" : "Validation results"}</strong><p>{data.label}</p><small>Evaluation set: {data.evaluation_set}</small></div></div>
      <div className="metric-grid">{Object.entries(data.metrics).map(([name, value], index) => <article className="metric-card glass-card" key={name}><div className="metric-card-top"><span className="metric-index">0{index + 1}</span><span className="metric-unit">0 — 1</span></div><strong className="metric-value">{value.toFixed(2)}</strong><h2>{name === "map" ? "mAP" : name.toUpperCase()}</h2><p>{descriptions[name]}</p><div className="metric-meter"><i style={{ width: `${value * 100}%` }} /></div></article>)}</div>
      <div className="evaluation-note"><CircleHelp size={17} /><div><strong>Why are these marked as samples?</strong><p>The model is not trained yet. Values are for demonstrating the evaluation interface only and must not be interpreted as measured performance. Use the offline evaluator with a labelled dataset to replace them.</p></div><Link to="/about">Methodology <ArrowRight size={14} /></Link></div>
    </>}
  </div>;
}
