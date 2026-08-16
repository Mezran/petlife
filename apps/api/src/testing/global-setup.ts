import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { adminDatabaseUrl, testDatabaseUrl, testDbName } from "./test-env.ts";

// Runs once per suite: make sure the test database exists, then bring its
// schema to head with the exact migrations every other environment runs.
export default async (): Promise<void> => {
  const admin = new Pool({ connectionString: adminDatabaseUrl, max: 1 });
  const existing = await admin.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [testDbName],
  );
  if (existing.rowCount === 0) {
    // identifiers can't be parameterized; testDbName is our constant
    await admin.query(`CREATE DATABASE ${testDbName}`);
  }
  await admin.end();

  const pool = new Pool({ connectionString: testDatabaseUrl, max: 1 });
  await migrate(drizzle({ client: pool }), {
    migrationsFolder: fileURLToPath(
      new URL("../db/migrations", import.meta.url),
    ),
  });
  await pool.end();
};
