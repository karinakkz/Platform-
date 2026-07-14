import React, { useState } from "react";
import { useAuth } from "../auth";

export function AuthForm() {
  const { signup, login } = useAuth();
  const [mode, setMode] = useState<"signup"|"login">("signup");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState<string|null>(null); const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null); setLoading(true);
    try { mode==="signup" ? await signup(email,password) : await login(email,password); }
    catch(e:any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{display:"flex",minHeight:"100vh",alignItems:"center",justifyContent:"center",background:"var(--bg)"}}>
      <div className="card" style={{width:340,padding:32}}>
        <div className="brand" style={{marginBottom:8}}>Build<span>OS</span></div>
        <div className="muted" style={{fontSize:14,marginBottom:24}}>Build and ship apps with AI</div>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/>
        <input type="password" placeholder="Password (8+ characters)" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="signup"?"new-password":"current-password"}/>
        {error && <div style={{color:"var(--coral)",fontSize:13,marginBottom:12}}>{error}</div>}
        <button className="btn btn-primary" style={{width:"100%"}} onClick={submit} disabled={loading||!email||!password}>
          {loading?"Working…":mode==="signup"?"Create free account":"Log in"}
        </button>
        <button onClick={()=>setMode(m=>m==="signup"?"login":"signup")} style={{background:"none",border:"none",color:"var(--text-muted)",fontSize:13,marginTop:12,cursor:"pointer",display:"block",textAlign:"center",width:"100%"}}>
          {mode==="signup"?"Already have an account? Log in":"New here? Create a free account"}
        </button>
      </div>
    </div>
  );
}
