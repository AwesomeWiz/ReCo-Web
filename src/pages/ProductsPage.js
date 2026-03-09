import React, { useState, useEffect, useRef } from "react";
import api from "../api/api";
import labelMapping from "../data/labelMapping.json";

// Extract the flat array of valid product names from labelMapping
const catalogNames = Object.values(labelMapping.product_names);

// ── Icons ──────────────────────────────────────────────────────────────────
const IconUpload = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/>
    <path d="M10,11v6M14,11v6M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);
const IconX = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconDownload = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <polyline points="8,17 12,21 16,17"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
  </svg>
);
const IconFile = () => (
  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

// ── Normalise a product name for comparison ────────────────────────────────
// Strips extra whitespace, collapses internal spaces, lowercases.
// This catches copy-paste artifacts, non-breaking spaces, tab chars, etc.
function normalise(str) {
  return str
    .toLowerCase()
    .replace(/[\u00a0\u200b\t]/g, " ")  // non-breaking space, zero-width space, tab → space
    .replace(/\s+/g, " ")               // collapse runs of whitespace
    .replace(/['']/g, "'")              // smart quotes → straight
    .replace(/[""]/g, '"')              // smart double quotes → straight
    .trim();
}

// ── CSV parser ─────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return { rows: [], error: "File is empty" };
  const first = lines[0].toLowerCase();
  const hasHeader = first.includes("product") || first.includes("name") || first.includes("sku");
  const dataLines = hasHeader ? lines.slice(1) : lines;
  let nameIdx = 0, catIdx = -1;
  if (hasHeader) {
    const cols = lines[0].split(",").map(c => c.trim().toLowerCase().replace(/"/g, ""));
    const ni = cols.findIndex(c => c.includes("product") || c.includes("name") || c.includes("sku"));
    const ci = cols.findIndex(c => c.includes("categ"));
    if (ni !== -1) nameIdx = ni;
    if (ci !== -1) catIdx  = ci;
  }
  const rows = dataLines.map((line, i) => {
    const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    const name = cols[nameIdx] || "";
    const cat  = (catIdx !== -1 ? cols[catIdx] : "") || "General";
    return { raw: line, name, category: cat, lineNum: i + (hasHeader ? 2 : 1) };
  }).filter(r => r.name.length > 0);
  return { rows, hasHeader };
}

// ── Validate a row against the catalog ────────────────────────────────────
// Match priority:
//   1. Exact normalised match          → status "ok",    use catalog name
//   2. Catalog name contains input     → status "fuzzy", use catalog name
//   3. Input contains catalog name     → status "fuzzy", use catalog name
//   4. No match                        → status "unknown", keep original
function validateRow(row) {
  const normInput = normalise(row.name);

  // 1. Exact match after normalisation
  const exactMatch = catalogNames.find(n => normalise(n) === normInput);
  if (exactMatch) {
    return { ...row, status: "ok", matchedName: exactMatch, suggestion: null };
  }

  // 2 & 3. Substring match in either direction (min 6 chars to avoid noise)
  const minLen = Math.max(6, Math.floor(normInput.length * 0.5));
  const fuzzyMatch = catalogNames.find(n => {
    const normCatalog = normalise(n);
    return (
      normCatalog.includes(normInput.slice(0, minLen)) ||
      normInput.includes(normalise(n).slice(0, minLen))
    );
  });

  if (fuzzyMatch) {
    return { ...row, status: "fuzzy", matchedName: fuzzyMatch, suggestion: fuzzyMatch };
  }

  return { ...row, status: "unknown", matchedName: row.name, suggestion: null };
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position:"fixed", bottom:32, right:32, zIndex:1000,
      background: toast.type === "ok" ? "#DCFCE7" : "#FEE2E2",
      border:`1px solid ${toast.type === "ok" ? "#BBF7D0" : "#FECACA"}`,
      color: toast.type === "ok" ? "var(--ok)" : "var(--danger)",
      padding:"12px 20px", borderRadius:12, fontSize:13, fontWeight:600,
      boxShadow:"0 4px 20px rgba(0,0,0,0.1)", maxWidth:360,
    }}>
      {toast.msg}
    </div>
  );
}

export default function ProductsPage() {
  const [myProducts, setMyProducts]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [toast, setToast]               = useState(null);
  const [dragOver, setDragOver]         = useState(false);
  const [csvFile, setCsvFile]           = useState(null);
  const [parsedRows, setParsedRows]     = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/manufacturer/products");
      setMyProducts(res.data?.products || []);
    } catch (_) { setMyProducts([]); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith(".csv")) { showToast("Please upload a .csv file", "err"); return; }
    setCsvFile(file);
    setParsedRows(null);
    setSelectedRows(new Set());
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { rows, error } = parseCSV(e.target.result);
      if (error) { showToast(error, "err"); return; }
      const validated = rows.map(validateRow);
      setParsedRows(validated);
      setSelectedRows(new Set(validated.filter(r => r.status === "ok").map(r => r.lineNum)));
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const toggleRow = (n) => setSelectedRows(prev => {
    const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s;
  });
  const toggleAll = () => {
    if (!parsedRows) return;
    const all = parsedRows.map(r => r.lineNum);
    setSelectedRows(prev => prev.size === all.length ? new Set() : new Set(all));
  };

  const handleImport = async () => {
    if (!parsedRows || selectedRows.size === 0) return;
    setUploading(true);
    const toImport = parsedRows.filter(r => selectedRows.has(r.lineNum));
    let added = 0, skipped = 0, errors = 0;
    for (const row of toImport) {
      try {
        await api.post("/manufacturer/products", { product_name: row.matchedName, category: row.category });
        added++;
      } catch (err) {
        err.response?.status === 409 ? skipped++ : errors++;
      }
    }
    setImportResult({ added, skipped, errors });
    setUploading(false);
    await loadProducts();
    showToast(`Import done: ${added} added, ${skipped} already listed${errors ? `, ${errors} failed` : ""}`);
  };

  const downloadTemplate = () => {
    const rows = ["product_name,category", ...catalogNames.slice(0, 5).map(n => `"${n}","General"`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "reco_products_template.csv"; a.click();
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Remove "${name}"?`)) return;
    try {
      await api.delete(`/manufacturer/products/${id}`);
      setMyProducts(p => p.filter(x => x.id !== id));
      showToast("Product removed");
    } catch (_) { showToast("Failed to remove", "err"); }
  };

  const resetUpload = () => {
    setCsvFile(null); setParsedRows(null);
    setSelectedRows(new Set()); setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const StatusBadge = ({ status }) => {
    const cfg = {
      ok:      { bg:"#DCFCE7", color:"var(--ok)",      icon:<IconCheck/>, label:"In catalog" },
      fuzzy:   { bg:"#FEF3C7", color:"var(--warn)",    icon:null,         label:"Partial match" },
      unknown: { bg:"#FEE2E2", color:"var(--danger)",  icon:<IconX/>,     label:"Not in catalog" },
    }[status] || { bg:"var(--bg)", color:"var(--muted)", icon:null, label:"Unknown" };
    return (
      <span className="chip" style={{ background:cfg.bg, color:cfg.color, gap:4 }}>
        {cfg.icon}{cfg.label}
      </span>
    );
  };

  return (
    <>
      <Toast toast={toast}/>

      <div className="page-header">
        <div className="page-title">My Products</div>
        <div className="page-sub">Upload a CSV of your products to start tracking their performance across Reco stores</div>
      </div>

      {/* ── Upload card ── */}
      <div className="card" style={{marginBottom:24}}>
        <div className="section-head">
          <div>
            <div className="section-title">Upload Products via CSV</div>
            <div className="section-sub">
              Needs a <code style={{fontSize:11,background:"var(--bg)",padding:"1px 6px",borderRadius:4}}>product_name</code> column · optional{" "}
              <code style={{fontSize:11,background:"var(--bg)",padding:"1px 6px",borderRadius:4}}>category</code>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={downloadTemplate}>
            <IconDownload/> Download template
          </button>
        </div>

        {!csvFile ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border:`2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
              borderRadius:16, padding:"48px 24px",
              display:"flex", flexDirection:"column", alignItems:"center", gap:14,
              cursor:"pointer", transition:"all 0.15s",
              background: dragOver ? "var(--accent-dim)" : "var(--bg)",
            }}
          >
            <div style={{
              width:56, height:56, borderRadius:16,
              background: dragOver ? "var(--accent)" : "var(--surface)",
              border:`1px solid ${dragOver ? "var(--accent)" : "var(--border)"}`,
              display:"grid", placeItems:"center",
              color: dragOver ? "white" : "var(--muted)",
              transition:"all 0.15s",
            }}>
              <IconUpload/>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontWeight:700,fontSize:15,color:"var(--text)"}}>
                {dragOver ? "Release to upload" : "Drop your CSV here"}
              </div>
              <div style={{fontSize:13,color:"var(--muted)",marginTop:4}}>or click to browse files</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:8}}>Supports .csv · Max 10 MB</div>
            </div>
            <input ref={fileInputRef} type="file" accept=".csv"
              style={{display:"none"}} onChange={e => handleFile(e.target.files[0])}/>
          </div>
        ) : (
          <>
            {/* File info bar */}
            <div style={{
              display:"flex", alignItems:"center", gap:14, padding:"14px 18px",
              background:"var(--bg)", borderRadius:12, marginBottom:20,
            }}>
              <div style={{color:"var(--accent)"}}><IconFile/></div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14}}>{csvFile.name}</div>
                <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>
                  {parsedRows?.length || 0} rows found ·{" "}
                  <span style={{color:"var(--ok)",fontWeight:600}}>
                    {parsedRows?.filter(r => r.status === "ok").length || 0} matched
                  </span>{" · "}
                  <span style={{color:"var(--warn)",fontWeight:600}}>
                    {parsedRows?.filter(r => r.status === "fuzzy").length || 0} partial
                  </span>{" · "}
                  <span style={{color:"var(--danger)",fontWeight:600}}>
                    {parsedRows?.filter(r => r.status === "unknown").length || 0} unrecognized
                  </span>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={resetUpload}>Change file</button>
            </div>

            {/* Legend */}
            <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:14}}>
              {[
                { bg:"#DCFCE7", color:"var(--ok)",     label:"Exact match — ready to import" },
                { bg:"#FEF3C7", color:"var(--warn)",   label:"Partial match — review first" },
                { bg:"#FEE2E2", color:"var(--danger)", label:"Not recognized — cannot track" },
              ].map((l, i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:l.color}}>
                  <div style={{width:10,height:10,borderRadius:3,background:l.bg,border:`1px solid ${l.color}44`}}/>
                  {l.label}
                </div>
              ))}
            </div>

            {/* Rows table */}
            {parsedRows && (
              <div style={{border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",marginBottom:20}}>
                <div style={{
                  display:"flex", alignItems:"center", gap:12, padding:"10px 16px",
                  background:"var(--bg)", borderBottom:"1px solid var(--border)",
                }}>
                  <input type="checkbox"
                    checked={parsedRows.length > 0 && selectedRows.size === parsedRows.length}
                    onChange={toggleAll}
                    style={{width:15,height:15,accentColor:"var(--accent)",cursor:"pointer"}}/>
                  <span style={{fontSize:12,fontWeight:600,color:"var(--muted)"}}>
                    {selectedRows.size} / {parsedRows.length} selected for import
                  </span>
                </div>
                <div style={{maxHeight:340,overflowY:"auto"}}>
                  {parsedRows.map((row, i) => (
                    <div key={i}
                      onClick={() => toggleRow(row.lineNum)}
                      style={{
                        display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
                        cursor:"pointer",
                        borderBottom: i < parsedRows.length - 1 ? "1px solid var(--border)" : "none",
                        background: selectedRows.has(row.lineNum) ? "var(--accent-dim)" : "white",
                        transition:"background 0.1s",
                      }}
                    >
                      <input type="checkbox"
                        checked={selectedRows.has(row.lineNum)} onChange={() => {}}
                        onClick={e => e.stopPropagation()}
                        style={{width:15,height:15,accentColor:"var(--accent)",cursor:"pointer",flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:500,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {row.matchedName}
                        </div>
                        {normalise(row.name) !== normalise(row.matchedName) && (
                          <div style={{fontSize:11,color:"var(--warn)",marginTop:1}}>
                            CSV input: "{row.name}"
                          </div>
                        )}
                      </div>
                      <span className="chip chip-gray" style={{fontSize:11,flexShrink:0}}>{row.category}</span>
                      <StatusBadge status={row.status}/>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import result */}
            {importResult && (
              <div style={{
                display:"flex", gap:20, padding:"14px 20px", borderRadius:10, marginBottom:18,
                background:"var(--bg)", border:"1px solid var(--border)", flexWrap:"wrap",
                alignItems:"center",
              }}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>Import complete</div>
                {[
                  { label:"Added",          value:importResult.added,   color:"var(--ok)" },
                  { label:"Already listed", value:importResult.skipped, color:"var(--muted)" },
                  { label:"Failed",         value:importResult.errors,  color:"var(--danger)" },
                ].map((s, i) => (
                  <div key={i} style={{display:"flex",alignItems:"baseline",gap:5}}>
                    <span style={{fontWeight:800,fontSize:22,color:s.color}}>{s.value}</span>
                    <span style={{fontSize:12,color:"var(--muted)"}}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button
                className="btn btn-accent"
                onClick={handleImport}
                disabled={uploading || !parsedRows || selectedRows.size === 0}
                style={{opacity:(uploading || !parsedRows || selectedRows.size === 0) ? 0.5 : 1}}
              >
                {uploading ? "Importing…" : `Import ${selectedRows.size} product${selectedRows.size !== 1 ? "s" : ""}`}
              </button>
              <button className="btn btn-outline" onClick={resetUpload}>Cancel</button>
            </div>
          </>
        )}
      </div>

      {/* ── Listed products ── */}
      <div className="card">
        <div className="section-head">
          <div>
            <div className="section-title">Listed Products</div>
            <div className="section-sub">{myProducts.length} product{myProducts.length !== 1 ? "s" : ""} being tracked</div>
          </div>
        </div>
        {loading ? (
          <div className="centered"><div className="spinner"/></div>
        ) : myProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">No products listed yet</div>
            <div className="empty-sub">Upload a CSV above to start tracking your products across the Reco network</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product name</th>
                  <th>Category</th>
                  <th>Added on</th>
                  <th style={{width:60}}></th>
                </tr>
              </thead>
              <tbody>
                {myProducts.map(p => (
                  <tr key={p.id}>
                    <td style={{fontWeight:500}}>{p.product_name}</td>
                    <td><span className="chip chip-blue">{p.category || "General"}</span></td>
                    <td style={{color:"var(--muted)",fontSize:12}}>
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString("en-IN", {day:"numeric",month:"short",year:"numeric"})
                        : "—"}
                    </td>
                    <td>
                      <button className="btn btn-danger-outline btn-sm"
                        onClick={() => handleRemove(p.id, p.product_name)}>
                        <IconTrash/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}