// constants
import { APP_NAME } from "@petlife/shared";
const port = 3000;

// app
import { createApp } from "./app.ts";
const app = createApp();

app.listen(port, () => {
  console.log(
    `[${APP_NAME}] api listening on http://localhost:${String(port)}`,
  );
});
