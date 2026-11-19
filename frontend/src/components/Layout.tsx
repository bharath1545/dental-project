import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Activity, ActivitySquare, Archive, ChevronRight, CircleHelp, Home, Menu, Plus, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../api";
import { ErrorBoundary } from "./ErrorBoundary";

const links = [
  { to: "/", label: "Overview", icon: Home, end: true },
  { to: "/analyze", label: "New analysis", icon: Plus },
  { to: "/history", label: "Scan history", icon: Archive },
  { to: "/evaluation", label: "Evaluation", icon: ActivitySquare },
  { to: "/about", label: "About project", icon: CircleHelp },
];

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const health = useQuery({ queryKey: ["health"], queryFn: api.health, retry: false });
  const location = useLocation();
  const title = links.find((link) => link.to === location.pathname)?.label ?? "Analysis result";
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <NavLink to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark"><ScanLine size={21} /></span><span>Dental<span className="brand-light">Surface</span><small>AI RESEARCH STUDIO</small></span>
        </NavLink>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{label === "New analysis" && <span className="nav-shortcut"><Plus size={12} /></span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-card"><ShieldCheck size={18} /><div><strong>Privacy first</strong><span>Images stored locally</span></div></div>
          <div className="profile"><div className="profile-avatar">AJ</div><div><strong>AJ Institute</strong><span>ECE · Capstone project</span></div><ChevronRight size={15} /></div>
        </div>
      </aside>
      {menuOpen && <button className="mobile-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Menu size={19} /></button>
          <div className="breadcrumb"><span>DentalSurface AI</span><ChevronRight size={13} /><strong>{title}</strong></div>
          <div className="topbar-right">
            {health.data?.model_mode === "mock" && <span className="mock-badge"><span /> MOCK MODE</span>}
            <span className={`connection ${health.isError ? "offline" : ""}`}><Activity size={14} />{health.isError ? "API offline" : "System ready"}</span>
            <div className="top-avatar">BB</div>
          </div>
        </header>
        <ErrorBoundary><Outlet /></ErrorBoundary>
      </main>
      <div className="mobile-brand"><Sparkles size={15} /> DentalSurface AI</div>
    </div>
  );
}
