import { sql } from "drizzle-orm";

import {
  check,
  date,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// mirror from .docs/db/schema.sql
// TABLE: Users
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

// Table: pet_types
export const petTypes = pgTable(
  "pet_types",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),

    name: text("name").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("pet_types_name_lower_ux").on(sql`lower(${table.name})`),
    check("pet_types_name_not_blank_ck", sql`btrim(${table.name}) <> ''`),
  ],
);

// Table: pets
export const pets = pgTable(
  "pets",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),

    petTypeId: uuid("pet_type_id").notNull(),

    name: text("name").notNull(),
    sex: text("sex").notNull().default("unknown"),

    dateOfBirth: date("date_of_birth"),
    adoptionDate: date("adoption_date"),

    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "pets_pet_type_id_fkey",
      columns: [table.petTypeId],
      foreignColumns: [petTypes.id],
    }).onDelete("restrict"),
    index("pets_pet_type_id_idx").on(table.petTypeId),
    check("pets_name_not_blank_ck", sql`btrim(${table.name}) <> ''`),
    check("pets_sex_ck", sql`${table.sex} IN ('male', 'female', 'unknown')`),
    check(
      "pets_dob_or_adoption_ck",
      sql`num_nonnulls(${table.dateOfBirth}, ${table.adoptionDate}) >= 1`,
    ),
  ],
);
