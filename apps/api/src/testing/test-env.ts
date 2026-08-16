import { fileURLToPath } from "node:url";

// Everything test-related resolves its database through here: load the
// api's .env the way the app itself does (Node, no dotenv), then derive the
// dedicated test database's url by swapping the database name — tests must
// never touch the dev database.

const TEST_DB_NAME = "petlife_test";

const envFile = fileURLToPath(new URL("../../.env", import.meta.url));
try {
  process.loadEnvFile(envFile);
} catch {
  // no .env here (CI) — DATABASE_URL comes from the workflow environment
}

const base = process.env.DATABASE_URL;
if (base === undefined) {
  throw new Error(
    "DATABASE_URL is not set — create apps/api/.env, or export it (CI does).",
  );
}

const testUrl = new URL(base);
testUrl.pathname = `/${TEST_DB_NAME}`;

// CREATE DATABASE must run from some other, existing database — the
// maintenance db `postgres` is always there
const adminUrl = new URL(base);
adminUrl.pathname = "/postgres";

export const testDbName = TEST_DB_NAME;
export const testDatabaseUrl = testUrl.toString();
export const adminDatabaseUrl = adminUrl.toString();
