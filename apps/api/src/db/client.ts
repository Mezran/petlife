import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";

import { config } from "../config.ts";
import { logger } from "../logger.ts";

// one pool per process, 10 clients and 10s timeout
const pool = new Pool({ connectionString: config.databaseUrl });

// on error
pool.on("error", (err) => {
  logger.error({ err }, "idle postgres client error");
});

// handler every query goes through
export const db = drizzle({ client: pool });

// lifecycles
export const pingDb = async (): Promise<void> => {
  await db.execute(sql`select 1`);
};

export const closeDb = async (): Promise<void> => {
  await pool.end();
};
