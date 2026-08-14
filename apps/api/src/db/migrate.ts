// applies pending migrations then exits.

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { closeDb, db } from "./client.ts";

await migrate(db, { migrationsFolder: "src/db/migrations" });
console.log("Migrations: Up to date");

await closeDb();
