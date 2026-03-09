import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

const COUNTRIES = ["India", "UAE"];
const STATES = ["Andhra Pradesh","Karnataka","Kerala","Puducherry","Tamil Nadu","Telangana"];

export default function SignupPage() {
  const [form, setForm] = useState({ company_name:"", email:"", phone:"", password:"", country:"India", state:"" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({...f, [k]:v}));

  const pwChecks = [
    { label: "At least 8 characters",  ok: form.password.length >= 8 },
    { label: "One uppercase letter",    ok: /[A-Z]/.test(form.password) },
    { label: "One number",              ok: /[0-9]/.test(form.password) },
    { label: "One special character",   ok: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.password) },
  ];
  const pwValid = pwChecks.every(c => c.ok);
  const phoneValid = /^[0-9]{10}$/.test(form.phone);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!phoneValid) { setError("Enter a valid 10-digit phone number."); return; }
    if (!pwValid)    { setError("Password does not meet all requirements."); return; }
    setLoading(true);
    try {
      await api.post("/manufacturer/signup", form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="auth-page">
      <div className="auth-card" style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>🎉</div>
        <div className="auth-title">Account created!</div>
        <div className="auth-sub">Redirecting you to sign in…</div>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{width:38,height:38,background:"var(--accent)",borderRadius:11,display:"grid",placeItems:"center",color:"white",fontWeight:800,fontSize:18}}>R</div>
          <div>
            <div style={{fontWeight:700,fontSize:15,letterSpacing:"-0.3px"}}>Reco</div>
            <div style={{fontSize:11,color:"var(--muted)"}}>Manufacturer Portal</div>
          </div>
        </div>

        <div className="auth-title">Create account</div>
        <div className="auth-sub">Register your manufacturing company</div>

        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label className="input-label">Company name</label>
            <input className="input" placeholder="e.g. Nestlé India Ltd." value={form.company_name} onChange={e=>set("company_name",e.target.value)} required/>
          </div>
          <div>
            <label className="input-label">Email address</label>
            <input className="input" type="email" placeholder="admin@company.com" value={form.email} onChange={e=>set("email",e.target.value)} required/>
          </div>
          <div className="grid-2" style={{gap:12}}>
            <div>
              <label className="input-label">Phone</label>
              <input className="input" placeholder="10-digit number" maxLength={10} value={form.phone}
                onChange={e=>set("phone",e.target.value.replace(/\D/,""))}
                style={form.phone.length>0&&!phoneValid?{borderColor:"var(--danger)"}:{}}/>
              {form.phone.length>0&&!phoneValid&&<div style={{fontSize:11,color:"var(--danger)",marginTop:4}}>{form.phone.length}/10 digits</div>}
            </div>
            <div>
              <label className="input-label">Country</label>
              <select className="input" value={form.country} onChange={e=>set("country",e.target.value)} style={{cursor:"pointer"}}>
                {COUNTRIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">State / Region</label>
            <select className="input" value={form.state} onChange={e=>set("state",e.target.value)} required style={{cursor:"pointer"}}>
              <option value="">Select state</option>
              {STATES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Password</label>
            <input className="input" type="password" placeholder="Create a strong password" value={form.password} onChange={e=>set("password",e.target.value)} required/>
            {form.password.length > 0 && (
              <div style={{display:"flex",flexWrap:"wrap",gap:"4px 16px",marginTop:8}}>
                {pwChecks.map((c,i)=>(
                  <span key={i} style={{fontSize:11,color:c.ok?"var(--ok)":"var(--danger)"}}>
                    {c.ok?"✓":"✗"} {c.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--danger)"}}>
              {error}
            </div>
          )}

          <button className="btn btn-accent" type="submit" disabled={loading}
            style={{marginTop:4,width:"100%",justifyContent:"center",height:48,fontSize:15}}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <hr className="auth-divider"/>
        <p style={{fontSize:13,color:"var(--muted)",textAlign:"center"}}>
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}