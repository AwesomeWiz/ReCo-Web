import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../api/api";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:"white",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",fontSize:13}}>
      <div style={{color:"var(--muted)",marginBottom:4}}>{label}</div>
      <div style={{fontWeight:700,color:"var(--accent)"}}>{payload[0].value.toLocaleString()} units</div>
    </div>
  );
};

export default function DashboardPage() {
  const { manufacturer } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get("/manufacturer/dashboard-stats")
      .then(res => { setStats(res.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.error || "Failed to load dashboard"); setLoading(false); });
  }, []);

  const greeting = new Date().getHours() < 12 ? "morning"
    : new Date().getHours() < 18 ? "afternoon" : "evening";

  if (loading) return (
    <div className="centered" style={{minHeight:"60vh"}}>
      <div className="spinner"/>
      <span style={{color:"var(--muted)",fontSize:14}}>Loading dashboard…</span>
    </div>
  );

  if (error) return (
    <>
      <div className="page-header"><div className="page-title">Dashboard</div></div>
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <div className="empty-title">Could not load data</div>
          <div className="empty-sub">{error}</div>
        </div>
      </div>
    </>
  );

  const {
    total_products    = 0,
    total_units_sold  = 0,
    active_regions    = 0,
    avg_stockout_risk = "N/A",
    top_products      = [],
    region_split      = [],
    trend             = [],
  } = stats || {};

  const riskColor =
    avg_stockout_risk === "High"   ? "var(--danger)" :
    avg_stockout_risk === "Medium" ? "var(--warn)"   :
    avg_stockout_risk === "Low"    ? "var(--ok)"     : "var(--muted)";

  const maxRegionUnits = Math.max(...region_split.map(r => r.units || 0), 1);

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          Good {greeting},{" "}
          {manufacturer?.company_name?.split(" ")[0] || "there"} 👋
        </div>
        <div className="page-sub">Here's how your products are performing across the Reco network</div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid-4" style={{marginBottom:24}}>
        {[
          { label:"Listed products",   value: total_products,                    sub:"In the Reco catalog" },
          { label:"Units sold",        value: total_units_sold.toLocaleString(), sub:"Last 30 days" },
          { label:"Active regions",    value: active_regions,                    sub:"States with sales" },
          { label:"Avg stockout risk", value: avg_stockout_risk,                 sub:"Across network", riskColor },
        ].map((s, i) => (
          <div className="card card-sm" key={i}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={s.riskColor ? {fontSize:22, color:s.riskColor} : {}}>
              {s.value}
            </div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{marginBottom:24}}>
        {/* ── Sales Trend ── */}
        <div className="card">
          <div className="section-head">
            <div>
              <div className="section-title">Sales Trend</div>
              <div className="section-sub">Units sold across all stores · last 14 days</div>
            </div>
          </div>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trend} margin={{left:-20,right:0,top:4,bottom:0}}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="0" vertical={false}/>
                <XAxis dataKey="date" tick={{fontSize:10,fill:"var(--muted)"}} axisLine={false} tickLine={false} interval={2}/>
                <YAxis tick={{fontSize:10,fill:"var(--muted)"}} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Line type="monotone" dataKey="units" stroke="var(--accent)" strokeWidth={2.5} dot={false} activeDot={{r:4}}/>
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{padding:"40px 0"}}>
              <div className="empty-sub">No trend data in the last 14 days</div>
            </div>
          )}
        </div>

        {/* ── Regional Spread ── */}
        <div className="card">
          <div className="section-head">
            <div className="section-title">Regional Spread</div>
            <div className="section-sub">Units sold by state · last 30 days</div>
          </div>
          {region_split.length > 0 ? (
            region_split.slice(0, 6).map((r, i) => {
              const colors = ["var(--accent)","#6B8EF9","#9DB3FB","#C5D2FD","#D6E0FE","#E8EDFF"];
              return (
                <div className="region-row" key={i}>
                  <div className="region-name">{r.state}</div>
                  <div className="region-bar-wrap">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width:`${Math.round((r.units / maxRegionUnits) * 100)}%`,
                        background: colors[i] || "var(--accent)",
                      }}/>
                    </div>
                  </div>
                  <div className="region-count">{r.stores} store{r.stores !== 1 ? "s" : ""}</div>
                </div>
              );
            })
          ) : (
            <div className="empty-state" style={{padding:"40px 0"}}>
              <div className="empty-sub">No regional data yet</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Products table ── */}
      <div className="card">
        <div className="section-head">
          <div className="section-title">Top Performing Products</div>
          <div className="section-sub">By units sold · last 30 days</div>
        </div>
        {top_products.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Units sold</th>
                  <th>Share of total</th>
                </tr>
              </thead>
              <tbody>
                {top_products.map((p, i) => (
                  <tr key={i}>
                    <td style={{color:"var(--muted)",fontWeight:700,width:32}}>{i + 1}</td>
                    <td style={{fontWeight:500}}>{p.name}</td>
                    <td><span style={{fontWeight:700}}>{p.units.toLocaleString()}</span></td>
                    <td style={{width:200}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div className="progress-bar" style={{flex:1}}>
                          <div className="progress-fill" style={{width:`${p.share}%`}}/>
                        </div>
                        <span style={{fontSize:12,color:"var(--muted)",width:32}}>{p.share}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">No sales data yet</div>
            <div className="empty-sub">Sales will appear here once stores start selling your products</div>
          </div>
        )}
      </div>
    </>
  );
}