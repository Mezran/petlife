# Migration workflow

The schema's source of truth is `apps/api/src/db/schema.ts`. The database
never changes except through a generated, reviewed, committed migration.

## The loop

1. Edit `schema.ts` (and keep `.docs/db/schema.sql` + `domain-model.md` honest — per that file's own header, if they ever disagree with an applied migration, the migration is the truth and the docs get updated).
2. `pnpm db:generate --name <what-changed>` — kit diffs `schema.ts` against its snapshots and writes SQL under `apps/api/src/db/migrations/`.
3. **Read the generated SQL.** Every migration is reviewed like code, in the PR diff like everything else. Prettier deliberately ignores the folder — review it, don't reformat it.
4. `pnpm db:migrate` — applies anything the `drizzle.__drizzle_migrations` journal says hasn't run. Idempotent; deploys run the same command.

## The rules

- **Never edit an applied migration.** The journal records it by hash and it already ran somewhere; fixing a mistake means a _new_ migration that moves the schema forward. Editing history breaks every database that already applied it.
- **Unapplied migrations are free.** Wrong SQL that nothing has run yet gets dropped (`drizzle-kit drop`) and regenerated, guilt-free.
- **Migrations and the code that needs them travel in the same PR** — one branch, one review, one merge.
- **Seeds are idempotent** (`ON CONFLICT DO NOTHING` against the unique indexes) and safe to run repeatedly: `pnpm db:seed`.
- Clean slate: `pnpm db:reset && pnpm db:migrate && pnpm db:seed`.
