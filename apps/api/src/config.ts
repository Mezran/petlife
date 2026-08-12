import * as z from "zod";

// describe every env variable and what it should be
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .optional(),
  DATABASE_URL: z.url({ protocol: /^postgresql$/ }),
});

const parsed = envSchema.safeParse(process.env);

// fail fast and loud if misconfigured.
if (!parsed.success) {
  console.error(
    "Invalid environemnt configuration: \n" + z.prettifyError(parsed.error),
  );
  console.error("\nCompare .env vs .env.example and errors above.");
  process.exit(1);
}

const env = parsed.data;

export const config = Object.freeze({
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  logLevel:
    env.LOG_LEVEL ??
    (env.NODE_ENV === "test"
      ? "silent"
      : env.NODE_ENV === "development"
        ? "debug"
        : "info"),
  databaseUrl: env.DATABASE_URL,
  isDevelopment: env.NODE_ENV === "development",
  isTest: env.NODE_ENV === "test",
  isProduction: env.NODE_ENV === "production",
});

export type Config = typeof config;
