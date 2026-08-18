import { defineConfig } from "vitest/config";

import { testDatabaseUrl } from "./src/testing/test-env.ts";

// Integration project: real HTTP (supertest) against a real Postgres.
export default defineConfig({
  test: {
    // config.ts validates the whole environment at import — hand the test
    // process a complete, safe one pointed at the test database
    env: {
      NODE_ENV: "test",
      PORT: "3999",
      DATABASE_URL: testDatabaseUrl,
      BETTER_AUTH_SECRET: "jREBHCAdzGj0W5BAGWLQ3V2IhAxpxLDw3wDMicyK+g4=",
    },
    globalSetup: ["./src/testing/global-setup.ts"],
    setupFiles: ["./src/testing/setup.ts"],
    // every file shares the one test database — run them one at a time
    fileParallelism: false,
  },
});
