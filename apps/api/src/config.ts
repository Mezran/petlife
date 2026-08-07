import * as z from "zod";

// describe every env variable and what it should be
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535),
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
  isDevelopment: env.NODE_ENV === "development",
  isTest: env.NODE_ENV === "test",
  isProduction: env.NODE_ENV === "production",
});

export type Config = typeof config;
