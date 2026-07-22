import React, { useState } from "react";
import { api } from "../api";

const PACKS = [
  {id:"starter",tokens:100,price:12},
  {id:"builder",tokens:500,price:50},
  {id:"studio",tokens:1500,price:120},
];

const PLANS = [
  {id:"solo",name:"Solo",price:9,tokens:80},
  {id:"pro",name:"Pro",price:39,tokens:500},
  {id:"studio",name:"Studio",price:99,tokens:1500},
];

export function TokenWallet({balance,membership,onRefresh}:{balance:number;membership:string;onRefresh:()=>void}) {
  const [tab, setTab] = useState<"tokens"|"plans">("tokens");
  const [loading, setLoading] = useState<string|null>(null);

  async function buyTokens(packId:string) {
    setLoading(packId);
    try { const {url}=await api.checkoutTokens(packId); window.location.href=url; }
    catch { setLoading(null); }
  }
  async function buyPlan(planId:string) {
    setLoading(planId);
    try { const {url}=await api.checkoutMembership(planId); window.location.href=url; }
    catch { setLoading(null); }
  }
  async function manageBilling() {
    setLoading("portal");
    try { const {url}=await api.openBillingPortal(); window.location.href=url; }
    catch { setLoading(null); }
  }

  return (
    <div className="card">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div>
          <div className="muted" style={{fontSize:12}}>Token balance</div>
          <div className="mono" style={{fontSize:26,fontWeight:600,color:"var(--amber)"}}>{balance}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,padding:"3px 10px",borderRadius:20,background:membership==="active"?"rgba(45,212,167,0.15)":"rgba(154,154,174,0.15)",color:membership==="active"?"var(--mint)":"var(--text-muted)"}}>
            {membership==="active"?"Member":"Free trial"}
          </span>
          {membership==="active"&&(
            <button className="btn btn-ghost" style={{fontSize:12}} disabled={loading==="portal"} onClick={manageBilling}>Manage billing</button>
          )}
          <button className="btn btn-ghost" style={{padding:"6px 10px",fontSize:12}} onClick={onRefresh}>↻</button>
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {["tokens","plans"].map(t=>(
          <button key={t} className="btn" onClick={()=>setTab(t as any)}
            style={{background:tab===t?"var(--violet)":"transparent",color:tab===t?"white":"var(--text-muted)",border:`1px solid ${tab===t?"var(--violet)":"var(--line)"}`,fontSize:13,padding:"6px 14px"}}>
            {t==="tokens"?"Buy tokens":"Membership"}
          </button>
        ))}
      </div>

      {tab==="tokens"&&(
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {PACKS.map(p=>(
            <button key={p.id} className="btn btn-ghost" onClick={()=>buyTokens(p.id)} disabled={loading===p.id} style={{fontSize:13}}>
              +{p.tokens} tokens <span className="muted">${p.price}</span>
            </button>
          ))}
        </div>
      )}

      {tab==="plans"&&(
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {PLANS.map(p=>(
            <button key={p.id} className="btn btn-ghost" onClick={()=>buyPlan(p.id)} disabled={loading===p.id} style={{fontSize:13}}>
              {p.name} <span className="muted">${p.price}/mo</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

