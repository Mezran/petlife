import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// config
import { config } from "./config.ts";

// db
import { db } from "./db/client.ts";
import * as schema from "./db/schema.ts";

export const auth = betterAuth({
  baseURL: config.betterAuthUrl,
  secret: config.betterAuthSecret,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    // our tables are plural (users, sessions, ...) — map model names to them
    usePlural: true,
  }),

  emailAndPassword: {
    enabled: true,
  },

  advanced: {
    database: {
      // postgres mints ids via the uuidv7() column defaults — see schema.ts
      generateId: false,
    },
  },
});
