import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, FileImage, ImagePlus, ShieldCheck, Sparkles, UploadCloud, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api";
import type { XrayType } from "../types";
import { Disclaimer } from "../components/Disclaimer";

const stages = ["Upload image", "Pre-processing", "Tooth detection", "Surface mapping", "Finding review", "Build report"];

export function Analyze() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<XrayType>("panoramic");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(-1);
  const [preview, setPreview] = useState("");
  const navigate = useNavigate();

  const chooseFile = (selected?: File) => {
    if (!selected) return;
    if (!["image/png", "image/jpeg"].includes(selected.type)) { toast.error("Choose a PNG or JPEG image."); return; }
    if (selected.size > 12 * 1024 * 1024) { toast.error("Image must be 12 MB or smaller."); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };
  const start = async () => {
    if (!file) return;
    setLoading(true);
    setStage(0);
    const timer = window.setInterval(() => setStage((current) => Math.min(current + 1, stages.length - 1)), 1350);
    try {
      const result = await api.analyze(file, type);
      window.clearInterval(timer);
      setStage(stages.length);
      toast.success("Analysis complete");
      navigate(`/results/${result.scan_id}`);
    } catch (error) {
      window.clearInterval(timer);
      toast.error(error instanceof Error ? error.message : "Analysis failed.");
      setStage(-1);
    } finally { setLoading(false); }
  };
  return <div className="page analyze-page">
    <div className="page-heading"><div><div className="eyebrow muted-eyebrow">NEW ANALYSIS · PRIVATE WORKSPACE</div><h1>Upload a dental X-ray</h1><p>Start with a clear PNG or JPEG image. No patient details are collected.</p></div><div className="secure-tag"><ShieldCheck size={15} /> Local processing</div></div>
    <div className="upload-layout">
      <section className="upload-main">
        <div className={`dropzone ${dragging ? "drag-active" : ""} ${file ? "has-file" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); }} onClick={() => !file && inputRef.current?.click()} role="button" tabIndex={0} aria-label="Choose or drop a dental X-ray" onKeyDown={(event) => { if (!file && (event.key === "Enter" || event.key === " ")) inputRef.current?.click(); }}>
          <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" hidden onChange={(event) => chooseFile(event.target.files?.[0])} />
          {file ? <div className="upload-preview"><img src={preview} alt="Selected X-ray preview" /><div className="preview-overlay"><span><FileImage size={16} /> {file.name}</span><button className="icon-button" aria-label="Remove file" onClick={(event) => { event.stopPropagation(); URL.revokeObjectURL(preview); setFile(null); setPreview(""); }}><X size={16} /></button></div></div> : <div className="drop-content"><motion.div className="upload-icon" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2.2 }}><UploadCloud size={27} /></motion.div><h2>Drop your X-ray here</h2><p>or <button className="inline-link" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}>browse files</button> from your device</p><div className="file-specs"><span>PNG or JPEG</span><i /> <span>Up to 12 MB</span><i /> <span>Patient info not stored</span></div></div>}
        </div>
        <div className="form-row"><div className="form-label"><strong>Image type</strong><span>Choose the closest match</span></div><div className="type-options">{(["panoramic", "bitewing", "periapical"] as XrayType[]).map((option) => <button key={option} className={`type-option ${type === option ? "selected" : ""}`} onClick={() => setType(option)}><span className="type-glyph">{option === "panoramic" ? "⌒" : option === "bitewing" ? "◫" : "◡"}</span><span>{option[0].toUpperCase() + option.slice(1)}</span>{type === option && <Check size={14} />}</button>)}</div></div>
        {loading && <div className="pipeline-progress"><div className="progress-title"><span><Sparkles size={15} /> Analysis in progress</span><span>{Math.min(Math.round((stage + 1) / stages.length * 100), 99)}%</span></div><div className="progress-bar"><i style={{ width: `${Math.min((stage + 1) / stages.length * 100, 99)}%` }} /></div><div className="progress-steps">{stages.map((label, index) => <div key={label} className={index < stage ? "done" : index === stage ? "current" : ""}><span>{index < stage ? <Check size={11} /> : `0${index + 1}`}</span>{label}</div>)}</div></div>}
        <button className="button primary analyze-submit" disabled={!file || loading} onClick={start}>{loading ? "Analyzing X-ray…" : "Analyze image"}{loading ? <span className="spinner small" /> : <ArrowRight size={16} />}</button>
      </section>
      <aside className="upload-aside">
        <div className="aside-card glass-card"><div className="aside-heading"><span className="aside-icon"><ImagePlus size={18} /></span><div><strong>What happens next?</strong><small>Interpretable, step by step</small></div></div><div className="aside-steps">{stages.slice(1).map((item, index) => <div key={item}><span>{index + 1}</span>{item}</div>)}</div></div>
        <div className="privacy-note"><ShieldCheck size={17} /><div><strong>Your image stays private</strong><p>Images are kept on this project server for scan history. Remove a scan any time from History.</p></div></div>
        <div className="mock-note"><span className="mock-badge"><span /> MOCK MODEL</span><p>Until the trained model is integrated, tooth outlines and findings are illustrative demo output.</p></div>
      </aside>
    </div>
    <Disclaimer />
  </div>;
}
