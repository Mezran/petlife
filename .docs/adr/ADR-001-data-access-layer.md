# ADR-001: Data access layer

- **Status:** Accepted
- **Date:** 2026-08-12

## Context

The api needs a data access layer between Express and Postgres. ADR-000 left this open (leading: Drizzle); topic 3.3 decides it. Four candidates were compared against what this project actually optimizes for — learning fundamentals with strict TypeScript, SQL staying visible (3.2 hand-modeled the schema in DDL on purpose), a migration workflow where generated SQL is reviewed like code (3.4), and Zod at every boundary (4.1).

|                      | node-postgres (raw)        | Kysely                               | Drizzle                                           | Prisma                                                                       |
| -------------------- | -------------------------- | ------------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| Current release      | pg 8.23                    | 0.29                                 | 0.45 (1.0 in rc)                                  | 7.9                                                                          |
| Model                | driver + hand-written SQL  | typed SQL query builder              | typed SQL-first ORM over the pg driver            | full ORM, schema in its own DSL, generated client                            |
| Types come from      | you (or codegen)           | interfaces you maintain (or codegen) | tables declared in TS, types inferred             | generated from `.prisma` schema                                              |
| SQL visibility       | total                      | high — queries mirror SQL            | high — queries mirror SQL, raw `sql` escape hatch | low — query API, SQL behind a compiler                                       |
| Migrations (3.4)     | hand-rolled or third-party | third-party                          | drizzle-kit generate → review → apply             | prisma migrate                                                               |
| Zod derivation (4.1) | manual                     | manual                               | drizzle-zod (first-party)                         | third-party generators                                                       |
| Weight               | none                       | zero-dep library                     | zero-dep library over `pg`                        | generate step + driver adapters (Rust engine gone since 6.16 / default in 7) |

Raw `pg` maximizes SQL learning but leaves every row untyped at the boundary and migrations entirely hand-rolled — more discipline than this solo project wants to spend. Kysely is an excellent typed query builder, but table types are maintained (or code-generated) separately from the database, and migrations need third-party tooling. Prisma is polished and the v7 TypeScript-compiler architecture removed its old binary-engine weight, but it moves the schema into its own DSL and hides SQL behind a query API — the opposite of this project's "feel the SQL" goal. Drizzle declares tables in TypeScript (one readable mirror of the DDL committed at 3.2), infers row types from them, keeps queries close to SQL with a raw escape hatch, generates reviewable SQL migrations with drizzle-kit, and derives Zod schemas with first-party drizzle-zod.

## Decision

Drizzle, on the node-postgres (`pg`) driver: `drizzle-orm` wraps a single `pg.Pool`, the schema lives in `apps/api/src/db/schema.ts` mirroring `.docs/db/schema.sql`, repositories are plain modules using the inferred types, and drizzle-kit becomes the migration tool at 3.4. Pinned at the current stable 0.45 line — the 1.0 release candidates are watched, not adopted.

## Consequences

- 3.4 uses drizzle-kit's generate → review → apply workflow; the hand-written DDL from 3.2 becomes the review baseline for the generated SQL.
- 4.1 can derive Zod schemas from the table definitions via drizzle-zod instead of writing them twice.
- The pool is Drizzle's underlying client, so connection lifecycle (readiness ping, graceful close) stays plain `pg` — no vendor lock at the connection layer.
- Drizzle 1.0 will land eventually; adopting it is a minor-version chore (watch the changelog), not a re-decision. Replacing Drizzle itself would supersede this ADR.
