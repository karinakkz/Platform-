import React, { useState } from "react";
import { api } from "../api";

const PLATFORMS = ["instagram","tiktok","x","facebook"] as const;

export function ShareEarn() {
  const [links,setLinks]=useState<Record<string,string>>({});
  const [copied,setCopied]=useState<string|null>(null);

  async function getLink(p:string) {
    const {shareUrl}=await api.generateShareLink(p);
    setLinks(prev=>({...prev,[p]:shareUrl}));
  }
  function copy(p:string,url:string) {
    navigator.clipboard.writeText(url);
    setCopied(p); setTimeout(()=>setCopied(null),1800);
  }

  return (
    <div className="card">
      <div style={{fontFamily:"var(--font-display)",fontWeight:600,marginBottom:4}}>Earn free tokens</div>
      <div className="muted" style={{fontSize:13,marginBottom:14}}>Share your referral link. Earn 5 tokens per verified click (up to 3×/day).</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {PLATFORMS.map(p=>(
          <button key={p} className="btn btn-ghost" style={{fontSize:13,textTransform:"capitalize"}}
            onClick={()=>links[p]?copy(p,links[p]):getLink(p)}>
            {copied===p?"Copied!":links[p]?`Copy ${p} link`:`Get ${p} link`}
          </button>
        ))}
      </div>
    </div>
  );
}
