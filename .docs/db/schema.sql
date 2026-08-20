-- =============================================================================
-- PetLife core domain — annotated reference DDL (topic 3.2)
-- =============================================================================
--
-- This is the hand-written model of the core domain, documentation first:
-- 3.3 chooses the data-access layer and 3.4 turns this model into the real,
-- tool-generated baseline migration. Never apply this file to the `petlife`
-- database itself — run it against a throwaway scratch database to feel the
-- shapes, then drop the scratch (the exact commands live in the build guide
-- and in domain-model.md next door).
--
-- Conventions in force (argued in domain-model.md): tables plural snake_case;
-- every primary key is `id uuid DEFAULT uuidv7()` (native in PostgreSQL 18);
-- foreign keys are `<singular>_id`; instants are timestamptz, calendar facts
-- are date; explicit names on CHECK constraints (`_ck`) and unique indexes
-- (`_ux`) so violations read well and future migrations can target them.

-- -----------------------------------------------------------------------------
-- users — the account holders.
--
-- Deliberately the minimal shape we are certain of. BetterAuth arrives in
-- Phase 5 with its own tables (session, account, verification) and its own
-- extra user columns (emailVerified, image); 5.2 decides whether it maps onto
-- this table or supersedes it. Two things are non-negotiable now: credentials
-- NEVER live here (BetterAuth keeps password hashes in its `account` table),
-- and pets will point at this table via owner_id starting 5.3.
-- -----------------------------------------------------------------------------

CREATE TABLE users (
  -- uuidv7(): time-ordered UUIDs — v4's non-guessability without v4's
  -- random-insert index bloat, because new keys land near each other in the
  -- B-tree. Core in Postgres 18, no extension.
  id uuid PRIMARY KEY DEFAULT uuidv7(),

  -- NOT NULL guards absence; the CHECK guards presence-but-blank. Two
  -- different failure modes, two different constraints.
  name text NOT NULL
    CONSTRAINT users_name_not_blank_ck CHECK (btrim(name) <> ''),

  -- Plain text, not citext: the case-insensitivity email needs is one
  -- functional index (below), not an extension dependency.
  email text NOT NULL
    CONSTRAINT users_email_not_blank_ck CHECK (btrim(email) <> ''),

  created_at timestamptz NOT NULL DEFAULT now(),

  -- Maintained by the application layer once 3.3 wires the data-access
  -- tool; a DB trigger is the alternative, deliberately not taken (one less
  -- moving part — revisit only if non-app writers ever touch the DB).
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Taylor@example.com and taylor@example.com are the same account. A plain
-- UNIQUE on email would happily admit both; unique on lower(email) won't.
-- (Format validation is Zod's job at the boundary — the DB owns integrity,
-- not syntax.)
CREATE UNIQUE INDEX users_email_lower_ux ON users (lower(email));

-- -----------------------------------------------------------------------------
-- pet_types — the curated catalog (dog, cat, turtle, ...). Seeded in 3.4,
-- never user-created in the MVP. Phase 7 hangs field_definitions off this
-- table to describe each type's custom fields.
-- -----------------------------------------------------------------------------

CREATE TABLE pet_types (
  id uuid PRIMARY KEY DEFAULT uuidv7(),

  name text NOT NULL
    CONSTRAINT pet_types_name_not_blank_ck CHECK (btrim(name) <> ''),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- "Dog" and "dog" are the same type; a seed-script bug must not create both.
CREATE UNIQUE INDEX pet_types_name_lower_ux ON pet_types (lower(name));

-- -----------------------------------------------------------------------------
-- pets — the heart of the domain. Standard fields only, on purpose:
-- custom_values (JSONB, the per-type dynamic fields) is Phase 7's move, and
-- owner_id (uuid NOT NULL REFERENCES users ON DELETE CASCADE, plus its index)
-- is 5.3's — modeled in the diagram, absent here, so Phase 4 can build CRUD
-- before login exists.
-- -----------------------------------------------------------------------------

CREATE TABLE pets (
  id uuid PRIMARY KEY DEFAULT uuidv7(),

  -- 5.3: ownership. The promised contrast to RESTRICT below — pets are owned
  -- children, so deleting an account takes its pets with it.
  owner_id uuid NOT NULL
    CONSTRAINT pets_owner_id_fkey
      REFERENCES users (id) ON DELETE CASCADE,

  -- RESTRICT, not CASCADE: deleting a catalog row must never vaporize pets —
  -- Postgres refuses while any pet still points at it. (CASCADE is for owned
  -- children, which is exactly what owner_id will be in 5.3; SET NULL would
  -- leave typeless pets, which the domain doesn't allow.)
  pet_type_id uuid NOT NULL
    CONSTRAINT pets_pet_type_id_fkey
      REFERENCES pet_types (id) ON DELETE RESTRICT,

  name text NOT NULL
    CONSTRAINT pets_name_not_blank_ck CHECK (btrim(name) <> ''),

  -- Closed, low-cardinality set: text + CHECK rather than a native enum
  -- (ALTER TYPE churn every time the list moves) or a lookup table (nothing
  -- else to store about a sex). Extending it later is one cheap
  -- drop-and-re-add of the constraint.
  sex text NOT NULL DEFAULT 'unknown'
    CONSTRAINT pets_sex_ck CHECK (sex IN ('male', 'female', 'unknown')),

  -- date, not timestamptz: a birthday is a calendar fact — it has no
  -- time-of-day and no time zone.
  date_of_birth date,
  adoption_date date,

  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- The MVP story says "date of birth OR adoption date". Inclusive or — a
  -- rescue with a known birthday legitimately has both — but never neither.
  CONSTRAINT pets_dob_or_adoption_ck
    CHECK (num_nonnulls(date_of_birth, adoption_date) >= 1)

  -- Deliberately NO "dates not in the future" CHECK: CURRENT_DATE is not
  -- immutable, so a row that was legal at insert time could fail a future
  -- dump/restore. Time-relative rules belong to the Zod boundary (4.1).
);

-- Postgres auto-indexes only the *referenced* side of an FK (the PK it
-- points at), never the referencing column. This index serves "every pet of
-- type X" and keeps ON DELETE RESTRICT from scanning pets to find pointers.
CREATE INDEX pets_pet_type_id_idx ON pets (pet_type_id);

-- The hot path from 5.3 on: every pets query is owner-scoped.
CREATE INDEX pets_owner_id_idx ON pets (owner_id);