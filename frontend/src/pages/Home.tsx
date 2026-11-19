import { motion } from "framer-motion";
import { ArrowDownRight, ArrowRight, BadgeCheck, BrainCircuit, Eye, Layers3, ScanLine, Shield, Sparkles, Upload, WandSparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Disclaimer } from "../components/Disclaimer";

const stages = ["Input", "Pre-process", "Detect", "Map surfaces", "Classify", "Present"];
const answers = [
  { icon: BadgeCheck, title: "Identity", text: "FDI numbering maps every visible tooth to a standard, auditable identifier." },
  { icon: Layers3, title: "Surface", text: "A transparent arch-geometry rule identifies mesial and distal contact sides." },
  { icon: BrainCircuit, title: "Finding", text: "Potential findings are grouped by type, surface, and model confidence." },
  { icon: Eye, title: "Review", text: "Every result stays anchored to the original X-ray for clinical review." },
];

export function Home() {
  return <div className="page home-page">
    <motion.section className="hero glass-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <div className="hero-copy">
        <div className="eyebrow"><span className="pulse-dot" /> ECE CAPSTONE · AJ INSTITUTE OF ENGINEERING & TECHNOLOGY</div>
        <h1>Make every tooth<br />a little more <span>understandable.</span></h1>
        <p className="hero-description">An interpretable AI-assisted workflow for dental surface identification and abnormality review on dental X-rays.</p>
        <div className="hero-actions"><Link className="button primary" to="/analyze"><Upload size={16} /> Start an analysis <ArrowRight size={16} /></Link><Link className="text-link" to="/about">Explore the methodology <ArrowDownRight size={15} /></Link></div>
        <div className="hero-meta"><span><Shield size={14} /> Images stay on your machine</span><span><Sparkles size={14} /> Prototype · mock model</span></div>
      </div>
      <div className="hero-art" aria-label="Illustration of interpreted teeth">
        <div className="art-glow" /><div className="art-grid" />
        <div className="arch-line arch-top" /><div className="arch-line arch-bottom" />
        {[0, 1, 2, 3, 4, 5, 6].map((n) => <motion.div key={n} className={`tooth-orb orb-${n}`} animate={{ y: [0, -5, 0], opacity: [0.65, 1, 0.65] }} transition={{ duration: 2.4 + n * 0.17, repeat: Infinity, delay: n * 0.12 }}><span>{n === 2 ? "16" : n === 4 ? "26" : ""}</span></motion.div>)}
        <div className="art-chip chip-left"><ScanLine size={14} /> FDI 16 <b>0.94</b></div><div className="art-chip chip-right"><WandSparkles size={14} /> Surface map <b>Ready</b></div>
        <div className="art-caption">AI-ASSISTED · HUMAN-REVIEWED</div>
      </div>
    </motion.section>
    <section className="pipeline-section">
      <div className="section-heading"><div><div className="eyebrow muted-eyebrow">A CLEAR PATH FROM IMAGE TO INSIGHT</div><h2>Six steps. Every one inspectable.</h2></div><span className="section-count">01 — 06</span></div>
      <div className="pipeline-track">{stages.map((stage, index) => <motion.div className="pipeline-step" key={stage} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}><span className="step-num">0{index + 1}</span><div className="step-icon"><span>{["↑", "◐", "⌖", "⌁", "✳", "◎"][index]}</span></div><strong>{stage}</strong>{index < stages.length - 1 && <i className="step-connector" />}</motion.div>)}</div>
    </section>
    <section className="answers-section">
      <div className="section-heading"><div><div className="eyebrow muted-eyebrow">INTERPRETABLE BY DESIGN</div><h2>Four answers for every tooth.</h2></div><Link className="text-link" to="/about">How it works <ArrowRight size={15} /></Link></div>
      <div className="answer-grid">{answers.map(({ icon: Icon, title, text }, index) => <motion.article className="answer-card glass-card" key={title} whileHover={{ y: -3 }}><span className="answer-icon"><Icon size={18} /></span><span className="answer-index">0{index + 1}</span><h3>{title}</h3><p>{text}</p></motion.article>)}</div>
    </section>
    <section className="team-strip glass-card"><div className="team-icon"><BrainCircuit size={20} /></div><div><span className="eyebrow muted-eyebrow">BUILT AT AJ INSTITUTE OF ENGINEERING & TECHNOLOGY</span><p><strong>Bharath Bhat</strong> · 4JK24EC010 <span> / </span> <strong>Mithun</strong> · 4JK24EC054 <span> / </span> <strong>Poojitha R Sanil</strong> · 4JK24EC070</p><small>Department of Electronics & Communication Engineering · Guided by Dr. Jennifer Charlotte Saldanha</small></div><Link to="/about" className="round-arrow"><ArrowRight size={17} /></Link></section>
    <Disclaimer />
  </div>;
}
