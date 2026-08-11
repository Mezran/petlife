// constants
import { APP_NAME } from "@petlife/shared";
import { config } from "./config.ts";
import { logger } from "./logger.ts";

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
const app = createApp();

app.listen(config.port, () => {
  logger.info(
    `[${APP_NAME}] api listening on http://localhost:${String(config.port)} (${config.nodeEnv})`,
  );
});
