import { sql } from "drizzle-orm";

import {
  check,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// mirror from .docs/db/schema.sql
export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),

    name: text("name").notNull(),
    email: text("email").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_lower_ux").on(sql`lower(${table.email})`),
    check("users_name_not_blank_ck", sql`btrim(${table.name}) <> ''`),
    check("users_email_not_blank_ck", sql`btrim(${table.email}) <> ''`),
  ],
);
