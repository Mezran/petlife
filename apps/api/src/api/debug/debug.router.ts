import { Router } from "express";
import * as z from "zod";
import { setTimeout as delay } from "node:timers/promises";

import { AppError } from "../../errors.ts";

// dev only routes for testing error handling.

export const debugRouter = Router();

debugRouter.get("/throw-operational", () => {
  throw new AppError(418, "Thrown on purpose");
});

debugRouter.get("/throw-unexpected", () => {
  throw new Error("Internal error that shouldn't reach the client");
});

debugRouter.get("/reject", async () => {
  await Promise.reject(new Error("Reject on purpose"));
});

const validateQuery = z.object({
  count: z.coerce.number().int().min(1),
});

debugRouter.get("/validate", (req, res) => {
  const query = validateQuery.parse(req.query);
  res.json({ ok: true, query });
});

debugRouter.get("/slow", async (_req, res) => {
  await delay(15000);
  res.json({ ok: true, tookMS: 15000 });
});
