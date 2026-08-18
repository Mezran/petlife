import { sql } from "drizzle-orm";

import {
  boolean,
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

    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),

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

// Table: sessions
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),

    userId: uuid("user_id").notNull(),

    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "sessions_user_id_fkey",
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    uniqueIndex("sessions_token_ux").on(table.token),
    index("sessions_user_id_idx").on(table.userId),
  ],
);

// Table: accounts
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),

    userId: uuid("user_id").notNull(),

    // 1.7.0 splits "which provider" (issuer) from the provider-side account
    // id; email+password rows carry the "credential" marker
    issuer: text("issuer").notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),

    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),

    password: text("password"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "accounts_user_id_fkey",
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    uniqueIndex("accounts_issuer_account_id_ux").on(
      table.issuer,
      table.accountId,
    ),
    index("accounts_user_id_idx").on(table.userId),
  ],
);

// Table: verifications
export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),

    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);
