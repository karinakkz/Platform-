import Stripe from "stripe";
import express from "express";
import { Pool } from "pg";
import { TOKEN_PACKS, MEMBERSHIP_PLANS, RELEASE_FEE_USD } from "./pricing";
import { requireAuth } from "../auth/auth-service";
import { asyncHandler } from "../lib/async-handler";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const FRONTEND = process.env.FRONTEND_URL ?? "https://yourplatform.app";
export const router = express.Router();

async function existingCustomerId(userId: string): Promise<string | undefined> {
  const { rows } = await db.query(`SELECT stripe_customer_id FROM users WHERE id=$1`, [userId]);
  return rows[0]?.stripe_customer_id ?? undefined;
}

router.post("/checkout/tokens",requireAuth,asyncHandler(async(req,res)=>{
  const userId=(req as any).userId;
  const {packId}=req.body;
  const pack=TOKEN_PACKS.find(p=>p.id===packId);
  if(!pack) return res.status(400).json({error:"Unknown token pack"});
  const session=await stripe.checkout.sessions.create({
    mode:"payment",
    payment_method_types:["card"],
    customer:await existingCustomerId(userId),
    line_items:[{price_data:{currency:"usd",unit_amount:pack.priceUsd*100,product_data:{name:`${pack.tokens} Build Tokens`}},quantity:1}],
    metadata:{type:"token_purchase",userId,packId,tokens:String(pack.tokens)},
    success_url:`${FRONTEND}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:`${FRONTEND}/billing`,
  });
  res.json({url:session.url});
}));

router.post("/checkout/membership",requireAuth,asyncHandler(async(req,res)=>{
  const userId=(req as any).userId;
  const {planId}=req.body;
  const plan=MEMBERSHIP_PLANS.find(p=>p.id===planId);
  if(!plan) return res.status(400).json({error:"Unknown plan"});
  const session=await stripe.checkout.sessions.create({
    mode:"subscription",
    payment_method_types:["card"],
    customer:await existingCustomerId(userId),
    line_items:[{price_data:{currency:"usd",unit_amount:plan.priceUsdMonthly*100,recurring:{interval:"month"},product_data:{name:plan.name}},quantity:1}],
    metadata:{type:"membership",userId,planId},
    success_url:`${FRONTEND}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:`${FRONTEND}/billing`,
  });
  res.json({url:session.url});
}));

router.post("/checkout/release-fee",requireAuth,asyncHandler(async(req,res)=>{
  const userId=(req as any).userId;
  const {buildId}=req.body;
  const session=await stripe.checkout.sessions.create({
    mode:"payment",
    payment_method_types:["card"],
    customer:await existingCustomerId(userId),
    line_items:[{price_data:{currency:"usd",unit_amount:RELEASE_FEE_USD*100,product_data:{name:"App Store Release"}},quantity:1}],
    metadata:{type:"release_fee",userId,buildId},
    success_url:`${FRONTEND}/builds/${buildId}?released=true`,
    cancel_url:`${FRONTEND}/builds/${buildId}`,
  });
  res.json({url:session.url});
}));

router.post("/billing/portal",requireAuth,asyncHandler(async(req,res)=>{
  const userId=(req as any).userId;
  const customerId=await existingCustomerId(userId);
  if(!customerId) return res.status(400).json({error:"No billing account yet — make a purchase first"});
  const session=await stripe.billingPortal.sessions.create({
    customer:customerId,
    return_url:`${FRONTEND}/billing`,
  });
  res.json({url:session.url});
}));

export default router;
