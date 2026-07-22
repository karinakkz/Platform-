import React from "react";

const STAGES = [
  {key:"spec",label:"Spec",cost:0},
  {key:"architecture",label:"Plan",cost:0},
  {key:"scaffold",label:"Scaffold",cost:5},
  {key:"screens",label:"Screens",cost:25},
  {key:"logic",label:"Logic",cost:15},
  {key:"polish",label:"Polish",cost:8},
  {key:"qa",label:"QA",cost:5},
];

export function StagePipeline({completedStages,currentStage,tokenBalance,onAdvance,advancing}:{
  completedStages:string[]; currentStage:string|null; tokenBalance:number; onAdvance:()=>void; advancing:boolean;
}) {
  const nextCost = currentStage ? (STAGES.find(s=>s.key===currentStage)?.cost??0) : 0;
  const canAfford = nextCost===0 || tokenBalance>=nextCost;

  return (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {STAGES.map(s=>{
          const done=completedStages.includes(s.key);
          const active=s.key===currentStage;
          return (
            <div key={s.key} style={{flex:1,textAlign:"center"}}>
              <div style={{height:8,borderRadius:4,background:done?"var(--amber)":active?"var(--violet-dim)":"var(--surface)",border:`1px solid ${done?"var(--amber)":active?"var(--violet)":"var(--line)"}`,position:"relative",overflow:"hidden"}}>
                {active&&<div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(108,92,231,0.6),transparent)",animation:"pulse-flow 1.4s ease-in-out infinite"}}/>}
              </div>
              <div style={{fontSize:10,marginTop:4,color:done?"var(--amber)":active?"var(--violet)":"var(--text-muted)"}}>{s.label}</div>
              {s.cost>0&&<div style={{fontSize:10,color:"var(--text-muted)"}}>{s.cost}t</div>}
            </div>
          );
        })}
      </div>

      {currentStage && (
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <button className="btn btn-amber" onClick={onAdvance} disabled={advancing||!canAfford}>
            {advancing?"Building…":nextCost===0?`Run ${currentStage} (free)`:`Run ${currentStage} — ${nextCost} tokens`}
          </button>
          {!canAfford&&<span style={{color:"var(--coral)",fontSize:13}}>Not enough tokens — buy more below</span>}
        </div>
      )}

      {!currentStage&&(
        <div className="card" style={{borderColor:"var(--mint)",marginTop:8}}>
          <strong style={{color:"var(--mint)"}}>✓ Build complete.</strong>{" "}
          <span className="muted">Pay the release fee to publish to the App Store.</span>
        </div>
      )}
    </div>
  );
}
