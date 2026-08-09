import { randomUUID } from "node:crypto";

import type { RequestHandler } from "express";

// one correlation id per reqiest: honor an inbound X-Request-Id or mint a UUID
export const requestId: RequestHandler = (req, res, next) => {
  const inbound = req.headers["x-request-id"];
  const id =
    typeof inbound === "string" && inbound != "" ? inbound : randomUUID();

  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
};
