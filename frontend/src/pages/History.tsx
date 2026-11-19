import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight, FileImage, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import { api } from "../api";
import { Loading } from "../components/Loading";
import type { ScanListItem } from "../types";

export function History() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["scans"], queryFn: api.scans });
  const [query, setQuery] = useState("");
  const remove = async (id: string) => {
    if (!window.confirm("Delete this scan and its locally stored images?")) return;
    try { await api.deleteScan(id); await queryClient.invalidateQueries({ queryKey: ["scans"] }); toast.success("Scan deleted"); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Unable to delete scan."); }
  };
  const scans = (data ?? []).filter((item) => item.scan_id.toLowerCase().includes(query.toLowerCase()) || item.xray_type.includes(query.toLowerCase()));
  return <div className="page history-page">
    <div className="page-heading"><div><div className="eyebrow muted-eyebrow">YOUR LOCAL PROJECT WORKSPACE</div><h1>Scan history</h1><p>Previously analyzed scans, saved for your review.</p></div><Link className="button primary" to="/analyze">+ New analysis</Link></div>
    <div className="history-toolbar"><div><strong>Recent scans</strong><span>{data?.length ?? 0} total</span></div><label className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search scan ID or type" /></label></div>
    {isLoading ? <Loading label="Loading scan history…" /> : error ? <div className="empty-state">Could not load history. Is the API running?</div> : scans.length ? <div className="history-grid">{scans.map((scan) => <HistoryCard key={scan.scan_id} scan={scan} onDelete={remove} />)}</div> : <div className="empty-state"><FileImage size={26} /><h2>{data?.length ? "No matching scans" : "Your scan history is empty"}</h2><p>Upload an X-ray to create your first analysis.</p>{!data?.length && <Link className="button primary" to="/analyze">Start an analysis</Link>}</div>}
  </div>;
}

function HistoryCard({ scan, onDelete }: { scan: ScanListItem; onDelete: (id: string) => void }) {
  return <article className="history-card glass-card">
    <Link to={`/results/${scan.scan_id}`} className="history-thumb"><img src={api.image(scan.scan_id, "original")} alt="" loading="lazy" /><span className="thumb-type">{scan.xray_type}</span></Link>
    <div className="history-card-body"><div className="history-card-title"><strong>{scan.scan_id.slice(0, 8).toUpperCase()}</strong><button className="icon-button delete-button" aria-label={`Delete scan ${scan.scan_id.slice(0, 8)}`} onClick={() => onDelete(scan.scan_id)}><Trash2 size={15} /></button></div><span className="history-date"><CalendarDays size={13} />{new Date(scan.created_at).toLocaleString()}</span><div className="history-stats"><span>{scan.teeth_detected} teeth</span><span className={scan.teeth_with_findings ? "stat-flagged" : ""}>{scan.teeth_with_findings} flagged</span><ChevronRight size={14} /></div></div>
  </article>;
}
