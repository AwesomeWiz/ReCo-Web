import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "./Sidebar";

export default function ProtectedRoute({ children }) {
  const { manufacturer } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (!manufacturer) return <Navigate to="/login" replace />;

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <div className="app-shell">
      <div className="mobile-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="sidebar-logo-mark" style={{ width: 28, height: 28, borderRadius: 6, fontSize: 14 }}>R</div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.5px" }}>Reco</span>
        </div>
        <button className="hamburger" onClick={toggleSidebar} aria-label="Toggle Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">{children}</main>
    </div>
  );
}