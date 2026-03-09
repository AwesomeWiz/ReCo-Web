import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/manufacturer/login", { email, password });
      login(res.data.manufacturer, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="auth-title">Welcome back</div>
        <div className="auth-sub">Sign in to your manufacturer account</div>
        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label className="input-label">Email address</label>
            <input className="input" type="email" placeholder="you@company.com"
              value={email} onChange={e=>setEmail(e.target.value)} required/>
          </div>
          <div>
            <label className="input-label">Password</label>
            <input className="input" type="password" placeholder="••••••••"
              value={password} onChange={e=>setPassword(e.target.value)} required/>
          </div>
          {error && (
            <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--danger)"}}>
              {error}
            </div>
          )}
          <button className="btn btn-accent" type="submit" disabled={loading}
            style={{marginTop:4,width:"100%",justifyContent:"center",height:48,fontSize:15}}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <hr className="auth-divider"/>
        <p style={{fontSize:13,color:"var(--muted)",textAlign:"center"}}>
          Don't have an account?{" "}
          <Link to="/signup" className="auth-link">Create account</Link>
        </p>
      </div>
    </div>
  );
}