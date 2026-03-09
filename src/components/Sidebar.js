import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const IconGrid = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IconBox = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IconChart = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export default function Sidebar() {
  const { manufacturer, logout } = useAuth();
  const navigate = useNavigate();

  const initials = manufacturer?.company_name
    ? manufacturer.company_name.slice(0, 2).toUpperCase()
    : "MF";

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">R</div>
        <div>
          <div className="sidebar-logo-text">Reco</div>
          <div className="sidebar-logo-sub">Manufacturer Portal</div>
        </div>
      </div>

      <span className="nav-section-label">Overview</span>
      <NavLink to="/dashboard" className={({isActive}) => `nav-item${isActive ? " active" : ""}`}>
        <IconGrid /> Dashboard
      </NavLink>

      <span className="nav-section-label">Manage</span>
      <NavLink to="/products" className={({isActive}) => `nav-item${isActive ? " active" : ""}`}>
        <IconBox /> My Products
      </NavLink>

      <span className="nav-section-label">Insights</span>
      <NavLink to="/analytics" className={({isActive}) => `nav-item${isActive ? " active" : ""}`}>
        <IconChart /> Analytics
      </NavLink>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div style={{flex:1, overflow:"hidden"}}>
            <div className="sidebar-name" style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {manufacturer?.company_name || "Manufacturer"}
            </div>
            <div className="sidebar-email" style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {manufacturer?.email || ""}
            </div>
          </div>
        </div>
        <button className="nav-item" onClick={handleLogout} style={{color:"var(--danger)"}}>
          <IconLogout /> Sign out
        </button>
      </div>
    </aside>
  );
}