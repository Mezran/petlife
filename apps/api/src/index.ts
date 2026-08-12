// constants
import { setTimeout as delay } from "node:timers/promises";

import { APP_NAME } from "@petlife/shared";
import { config } from "./config.ts";
import { logger } from "./logger.ts";
import { setReady } from "./readiness.ts";

// how long readiness stays "draining" before we stop accepting (gives
// pollers time to notice), and the hard ceiling on the whole shutdown
const READINESS_DRAIN_MS = 3000;
const SHUTDOWN_DEADLINE_MS = 10_000;

// crash policy: a process in an unknown state must not keep serving.
// log everything, exit nonzero, let the supervisor restart a clean process
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught exception — exiting");
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "unhandled rejection — exiting");
  process.exit(1);
});

// app
import { createApp } from "./app.ts";
import { closeDb } from "./db/client.ts";
const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(
    `[${APP_NAME}] api listening on http://localhost:${String(config.port)} (${config.nodeEnv})`,
  );
  setReady(true);
});

// graceful shutdown:
// readiness off -> drain window -> stop accepting ->
// in-flight requests finish -> exit 0, all under a hard deadline.
let shuttingDown = false;
const shutdown = async (signal: string): Promise<void> => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  logger.info(`${signal} received — draining`);
  setReady(false);
  await delay(READINESS_DRAIN_MS);

  const deadline = setTimeout(() => {
    logger.error("shutdown deadline hit — forcing exit");
    process.exit(1);
  }, SHUTDOWN_DEADLINE_MS);
  deadline.unref();

  server.close((err) => {
    if (err) {
      logger.error({ err }, "error while closing server");
      process.exit(1);
    }
    closeDb()
      .then(() => {
        logger.info("server and db pool closed — exiting");
        process.exit(0);
      })
      .catch((closeErr: unknown) => {
        logger.error({ err: closeErr }, "error while closing db pool");
        process.exit(1);
      });
  });
  server.closeIdleConnections();
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
