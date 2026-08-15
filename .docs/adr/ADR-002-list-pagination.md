# ADR-002: List pagination

- **Status:** Accepted
- **Date:** 2026-08-14

## Context

4.1 defines the pagination contract every list endpoint will use (pets first, at 4.2), and the roadmap makes the offset-vs-cursor call here.

Offset (`page`/`pageSize` → `LIMIT/OFFSET` plus a `COUNT`) gives page numbers a UI can render, jump-to-any-page, and trivially debuggable SQL; its known weaknesses are row drift when writes land between page fetches and `COUNT` cost on large tables. Cursor (keyset: an opaque token encoding the last row's sort key, `WHERE (created_at, id) < (...)`) stays stable under concurrent writes and skips the `COUNT`, which is why large-scale and infinite-scroll APIs prefer it — at the price of cursor encode/decode, a mandatory tie-breaker ordering, and no random page access.

## Decision

Offset pagination: `page` / `pageSize` query parameters (coerced, defaulted, and capped in `packages/shared`), and a `{ items, page, pageSize, totalItems, totalPages }` envelope. PetLife lists are per-user and small — tens of pets, not millions of rows — the wireframes show a sidebar list rather than an infinite feed, and page numbers keep both the SQL and the UI simple. The envelope builder is generic (`paginated(itemSchema)`) so any future list reuses it.

## Consequences

- 4.2 implements list queries as `LIMIT/OFFSET` plus `COUNT(*)`, ordered by a stable key so pages don't shuffle.
- Offset's weaknesses are accepted as irrelevant at this scale. Revisiting means a superseding ADR that swaps the envelope for a cursor one — a breaking wire-contract change, so it would ride an API version bump.
- The web list UI (6.5) gets page-number pagination for free; a move to infinite scroll would be the trigger to reopen this.
