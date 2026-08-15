// dev seeds: idempotent by construction — safe to run any number of times.
// Run via `pnpm db:seed`.
import { closeDb, db } from "./client.ts";
import { petTypes, users } from "./schema.ts";

await db
  .insert(petTypes)
  .values([{ name: "dog" }, { name: "cat" }, { name: "turtle" }])
  .onConflictDoNothing();

await db
  .insert(users)
  .values({ name: "Demo User", email: "demo@petlife.dev" })
  .onConflictDoNothing();

const typeRows = await db.select().from(petTypes);
const userRows = await db.select().from(users);
console.log(
  `seeded — pet_types: ${String(typeRows.length)}, users: ${String(userRows.length)}`,
);
// pet type ids on every run — the request collection needs one
for (const t of typeRows) {
  console.log(`  ${t.name}: ${t.id}`);
}

await closeDb();
