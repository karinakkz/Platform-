import Stripe from "stripe";
import express from "express";
import { Pool } from "pg";
import { asyncHandler } from "../lib/async-handler";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const db = new Pool({ connectionString: process.env.DATABASE_URL });
export const router = express.Router();

router.post("/webhooks/stripe",express.raw({type:"application/json"}),asyncHandler(async(req,res)=>{
  let event: Stripe.Event;
  try{
    event=stripe.webhooks.constructEvent(req.body,req.headers["stripe-signature"] as string,process.env.STRIPE_WEBHOOK_SECRET!);
  }catch{return res.status(400).send("Webhook signature failed");}

  if(event.type==="checkout.session.completed"){
    const s=event.data.object as Stripe.Checkout.Session;
    const {type,userId}=s.metadata!;
    if(s.customer){
      await db.query(`UPDATE users SET stripe_customer_id=$1 WHERE id=$2`,[s.customer,userId]);
    }
    if(type==="token_purchase"){
      const tokens=parseInt(s.metadata!.tokens,10);
      await credit(userId,tokens,"purchase",s.id);
    }
    if(type==="membership"){
      await db.query(`UPDATE users SET membership_status='active',membership_renews_at=now()+interval '1 month' WHERE id=$1`,[userId]);
      await db.query(`INSERT INTO subscriptions (user_id,plan_id,stripe_subscription_id,status) VALUES ($1,$2,$3,'active') ON CONFLICT (user_id) DO UPDATE SET plan_id=$2,stripe_subscription_id=$3,status='active'`,[userId,s.metadata!.planId,s.subscription]);
    }
    if(type==="release_fee"){
      await db.query(`UPDATE builds SET release_fee_paid=true WHERE id=$1`,[s.metadata!.buildId]);
    }
  }

  if(event.type==="customer.subscription.deleted"||event.type==="customer.subscription.updated"){
    const sub=event.data.object as Stripe.Subscription;
    const status=sub.status==="active"?"active":"expired";
    await db.query(`UPDATE users SET membership_status=$1 WHERE id=(SELECT user_id FROM subscriptions WHERE stripe_subscription_id=$2)`,[status,sub.id]);
  }

  if(event.type==="invoice.payment_failed"){
    const invoice=event.data.object as Stripe.Invoice;
    const subId=invoice.subscription as string|null;
    if(subId){
      await db.query(`UPDATE users SET membership_status='past_due' WHERE id=(SELECT user_id FROM subscriptions WHERE stripe_subscription_id=$1)`,[subId]);
    }
  }

  res.json({received:true});
}));

export async function credit(userId:string,amount:number,reason:string,refId:string){
  const client=await db.connect();
  try{
    await client.query("BEGIN");
    await client.query(`INSERT INTO token_ledger (id,user_id,amount,reason,reference_id) VALUES (gen_random_uuid(),$1,$2,$3,$4)`,[userId,amount,reason,refId]);
    await client.query(`INSERT INTO token_balances (user_id,balance,updated_at) VALUES ($1,$2,now()) ON CONFLICT (user_id) DO UPDATE SET balance=token_balances.balance+$2,updated_at=now()`,[userId,amount]);
    await client.query("COMMIT");
  }catch(e){await client.query("ROLLBACK");throw e;}
  finally{client.release();}
}

export default router;
