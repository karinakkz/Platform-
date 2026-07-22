import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import { asyncHandler } from "../lib/async-handler";

const db = new Pool({ connectionString: process.env.DATABASE_URL });
export const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET!;

router.post("/auth/signup", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 8)
    return res.status(400).json({ error: "Email and 8+ char password required" });
  const exists = await db.query(`SELECT id FROM users WHERE email=$1`, [email]);
  if (exists.rows.length) return res.status(409).json({ error: "Email already registered" });
  const hash = await bcrypt.hash(password, 12);
  const id = randomUUID();
  const referralCode = randomUUID().slice(0,8);
  await db.query(`INSERT INTO users (id,email,password_hash,referral_code) VALUES ($1,$2,$3,$4)`,[id,email,hash,referralCode]);
  await db.query(`INSERT INTO token_balances (user_id,balance) VALUES ($1,5)`,[id]);
  const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, userId: id, referralCode });
}));

router.post("/auth/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await db.query(`SELECT id,password_hash FROM users WHERE email=$1`,[email]);
  if (!rows.length || !await bcrypt.compare(password, rows[0].password_hash))
    return res.status(401).json({ error: "Invalid email or password" });
  const token = jwt.sign({ userId: rows[0].id }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, userId: rows[0].id });
}));

export function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing auth token" });
  try {
    const p = jwt.verify(h.slice(7), JWT_SECRET) as { userId: string };
    (req as any).userId = p.userId;
    next();
  } catch { res.status(401).json({ error: "Invalid or expired token" }); }
}

export default router;
