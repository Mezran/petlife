# ADR-000: Locked stack decisions

- **Status:** Accepted
- **Date:** 2026-08-02

## Context

PetLife is a build-to-learn project: the goal is depth in fundamentals, not tool evaluation. To keep every phase focused on learning rather than re-litigating choices, the stack was decided once, up front (2026-07-26), before any code existed. This ADR records those decisions; anything still genuinely open is listed at the bottom with the roadmap topic where it gets decided in its own ADR.

## Decision

| Layer      | Choice                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------- |
| Language   | TypeScript everywhere, `strict` on                                                        |
| Frontend   | React SPA on Vite · TanStack Router + Query · Tailwind v4 · Base UI (headless components) |
| Backend    | Node (current LTS) · Express 5 · Zod at every boundary · pino                             |
| Auth       | BetterAuth, cookie sessions                                                               |
| Database   | PostgreSQL (latest stable)                                                                |
| Contracts  | Shared Zod schemas in `packages/shared` — single source of truth for client and server    |
| Testing    | Vitest · Testing Library · MSW · Supertest · Playwright                                   |
| Repo       | pnpm workspaces monorepo on GitHub, trunk-based with short-lived branches                 |
| Delivery   | Docker + Compose · GitHub Actions CI/CD · images on GHCR                                  |
| Production | Single VPS behind a TLS reverse proxy                                                     |

## Consequences

- Every later topic builds on these choices without re-opening them; learning time goes to fundamentals instead of comparison shopping.
- Changing any locked row requires a new ADR that supersedes this one — cheap to do, deliberately visible.
- Still open, each decided at its roadmap topic with its own ADR: data access layer (ADR-001, topic 3.3 — leading: Drizzle), custom-fields data model (7.1), form library (6.6), reverse proxy (10.2), log aggregation (11.1), error tracking (11.3).
