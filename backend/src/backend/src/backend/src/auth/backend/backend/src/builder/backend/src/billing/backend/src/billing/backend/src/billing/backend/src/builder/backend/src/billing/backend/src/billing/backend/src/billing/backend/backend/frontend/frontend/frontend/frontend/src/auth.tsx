import React, { createContext, useContext, useState, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const TK = "platform_token", UID = "platform_uid";

interface Ctx { token:string|null; userId:string|null; signup:(e:string,p:string)=>Promise<void>; login:(e:string,p:string)=>Promise<void>; logout:()=>void; }
const AuthCtx = createContext<Ctx|null>(null);

export function AuthProvider({ children }:{ children:React.ReactNode }) {
  const [token, setToken] = useState<string|null>(localStorage.getItem(TK));
  const [userId, setUserId] = useState<string|null>(localStorage.getItem(UID));

  const save = (t:string,u:string)=>{localStorage.setItem(TK,t);localStorage.setItem(UID,u);setToken(t);setUserId(u);};

  const signup = useCallback(async(email:string,password:string)=>{
    const r = await fetch(`${BASE}/auth/signup`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    const b = await r.json();
    if(!r.ok) throw new Error(b.error??"Signup failed");
    save(b.token,b.userId);
  },[]);

  const login = useCallback(async(email:string,password:string)=>{
    const r = await fetch(`${BASE}/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    const b = await r.json();
    if(!r.ok) throw new Error(b.error??"Login failed");
    save(b.token,b.userId);
  },[]);

  const logout = useCallback(()=>{localStorage.removeItem(TK);localStorage.removeItem(UID);setToken(null);setUserId(null);},[]);

  return <AuthCtx.Provider value={{token,userId,signup,login,logout}}>{children}</AuthCtx.Provider>;
}

export function useAuth() { const c=useContext(AuthCtx); if(!c) throw new Error("useAuth outside AuthProvider"); return c; }
export const getToken=()=>localStorage.getItem(TK);
