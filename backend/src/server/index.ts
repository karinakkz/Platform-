import express from "express";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import { requireAuth } from "../auth/auth-service";
import { asyncHandler } from "../lib/async-handler";
import { credit } from "../billing/stripe-webhook";
import { DAILY_FREE_GRANT } from "../billing/pricing";

const db = new Pool({ connectionString: process.env.DATABASE_URL });
const FRONTEND = process.env.FRONTEND_URL ?? "https://yourplatform.app";
export const router = express.Router();

const SHARE_BONUS_TOKENS = 5;
const MAX_SHARE_BONUSES_PER_DAY = 3;
const ALLOWED_PLATFORMS = ["instagram","tiktok","x","facebook"];

router.post("/tokens/daily-claim",requireAuth,asyncHandler(async(req,res)=>{
  const userId=(req as any).userId;
  const {rows}=await db.query(
    `INSERT INTO daily_claims (user_id,claim_date,base_grant_claimed)
     VALUES ($1,CURRENT_DATE,true)
     ON CONFLICT (user_id,claim_date) DO UPDATE SET base_grant_claimed=true
     WHERE daily_claims.base_grant_claimed=false
     RETURNING user_id`,
    [userId]
  );
  if(!rows.length) return res.json({granted:0});
  await credit(userId,DAILY_FREE_GRANT,"daily_grant",new Date().toISOString().slice(0,10));
  res.json({granted:DAILY_FREE_GRANT});
}));

router.post("/share/generate-link",requireAuth,asyncHandler(async(req,res)=>{
  const userId=(req as any).userId;
  const {platform}=req.body;
  if(!ALLOWED_PLATFORMS.includes(platform)) return res.status(400).json({error:"Unknown platform"});
  const {rows}=await db.query(`SELECT referral_code FROM users WHERE id=$1`,[userId]);
  if(!rows.length) return res.status(404).json({error:"User not found"});
  const shareId=randomUUID();
  const shareUrl=`${FRONTEND}/r/${rows[0].referral_code}?share=${shareId}&p=${platform}`;
  await db.query(`INSERT INTO social_shares (id,user_id,platform,share_url) VALUES ($1,$2,$3,$4)`,[shareId,userId,platform,shareUrl]);
  res.json({shareUrl});
}));

router.post("/share/claim-bonus",requireAuth,asyncHandler(async(req,res)=>{
  const userId=(req as any).userId;
  const {shareId}=req.body;
  if(!shareId) return res.status(400).json({error:"shareId required"});
  const {rows}=await db.query(`SELECT * FROM social_shares WHERE id=$1 AND user_id=$2`,[shareId,userId]);
  if(!rows.length) return res.status(404).json({error:"Share not found"});
  const share=rows[0];
  if(!share.verified) return res.status(400).json({error:"Share not yet verified"});
  if(share.bonus_paid) return res.status(409).json({error:"Bonus already claimed"});
  const claim=await db.query(
    `INSERT INTO daily_claims (user_id,claim_date,share_bonus_count)
     VALUES ($1,CURRENT_DATE,1)
     ON CONFLICT (user_id,claim_date) DO UPDATE SET share_bonus_count=daily_claims.share_bonus_count+1
     WHERE daily_claims.share_bonus_count < $2
     RETURNING share_bonus_count`,
    [userId,MAX_SHARE_BONUSES_PER_DAY]
  );
  if(!claim.rows.length) return res.status(429).json({error:"Daily share bonus limit reached"});
  await db.query(`UPDATE social_shares SET bonus_paid=true WHERE id=$1`,[shareId]);
  await credit(userId,SHARE_BONUS_TOKENS,"share_bonus",shareId);
  res.json({granted:SHARE_BONUS_TOKENS});
}));

export default router;
