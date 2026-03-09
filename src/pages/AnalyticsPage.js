import React, { useState, useEffect } from "react";
import api from "../api/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, Cell,
} from "recharts";

const RISK_CFG = {
  high:   { color:"var(--danger)", bg:"#FEE2E2", label:"High Risk" },
  medium: { color:"var(--warn)",   bg:"#FEF3C7", label:"Medium" },
  low:    { color:"var(--ok)",     bg:"#DCFCE7", label:"Low Risk" },
};

const BAR_COLORS = ["#3A6FF7","#6B8EF9","#9DB3FB","#C5D2FD","#D6E0FE","#E8EDFF"];

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:"white",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",fontSize:13}}>
      <div style={{color:"var(--muted)",marginBottom:4}}>{label}</div>
      <div style={{fontWeight:700,color:"var(--accent)"}}>{payload[0].value.toLocaleString()} units</div>
    </div>
  );
};

export default function AnalyticsPage() {
  const [products, setProducts]               = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedState, setSelectedState]     = useState(null);
  const [regionData, setRegionData]           = useState([]);
  const [trendData, setTrendData]             = useState([]);
  const [stockoutData, setStockoutData]       = useState([]);
  const [storesData, setStoresData]           = useState([]);
  const [period, setPeriod]                   = useState("monthly");
  const [loading, setLoading]                 = useState(true);
  const [trendLoading, setTrendLoading]       = useState(false);
  const [error, setError]                     = useState(null);
  const [tab, setTab]                         = useState("overview");

  // Load products once on mount
  useEffect(() => {
    api.get("/manufacturer/products")
      .then(res => {
        const prods = res.data?.products || [];
        setProducts(prods);
        if (prods.length > 0) setSelectedProduct(prods[0]);
      })
      .catch(() => setProducts([]));
  }, []);

  // Reload all analytics when period changes
  useEffect(() => {
    if (!selectedProduct) return;
    fetchAnalytics(selectedProduct.product_name);
  }, [period]); // eslint-disable-line

  // When selected product changes, only refetch trend (other data is product-agnostic)
  useEffect(() => {
    if (!selectedProduct) return;
    if (regionData.length === 0) {
      fetchAnalytics(selectedProduct.product_name);
    } else {
      fetchTrend(selectedProduct.product_name);
    }
  }, [selectedProduct]); // eslint-disable-line

  const fetchAnalytics = (productName) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ period, product: productName });
    api.get(`/manufacturer/analytics?${params}`)
      .then(res => {
        setRegionData(res.data?.regions   || []);
        setTrendData(res.data?.trend      || []);
        setStockoutData(res.data?.stockout || []);
        setStoresData(res.data?.stores    || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.error || "Failed to load analytics");
        setLoading(false);
      });
  };

  const fetchTrend = (productName) => {
    setTrendLoading(true);
    const params = new URLSearchParams({ period, product: productName });
    api.get(`/manufacturer/analytics?${params}`)
      .then(res => {
        setTrendData(res.data?.trend   || []);
        setStoresData(res.data?.stores || []);
        setTrendLoading(false);
      })
      .catch(() => setTrendLoading(false));
  };

  // District data nested inside regionData
  const districtData = selectedState
    ? (regionData.find(r => r.state === selectedState)?.districts || [])
    : [];

  // Store list for selected state (flat from storesData filtered by state)
  const stateStores = selectedState
    ? storesData.filter(s => s.state === selectedState)
    : [];

  const totalUnits    = regionData.reduce((s, r) => s + (r.total_units || 0), 0);
  const totalStores   = regionData.reduce((s, r) => s + (r.stores || 0), 0);
  const topState      = [...regionData].sort((a, b) => b.total_units - a.total_units)[0];
  const highRiskCount = stockoutData
    .filter(s => s.risk_level === "high")
    .reduce((n, s) => n + s.at_risk_stores, 0);

  if (loading) return (
    <div className="centered" style={{minHeight:"60vh"}}>
      <div className="spinner"/>
      <span style={{color:"var(--muted)",fontSize:14}}>Loading analytics…</span>
    </div>
  );

  if (error) return (
    <>
      <div className="page-header"><div className="page-title">Analytics</div></div>
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <div className="empty-title">Could not load analytics</div>
          <div className="empty-sub">{error}</div>
        </div>
      </div>
    </>
  );

  if (products.length === 0) return (
    <>
      <div className="page-header"><div className="page-title">Analytics</div></div>
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">No products listed</div>
          <div className="empty-sub">Go to My Products and add the products you manufacture to see analytics</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="page-header" style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div className="page-title">Analytics</div>
          <div className="page-sub">Store-level insights across the Reco network</div>
        </div>
        <div className="period-row">
          {[["Daily","daily"],["Weekly","weekly"],["Monthly","monthly"]].map(([l, v]) => (
            <button key={v} className={`period-chip${period === v ? " active" : ""}`} onClick={() => setPeriod(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── Product selector ── */}
      {products.length > 0 && (
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
          {products.map((p, i) => (
            <button key={i}
              onClick={() => setSelectedProduct(p)}
              style={{
                padding:"7px 14px", borderRadius:20, border:"1.5px solid",
                fontFamily:"inherit", fontSize:12, fontWeight:600, cursor:"pointer",
                transition:"all 0.15s",
                borderColor: selectedProduct?.id === p.id ? "var(--accent)" : "var(--border)",
                background:  selectedProduct?.id === p.id ? "var(--accent-dim)" : "var(--surface)",
                color:       selectedProduct?.id === p.id ? "var(--accent)" : "var(--muted)",
              }}>
              {p.product_name.length > 30 ? p.product_name.slice(0, 28) + "…" : p.product_name}
            </button>
          ))}
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="grid-4" style={{marginBottom:24}}>
        {[
          { label:"Total units sold", value: totalUnits.toLocaleString(), sub:`${period} · all regions` },
          { label:"Active stores",    value: totalStores,                 sub:"Selling your products" },
          { label:"Top region",       value: topState?.state || "—",      sub:`${topState?.total_units?.toLocaleString() || 0} units`, isText:true },
          { label:"At-risk stores",   value: highRiskCount,               sub:"High stockout risk", danger: highRiskCount > 0 },
        ].map((s, i) => (
          <div className="card card-sm" key={i}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{
              fontSize: s.isText ? 18 : 28,
              color: s.danger ? "var(--danger)" : "var(--text)",
            }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{marginBottom:20}}>
        <div className="tab-row" style={{maxWidth:480}}>
          {[["overview","Overview"],["regions","By Region"],["stores","Stores"],["stockout","Stockout Risk"]].map(([v, l]) => (
            <button key={v} className={`tab${tab === v ? " active" : ""}`} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── Tab: Overview ── */}
      {tab === "overview" && (
        <div className="grid-2">
          {/* Per-product trend */}
          <div className="card">
            <div className="section-head">
              <div>
                <div className="section-title">Sales Trend</div>
                <div className="section-sub" style={{maxWidth:260,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {selectedProduct?.product_name || "All products"} · last 14 days
                </div>
              </div>
              {trendLoading && <div className="spinner" style={{width:16,height:16}}/>}
            </div>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{left:-20,right:4,top:4,bottom:0}}>
                  <CartesianGrid stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="date" tick={{fontSize:10,fill:"var(--muted)"}} axisLine={false} tickLine={false} interval={1}/>
                  <YAxis tick={{fontSize:10,fill:"var(--muted)"}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomBarTooltip/>}/>
                  <Line type="monotone" dataKey="units" stroke="var(--accent)" strokeWidth={2.5} dot={false} activeDot={{r:4}}/>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{padding:"40px 0"}}>
                <div className="empty-sub">No sales for this product in the last 14 days</div>
              </div>
            )}
          </div>

          {/* Units by state bar */}
          <div className="card">
            <div className="section-head">
              <div className="section-title">Units by State</div>
              <div className="section-sub">Click a bar to drill down by region</div>
            </div>
            {regionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={regionData} margin={{left:-20,right:4,top:4,bottom:0}}
                  onClick={d => {
                    const state = d?.activePayload?.[0]?.payload?.state;
                    if (state) { setSelectedState(state); setTab("regions"); }
                  }}>
                  <CartesianGrid stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="state" tick={{fontSize:9,fill:"var(--muted)"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:"var(--muted)"}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomBarTooltip/>}/>
                  <Bar dataKey="total_units" radius={[6,6,0,0]} cursor="pointer">
                    {regionData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{padding:"40px 0"}}>
                <div className="empty-sub">No regional data for this period</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: By Region ── */}
      {tab === "regions" && (
        <div className="grid-2">
          {/* State list */}
          <div className="card">
            <div className="section-head">
              <div className="section-title">State Performance</div>
              <div className="section-sub">Click to see district & store breakdown</div>
            </div>
            {regionData.length === 0 ? (
              <div className="empty-state" style={{padding:"32px 0"}}>
                <div className="empty-sub">No regional data for this period</div>
              </div>
            ) : (
              [...regionData].sort((a, b) => b.total_units - a.total_units).map((r, i) => (
                <div key={i}
                  onClick={() => setSelectedState(r.state)}
                  style={{
                    display:"flex", alignItems:"center", gap:12, padding:"12px",
                    borderRadius:10, cursor:"pointer", marginBottom:4,
                    background: selectedState === r.state ? "var(--accent-dim)" : "transparent",
                    transition:"background 0.12s",
                  }}
                  onMouseEnter={e => { if (selectedState !== r.state) e.currentTarget.style.background = "var(--bg)"; }}
                  onMouseLeave={e => { if (selectedState !== r.state) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{
                    width:28, height:28, borderRadius:8,
                    background: BAR_COLORS[i % BAR_COLORS.length] + "22",
                    display:"grid", placeItems:"center", fontSize:12, fontWeight:700,
                    color: BAR_COLORS[i % BAR_COLORS.length],
                  }}>
                    {i + 1}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13,color:selectedState===r.state?"var(--accent)":"var(--text)"}}>{r.state}</div>
                    <div style={{fontSize:11,color:"var(--muted)"}}>{r.stores} stores · {r.total_units?.toLocaleString()} units</div>
                  </div>
                  <div style={{width:80}}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width:`${Math.round((r.total_units / Math.max(...regionData.map(x => x.total_units), 1)) * 100)}%`,
                        background: BAR_COLORS[i % BAR_COLORS.length],
                      }}/>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* District + store drill-down */}
          <div className="card" style={{overflowY:"auto",maxHeight:600}}>
            {selectedState ? (
              <>
                <div className="section-head">
                  <div>
                    <div className="section-title">{selectedState}</div>
                    <div className="section-sub">Districts &amp; stores</div>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => setSelectedState(null)}>Clear</button>
                </div>

                {districtData.length === 0 ? (
                  <div className="empty-state" style={{padding:"32px 0"}}>
                    <div className="empty-sub">No district data for {selectedState}</div>
                  </div>
                ) : (
                  districtData.map((d, di) => (
                    <div key={di} style={{marginBottom:16}}>
                      {/* District header */}
                      <div style={{
                        display:"flex", alignItems:"center", justifyContent:"space-between",
                        padding:"8px 10px", borderRadius:8,
                        background: BAR_COLORS[di % BAR_COLORS.length] + "18",
                        marginBottom:6,
                      }}>
                        <div>
                          <span style={{fontWeight:700,fontSize:13,color: BAR_COLORS[di % BAR_COLORS.length]}}>
                            {d.district}
                          </span>
                          <span style={{fontSize:11,color:"var(--muted)",marginLeft:8}}>
                            {d.store_count} store{d.store_count !== 1 ? "s" : ""} · {d.units.toLocaleString()} units
                          </span>
                        </div>
                      </div>

                      {/* Stores under this district */}
                      {(d.stores || []).length > 0 ? (
                        <div style={{paddingLeft:8}}>
                          {d.stores.map((st, si) => (
                            <div key={si} style={{
                              display:"flex", alignItems:"center", justifyContent:"space-between",
                              padding:"7px 10px", borderRadius:7, marginBottom:3,
                              background:"var(--bg)",
                              borderLeft:`3px solid ${BAR_COLORS[di % BAR_COLORS.length]}`,
                            }}>
                              <div>
                                <div style={{fontWeight:600,fontSize:12,color:"var(--text)"}}>{st.store_name}</div>
                                <div style={{fontSize:11,color:"var(--muted)"}}>{st.district}</div>
                              </div>
                              <div style={{fontSize:12,fontWeight:700,color:"var(--accent)"}}>
                                {st.units.toLocaleString()} units
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{fontSize:12,color:"var(--muted)",paddingLeft:12}}>No store data</div>
                      )}
                    </div>
                  ))
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🗺️</div>
                <div className="empty-title">Select a state</div>
                <div className="empty-sub">Click any state on the left to see district and store breakdown</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Stores ── */}
      {tab === "stores" && (
        <div className="card">
          <div className="section-head">
            <div>
              <div className="section-title">Store Performance</div>
              <div className="section-sub">
                {selectedProduct?.product_name || "All products"} · {period}
              </div>
            </div>
          </div>
          {storesData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏪</div>
              <div className="empty-title">No store data available</div>
              <div className="empty-sub">Sales data will appear here once stores start selling your products</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Store</th>
                    <th>District</th>
                    <th>State</th>
                    <th style={{textAlign:"right"}}>Units sold</th>
                  </tr>
                </thead>
                <tbody>
                  {storesData.map((s, i) => (
                    <tr key={i}>
                      <td style={{color:"var(--muted)",fontWeight:700,width:32}}>{i + 1}</td>
                      <td style={{fontWeight:600}}>{s.store_name}</td>
                      <td style={{color:"var(--muted)",fontSize:13}}>{s.district}</td>
                      <td style={{color:"var(--muted)",fontSize:13}}>{s.state}</td>
                      <td style={{textAlign:"right",fontWeight:700}}>{s.units.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Stockout Risk ── */}
      {tab === "stockout" && (
        <div className="card">
          <div className="section-head">
            <div>
              <div className="section-title">Stockout Risk Overview</div>
              <div className="section-sub">Stores with stock below 5 units</div>
            </div>
          </div>
          {stockoutData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <div className="empty-title">No stockout data available</div>
              <div className="empty-sub">Risk data will appear as stores sync their inventory</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>At-risk stores</th>
                    <th>Total stores</th>
                    <th>Coverage</th>
                    <th>Risk level</th>
                  </tr>
                </thead>
                <tbody>
                  {stockoutData.map((s, i) => {
                    const cfg = RISK_CFG[s.risk_level] || RISK_CFG.low;
                    const pct = s.total_stores > 0 ? Math.round((s.at_risk_stores / s.total_stores) * 100) : 0;
                    return (
                      <tr key={i}>
                        <td style={{fontWeight:500}}>{s.product_name}</td>
                        <td style={{fontWeight:700,color:s.at_risk_stores > 3 ? "var(--danger)" : "var(--text)"}}>{s.at_risk_stores}</td>
                        <td>{s.total_stores}</td>
                        <td style={{width:160}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div className="progress-bar" style={{flex:1}}>
                              <div className="progress-fill" style={{width:`${pct}%`,background:cfg.color}}/>
                            </div>
                            <span style={{fontSize:12,color:"var(--muted)",width:32}}>{pct}%</span>
                          </div>
                        </td>
                        <td>
                          <span className="chip" style={{background:cfg.bg,color:cfg.color}}>
                            <div className="risk-dot" style={{background:cfg.color}}/>
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}