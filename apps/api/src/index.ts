// constants
import { APP_NAME } from "@petlife/shared";
import { config } from "./config.ts";

// app
import { createApp } from "./app.ts";
const app = createApp();

app.listen(config.port, () => {
  console.log(
    `[${APP_NAME}] api listening on http://localhost:${String(config.port)} (${config.nodeEnv})`,
  );
});
