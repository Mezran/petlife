# @petlife/api

Express 5 API for PetLife. TypeScript, ESM, Node 24.

## Run

```bash
pnpm dev    # from the repo root — tsx watch, restarts on save, port 3000
```

Smoke test: `curl http://localhost:3000/api/v1/ping` → `{"status":"ok"}`

## Layout

```
src/
├─ index.ts      # entrypoint — the only file that listens on a port
├─ app.ts        # createApp(): wires middleware and mounts feature routers
├─ api/          # the HTTP surface — one folder per feature/api endpoint, a vertical
│  └─ ping/      # slice each
│     └─ ping.router.ts
├─ db/           # the database boundary — pool + drizzle handle (client.ts),
│                # schema.ts as the TS mirror of .docs/db/schema.sql
└─ middleware/   # shared cross-cutting middleware (not created yet — 2.3
                 # adds it with request-id; errors follow in 2.4)
```

## Conventions

- **Feature modules.** Each feature lives in `src/api/<name>/` and owns its files: `<name>.router.ts` → `<name>.service.ts` → `<name>.repository.ts` — routes and status codes, business rules and row↔wire mapping, drizzle queries. Layers are added when a feature has logic or data that needs them — ping is a router alone, users is a repository alone; pets carries all three plus its request collection in `tests/`.
- **Routing.** A feature exports an Express `Router`; `app.ts` mounts every router under the `/api/v1` prefix. Nothing registers routes anywhere else.
- **app/index split.** `createApp()` builds the whole app without listening, so tests (4.3, Supertest) can exercise real routes without a port. `index.ts` binds the port and nothing more.
- **Body parsing.** `express.json()` is app-level in `createApp()`, before all routers — every route sees `req.body` already parsed.
- **Config.** The port is hard-coded until 2.2's validated config module, which will become the only place that reads `process.env`.

## Configuration

All configuration arrives as environment variables and is validated once, at
boot, by `src/config.ts`. Nothing else in the app reads `process.env`.

- `.env.example` is committed and lists every variable the app needs.
- `.env` is local, git-ignored, and loaded by Node itself (`--env-file-if-exists` in the `dev` script) — there is no dotenv dependency.
- Real environment variables take precedence over `.env` values, so `PORT=4001 pnpm dev` works without editing the file.
- A missing or malformed variable fails the boot with a readable message and exit code 1, rather than surfacing as a confusing runtime bug later.

| Variable       | Required | Default       | Notes                                                                                                                       |
| -------------- | -------- | ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`     | no       | `development` | `development` \| `test` \| `production`                                                                                     |
| `PORT`         | yes      | —             | integer, 1–65535                                                                                                            |
| `LOG_LEVEL`    | no       | by `NODE_ENV` | `fatal`…`silent`; dev→`debug`, test→`silent`, prod→`info`                                                                   |
| `DATABASE_URL` | yes      | —             | `postgresql://user:pass@host:port/db`; feeds the pg pool in `src/db/client.ts` — `/readyz` proves it with a live round-trip |

## Logging

Structured JSON logs via pino; pretty-printed in development, raw JSON in
production. pino-http emits one line per completed request with the request id, status code, and latency.

- Every request carries a correlation id: an inbound `X-Request-Id` is honored, otherwise a UUID is minted; the id is echoed on the response and appears on the request's log line.
- Sensitive fields (`authorization`, `cookie`, `set-cookie` headers) are redacted at the logger, so no call site can leak them — they print as `[Redacted]`.
- The level comes from `config.logLevel`: `LOG_LEVEL` if set, otherwise by environment (development→`debug`, test→`silent`, production→`info`).

## Errors

Every failure — thrown, rejected, or passed to `next(err)` — is rendered by one error middleware as RFC 9457 `application/problem+json`.

- **Operational errors** extend `AppError` (`src/errors.ts`): deliberate status, title, and client-safe detail. Throw them freely; Express 5 forwards async rejections to the error middleware natively.
- **Programmer errors** (anything not an `AppError`) return a fixed 500 problem that reveals nothing; the full error and stack go to the logs at `error` level. Stack traces never appear in responses, in any mode.
- **Zod validation failures** become 400s with a per-field `errors` member.
- **404s** flow through the same pipeline via the `notFound` catch-all.
- Every problem carries `requestId` — quote it from a response, filter the logs by it, and the request's whole story (including any stack) is there.
- **Crash policy** (`src/index.ts`): `uncaughtException` / an `unhandledRejection` outside a handler logs at `fatal` and exits 1 — the supervisor restarts a clean process. Orderly shutdown arrives in 2.5.
- Dev-only routes under `/api/v1/debug` exercise each path end to end; they are not mounted outside development.

## Health & lifecycle

- `GET /readyz` — readiness: should traffic be routed here. `503 {"status":"draining"}` during boot and shutdown; once listening, every poll also pings the database — `{"status":"ready","db":"ok"}`, or `503 {"status":"unready","db":"unreachable"}` when Postgres can't answer. A failing readiness check means "skip me, I'm not dead."
- `GET /readyz` — readiness: should traffic be routed here. `ready` once listening; `503 {"status":"draining"}` during boot and shutdown. A failing readiness check means "skip me, I'm not dead." Gains a DB ping at 3.3.
- Both live at the app root (infra convention) and mount before the logging middleware, so probe heartbeats don't flood the request log.
- **Shutdown** (`src/index.ts`): SIGTERM/SIGINT → readiness flips off → 3s drain window (pollers notice) → `server.close()` waits for in-flight requests → db pool closes → exit 0. A 10s deadline force-exits 1 if something wedges. A second signal kills immediately. Crash policy (2.4) is unchanged: bugs exit 1 with no drain.

## Validation

Every request part a route consumes is parsed against a shared Zod schema before the handler runs — `src/middleware/validate.ts` is the one generic guard:

```ts
router.post("/", validate({ body: petCreateSchema }), handler);
```

- The schemas live in `@petlife/shared` (locked decision: one source of truth for api and web); routes only wire them to the middleware.
- The middleware replaces `req.params` / `req.query` / `req.body` with the parsed result, so handlers see coerced, defaulted, **typed** values. (Express 5 made `req.query` a getter, so the middleware shadows it with an own property.)
- A failed parse throws `ZodError`, which the error middleware (above) renders as a 400 problem with per-field `errors`.
- `GET /api/v1/debug/validate?count=abc` exercises the path end to end in development.

## Testing

Two tiers run under one `pnpm test` (Vitest projects): `packages/shared`'s unit parse tests, and this app's integration suite — real HTTP through `createApp()` via supertest, against a real Postgres.

- **The test database is disposable and automatic.** `src/testing/global-setup.ts` derives `petlife_test` from `DATABASE_URL` (`.env` loaded by Node itself — still no dotenv), creates it if missing, and migrates it to head with the same committed migrations every environment runs. The dev database is never touched.
- **Isolation is truncation:** every table is truncated before each test, and factories (`src/api/pets/tests/pets.factories.ts`) build exactly the rows a test needs. Test files run sequentially against the one test database.
- **Bodies are asserted through the shared schemas** (`petSchema.parse(res.body)`), so every test doubles as a wire-contract check.
- Locally the suite needs the db container up first: `pnpm db:up`. CI provides a `postgres` service container instead — same code path, `DATABASE_URL` supplied by the workflow.

## Local development

```bash
cp .env.example .env                      # then set a real POSTGRES_PASSWORD
pnpm db:up                                # Postgres in Docker, healthchecked
cp apps/api/.env.example apps/api/.env    # then set DATABASE_URL to match
pnpm install
pnpm db:migrate                           # apply committed migrations
pnpm db:seed                              # dev pet types + demo user
pnpm dev                                  # apps/api on :3000
```
