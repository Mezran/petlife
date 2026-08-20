# @petlife/web

React SPA for PetLife. Vite 8, React 19, Tailwind CSS v4, Base UI. TypeScript, ESM.

## Run

```bash
pnpm dev:web   # from the repo root — Vite dev server on :5173
```

Anything under `/api` needs the api running too (`pnpm dev`) — the dev server proxies `/api/*` to `http://localhost:3000` so the browser sees one origin.

Smoke test: `curl http://localhost:5173/api/v1/ping` → `{"status":"ok"}`

## Layout

```
index.html        # the real entry — Vite serves and bundles from here
vite.config.ts    # plugins (React, Tailwind) + the /api dev proxy
src/
├─ main.tsx       # boots React into #root (and imports index.css)
├─ index.css      # Tailwind entry: @theme design tokens + base styles
└─ App.tsx        # app shell: header / nav / content
```

## Conventions

- **Same-origin dev.** The browser talks only to :5173; the dev proxy forwards `/api/*` to the api and rewrites the `Origin` header so BetterAuth sees its own baseURL. Production gets the same shape from the reverse proxy (Phase 10) — no CORS configuration anywhere.
- **Design tokens live in CSS.** Tailwind v4 is configured in `src/index.css`: `@theme` tokens generate the `brand-*`, `gutter` and `display` utilities. There is no `tailwind.config.js`.
- **Base UI for behavior, Tailwind for looks.** Headless components own semantics and accessibility; every visual decision is utility classes bound to tokens.
- **Structure arrives with the router.** The shell is one file today; 6.2's file-based routes will own the `src/` layout, so no premature folders.
