import { pino } from "pino";

import { config } from "./config.ts";

export const logger = pino({
  level: config.logLevel,
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    'res.headers["set-cookie"]',
  ],
  transport: config.isDevelopment ? { target: "pino-pretty" } : undefined,
});
