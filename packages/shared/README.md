# @petlife/shared

The wire contracts: Zod schemas plus their inferred types for everything that crosses the HTTP boundary, imported by both the api (request validation, 4.1+) and the web app (response parsing and forms, Phase 6). Single source of truth — the locked contracts decision from ADR-000.

## Rules

- **Schemas describe the JSON wire, not database rows.** `timestamptz` columns travel as ISO strings here; mapping row ↔ wire is the api's job. That's also why these are hand-written rather than drizzle-zod-derived — deriving would tie the contract to the row shape, and `shared` can't import the api's tables without a workspace cycle.
- **Dependencies: zod. Nothing else.** No express, no drizzle — the web app typechecks everything in here.
- One module per concern; tests co-located (`x.schema.ts` + `x.schema.test.ts`); everything re-exports through `src/index.ts`, and consumers import only from `@petlife/shared`.

## Layout

```
src/
├─ index.ts                 # the public surface — everything exports through here
├─ problem.schema.ts        # RFC 9457 problem+json error contract
├─ pagination.schema.ts     # page/pageSize query + paginated() envelope (ADR-002)
└─ pets/
   └─ pets.schema.ts        # pet entity, PetCreate/PetUpdate DTOs, id params, list
```

## Adding a schema

1. Write the schema and its `z.infer` types in a feature module (new folder for a new resource).
2. Co-locate parse tests beside it — good and bad fixtures both.
3. Re-export from `src/index.ts`.
