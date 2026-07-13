import express from "express";
import cors from "cors";
import { router as webhookRouter } from "./billing/stripe-webhook";
import authRouter from "./auth/auth-service";
import buildsRouter from "./builds/builds-api";
import checkoutRouter from "./billing/stripe-checkout";
import { router as serverRouter } from "./server";

const app = express();

app.use("/webhooks/stripe", webhookRouter);
app.use(cors({ origin: process.env.FRONTEND_URL ?? "*" }));
app.use(express.json());
app.use(authRouter);
app.use(buildsRouter);
app.use(checkoutRouter);
app.use(serverRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));
