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
