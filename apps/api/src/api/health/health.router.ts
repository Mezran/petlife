import { Router } from "express";
import { isReady } from "../../readiness.ts";
import { pingDb } from "../../db/client.ts";

export const healthRouter = Router();

healthRouter.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});
healthRouter.get("/readyz", async (_req, res) => {
  // draining/booting beats everything — don't burn a db round-trip on it
  if (!isReady()) {
    res.status(503).json({ status: "draining" });
    return;
  }
  try {
    await pingDb();
    res.json({ status: "ready", db: "ok" });
  } catch {
    res.status(503).json({ status: "unready", db: "unreachable" });
  }
});
