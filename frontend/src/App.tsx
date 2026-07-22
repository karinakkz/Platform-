import React, { useState, useEffect } from "react";
import { useAuth } from "./auth";
import { api, ApiError } from "./api";
import { AuthForm } from "./components/AuthForm";
import { StagePipeline } from "./components/StagePipeline";
import { TokenWallet } from "./components/TokenWallet";
import { ShareEarn } from "./components/ShareEarn";

interface Build { id:string; appName:string; completedStages:string[]; currentStage:string|null; spec?:any; }

export default function App() {
  const { userId, logout } = useAuth();
  if (!userId) return <AuthForm/>;
  return <Dashboard onLogout={logout}/>;
}

function Dashboard({onLogout}:{onLogout:()=>void}) {
  const [balance, setBalance] = useState(5);
  const [membership, setMembership] = useState("trial");
  const [builds, setBuilds] = useState<Build[]>([]);
  const [activeBuild, setActiveBuild] = useState<Build|null>(null);
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(()=>{ loadBuilds(); loadProfile(); },[]);

  async function loadBuilds() {
    try {
      const {builds:b}=await api.listBuilds();
      setBuilds(b);
      if(b.length && !activeBuild) {
        const first=b[0];
        setActiveBuild({id:first.id,appName:first.app_name,completedStages:[],currentStage:null});
      }
    } catch {}
  }

  async function loadProfile() {
    try {
      const p=await api.getMe();
      setBalance(p.tokenBalance);
      setMembership(p.membershipStatus);
    } catch {}
  }

  async function startBuild() {
    if(!prompt.trim()) return;
    setCreating(true); setError(null);
    try {
      const r=await api.createBuild(prompt);
      const build:Build={id:r.buildId,appName:r.appName,completedStages:r.completedStages,currentStage:r.currentStage,spec:r.spec};
      setActiveBuild(build);
      setBuilds(prev=>[{...build},...prev]);
      setPrompt("");
    } catch(e:any) { setError(e.message); }
    finally { setCreating(false); }
  }

  async function advance() {
    if(!activeBuild) return;
    setAdvancing(true); setError(null);
    try {
      const r=await api.advanceBuild(activeBuild.id);
      setActiveBuild(prev=>prev?{...prev,completedStages:[...prev.completedStages,r.stageCompleted],currentStage:r.nextStage}:prev);
      loadProfile();
    } catch(e) {
      if(e instanceof ApiError && e.status===402) setError(e.body.message);
      else setError("Build step failed — tap to try again");
    }
    finally { setAdvancing(false); }
  }

  async function release() {
    if(!activeBuild) return;
    try { const {url}=await api.checkoutReleaseFee(activeBuild.id); window.location.href=url; }
    catch(e:any) { setError(e.message); }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" style={{marginBottom:16}}>Build<span>OS</span></div>
        <div className="muted" style={{fontSize:12,marginBottom:8}}>YOUR BUILDS</div>
        {builds.length===0&&<div className="muted" style={{fontSize:13}}>No builds yet</div>}
        {builds.map(b=>(
          <button key={b.id} onClick={()=>setActiveBuild(b)}
            style={{background:activeBuild?.id===b.id?"var(--violet-dim)":"transparent",border:`1px solid ${activeBuild?.id===b.id?"var(--violet)":"var(--line)"}`,borderRadius:8,padding:"10px 12px",color:"var(--text)",textAlign:"left",fontSize:13,cursor:"pointer"}}>
            {b.appName||"Untitled"}
          </button>
        ))}
        <div style={{flex:1}}/>
        <button onClick={onLogout} style={{background:"none",border:"none",color:"var(--text-muted)",fontSize:13,cursor:"pointer",textAlign:"left",padding:0}}>Log out</button>
      </aside>

      <main className="main">
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <TokenWallet balance={balance} membership={membership} onRefresh={loadProfile}/>

          {!activeBuild&&(
            <div className="card">
              <div style={{fontFamily:"var(--font-display)",fontWeight:600,marginBottom:12}}>Describe the app you want to build</div>
              <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={3}
                placeholder="A habit tracker for plant care with reminders and streaks…"
                style={{resize:"vertical"}}/>
              <button className="btn btn-primary" onClick={startBuild} disabled={creating||!prompt.trim()}>
                {creating?"Starting…":"Start building — free"}
              </button>
              <div className="muted" style={{fontSize:12,marginTop:8}}>Spec and architecture stages are free. Tokens only spent on code generation.</div>
            </div>
          )}

          {activeBuild&&(
            <div className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontFamily:"var(--font-display)",fontWeight:600,fontSize:18}}>{activeBuild.appName}</div>
                  {activeBuild.spec?.category&&<div className="muted" style={{fontSize:13}}>{activeBuild.spec.category}</div>}
                </div>
                <button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>setActiveBuild(null)}>+ New build</button>
              </div>

              <StagePipeline
                completedStages={activeBuild.completedStages}
                currentStage={activeBuild.currentStage}
                tokenBalance={balance}
                onAdvance={advance}
                advancing={advancing}
              />

              {!activeBuild.currentStage&&(
                <button className="btn btn-primary" style={{marginTop:16}} onClick={release}>
                  Publish to App Store — $25
                </button>
              )}
            </div>
          )}

          {error&&(
            <div className="card" style={{borderColor:"var(--coral)",color:"var(--coral)",fontSize:14}}>
              {error}
            </div>
          )}

          <ShareEarn/>
        </div>
      </main>
    </div>
  );
}
