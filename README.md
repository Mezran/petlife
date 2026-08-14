# PetLife

A one place for every pet's important details: From the basics all pets share to fields specific to a pets type (dog's breed, a turtle's shell, etc).

Build-to-learn project: one small, well-made web app taken from an empty folder to a monitored production system.

**Status:** Phase 0 — product & workspace. No runnable code yet.

## Stack

TypeScript everywhere (strict). React SPA on Vite with TanStack Router + Query, Tailwind v4, Base UI. Node LTS with Express 5, Zod at every boundary, pino. BetterAuth cookie sessions. PostgreSQL. pnpm workspaces monorepo. Vitest / Testing Library / MSW / Supertest / Playwright. Docker + Compose, GitHub Actions CI/CD, deployed to a single VPS. The full rationale lives in [ADR-000](docs/adr/ADR-000-locked-stack-decisions.md).

## Conventions

- **Commits** follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
- **Branching** is trunk-based: short-lived branches off `main`, one PR per roadmap topic, `main` is always releasable.
- **Decisions** are recorded as ADRs in [docs/adr/](docs/adr/).

## Local development

```bash
cp .env.example .env                      # then set a real POSTGRES_PASSWORD
cp apps/api/.env.example apps/api/.env    # then set DATABASE_URL to match
pnpm install
pnpm db:up                                # Postgres in Docker, healthchecked
pnpm db:migrate                           # apply committed migrations
pnpm db:seed                              # dev pet types + demo user (idempotent)
pnpm dev                                  # apps/api on :3000
```

`pnpm db:down` stops the database container (data persists in its named volume). `pnpm db:reset` tears it down _with_ the volume — after a reset, run `pnpm db:migrate && pnpm db:seed` again for a clean, seeded slate.
