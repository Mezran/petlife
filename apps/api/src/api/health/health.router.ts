import { Router } from "express";
import { isReady } from "../../readiness.ts";

export const healthRouter = Router();

healthRouter.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

healthRouter.get("/readyz", (_req, res) => {
  if (isReady()) {
    res.json({ status: "ready" });
  } else {
    res.status(503).json({ status: "draining" });
  }
});
