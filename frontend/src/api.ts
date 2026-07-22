import { getToken } from "./auth";
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(msg:string, public status:number, public body:any){ super(msg); }
}

async function req<T>(path:string, opts:RequestInit={}):Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`,{
    headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
    ...opts,
  });
  if(!res.ok){ const b=await res.json().catch(()=>({})); throw new ApiError(b.error??res.statusText,res.status,b); }
  return res.json();
}

export const api = {
  getMe:()=>req<{userId:string;email:string;membershipStatus:string;referralCode:string;tokenBalance:number}>("/auth/me"),
  claimDaily:()=>req<{granted:number}>("/tokens/daily-claim",{method:"POST"}),
  createBuild:(prompt:string,platform?:string)=>req<{buildId:string;appName:string;completedStages:string[];currentStage:string|null;spec:any}>("/builds",{method:"POST",body:JSON.stringify({prompt,platform})}),
  listBuilds:()=>req<{builds:any[]}>("/builds"),
  advanceBuild:(buildId:string)=>req<{status:string;stageCompleted:string;nextStage:string|null}>(`/builds/${buildId}/advance`,{method:"POST"}),
  generateShareLink:(platform:string)=>req<{shareUrl:string}>("/share/generate-link",{method:"POST",body:JSON.stringify({platform})}),
  claimShareBonus:(shareId:string)=>req<{granted:number}>("/share/claim-bonus",{method:"POST",body:JSON.stringify({shareId})}),
  checkoutTokens:(packId:string)=>req<{url:string}>("/checkout/tokens",{method:"POST",body:JSON.stringify({packId})}),
  checkoutMembership:(planId:string)=>req<{url:string}>("/checkout/membership",{method:"POST",body:JSON.stringify({planId})}),
  checkoutReleaseFee:(buildId:string)=>req<{url:string}>("/checkout/release-fee",{method:"POST",body:JSON.stringify({buildId})}),
  openBillingPortal:()=>req<{url:string}>("/billing/portal",{method:"POST"}),
};
