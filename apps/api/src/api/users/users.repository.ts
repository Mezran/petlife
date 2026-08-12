import { eq, sql } from "drizzle-orm";

import { db } from "../../db/client.ts";
import { users } from "../../db/schema.ts";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// section: writes

export const createUser = async (data: NewUser): Promise<User> => {
  const rows = await db.insert(users).values(data).returning();
  const row = rows.at(0);
  if (row === undefined) {
    throw new Error("insert into users returned no row");
  }
  return row;
};

// section: reads

export const findUserById = async (id: string): Promise<User | undefined> => {
  const rows = await db.select().from(users).where(eq(users.id, id));
  return rows.at(0);
};

export const findUserByEmail = async (
  email: string,
): Promise<User | undefined> => {
  // lower() on both sides rides the users_email_lower_ux expression index
  const rows = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email})`);
  return rows.at(0);
};
