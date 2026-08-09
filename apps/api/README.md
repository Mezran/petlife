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
└─ middleware/   # shared cross-cutting middleware (not created yet — 2.3
                 # adds it with request-id; errors follow in 2.4)
```

## Conventions

- **Feature modules.** Each feature lives in `src/api/<name>/` and owns its files: `<name>.router.ts` → `<name>.controller.ts` → `<name>.service.ts`. Layers are added when a feature has logic or data that needs them — ping is a router alone; pets (Phase 4) will carry all three.
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

| Variable    | Required | Default       | Notes                                                     |
| ----------- | -------- | ------------- | --------------------------------------------------------- |
| `NODE_ENV`  | no       | `development` | `development` \| `test` \| `production`                   |
| `PORT`      | yes      | —             | integer, 1–65535                                          |
| `LOG_LEVEL` | no       | by `NODE_ENV` | `fatal`…`silent`; dev→`debug`, test→`silent`, prod→`info` |

## Logging

Structured JSON logs via pino; pretty-printed in development, raw JSON in
production. pino-http emits one line per completed request with the request id, status code, and latency.

- Every request carries a correlation id: an inbound `X-Request-Id` is honored, otherwise a UUID is minted; the id is echoed on the response and appears on the request's log line.
- Sensitive fields (`authorization`, `cookie`, `set-cookie` headers) are redacted at the logger, so no call site can leak them — they print as `[Redacted]`.
- The level comes from `config.logLevel`: `LOG_LEVEL` if set, otherwise by environment (development→`debug`, test→`silent`, production→`info`).
