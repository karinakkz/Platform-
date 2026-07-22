import express from "express";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import { requireAuth } from "../auth/auth-service";
import { runNextStage, STAGE_ORDER, BuildState } from "./builder";
import { asyncHandler } from "../lib/async-handler";

const db = new Pool({ connectionString: process.env.DATABASE_URL });
export const router = express.Router();

const FREE_STAGES = 2;
const STAGE_COST: Record<string, number> = {
  spec:0,architecture:0,scaffold:5,screens:25,logic:15,polish:8,qa:5
};

router.post("/builds",requireAuth,asyncHandler(async(req,res)=>{
  const userId=(req as any).userId;
  const {prompt,platform}=req.body;
  if(!prompt?.trim()) return res.status(400).json({error:"Prompt required"});
  const buildId=randomUUID();
  const bundleId=`com.platform.app${buildId.slice(0,8)}`;
  await db.query(`INSERT INTO builds (id,user_id,app_name,bundle_id,status) VALUES ($1,$2,$3,$4,'in_progress')`,[buildId,userId,prompt.slice(0,60),bundleId]);
  let state: BuildState={buildId,userId,prompt,platform:platform??"react-native",completedStages:[],outputDir:`/tmp/builds/${buildId}`};
  try{state=await runNextStage(state);}
  catch(e){return res.status(502).json({error:"Couldn't generate spec — try rephrasing"});}
  await db.query(`UPDATE builds SET state=$1 WHERE id=$2`,[JSON.stringify(state),buildId]);
  res.json({buildId,appName:state.spec?.appName??prompt.slice(0,40),completedStages:state.completedStages,currentStage:STAGE_ORDER.find(s=>!state.completedStages.includes(s))??null,spec:state.spec});
}));

router.get("/builds",requireAuth,asyncHandler(async(req,res)=>{
  const userId=(req as any).userId;
  const {rows}=await db.query(`SELECT id,app_name,status,tokens_spent,release_fee_paid,created_at FROM builds WHERE user_id=$1 ORDER BY created_at DESC`,[userId]);
  res.json({builds:rows});
}));

router.post("/builds/:buildId/advance",requireAuth,asyncHandler(async(req,res)=>{
  const {buildId}=req.params;
  const userId=(req as any).userId;
  const {rows}=await db.query(`SELECT * FROM builds WHERE id=$1 AND user_id=$2`,[buildId,userId]);
  if(!rows.length) return res.status(404).json({error:"Build not found"});
  let state: BuildState=rows[0].state??{buildId,userId,completedStages:[],outputDir:`/tmp/builds/${buildId}`,prompt:"",platform:"react-native"};
  const next=STAGE_ORDER.find(s=>!state.completedStages.includes(s));
  if(!next) return res.json({status:"complete"});
  const idx=STAGE_ORDER.indexOf(next);
  const cost=STAGE_COST[next];
  if(idx>=FREE_STAGES&&cost>0){
    const bal=await db.query(`SELECT balance FROM token_balances WHERE user_id=$1`,[userId]);
    if((bal.rows[0]?.balance??0)<cost) return res.status(402).json({error:"Insufficient tokens",tokensNeeded:cost,message:"Free preview complete — buy tokens to keep building."});
    const client=await db.connect();
    try{
      await client.query("BEGIN");
      await client.query(`INSERT INTO token_ledger (id,user_id,amount,reason,reference_id) VALUES (gen_random_uuid(),$1,$2,'build_spend',$3)`,[userId,-cost,buildId]);
      await client.query(`UPDATE token_balances SET balance=balance-$1 WHERE user_id=$2`,[cost,userId]);
      await client.query(`UPDATE builds SET tokens_spent=tokens_spent+$1 WHERE id=$2`,[cost,buildId]);
      await client.query("COMMIT");
    }catch(e){await client.query("ROLLBACK");throw e;}
    finally{client.release();}
  }
  try{state=await runNextStage(state);}
  catch(e){return res.status(502).json({error:`Generation failed at "${next}" — try again`});}
  const done=state.completedStages.length===STAGE_ORDER.length;
  await db.query(`UPDATE builds SET state=$1,status=$2 WHERE id=$3`,[JSON.stringify(state),done?"trial_complete":"in_progress",buildId]);
  res.json({status:done?"complete":"in_progress",stageCompleted:next,nextStage:STAGE_ORDER[idx+1]??null});
}));

export default router;
