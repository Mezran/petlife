import { sql } from "drizzle-orm";
import { afterAll, beforeEach } from "vitest";

import { closeDb, db } from "../db/client.ts";

// Truncation isolation (the 4.3 decision): every test starts from empty
// tables and builds exactly the rows it needs via factories. TRUNCATE works
// across connections, so the app's own pool needs no special handling.
beforeEach(async () => {
  await db.execute(
    sql`TRUNCATE TABLE pets, users, pet_types RESTART IDENTITY CASCADE`,
  );
});

// every test file gets a fresh module registry — and so a fresh pool; close
// it or vitest hangs on the open handle
afterAll(async () => {
  await closeDb();
});
