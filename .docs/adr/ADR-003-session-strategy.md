# ADR-003: Session strategy

- **Status:** Accepted
- **Date:** 2026-08-18

## Context

ADR-000 locks the auth layer as "BetterAuth, cookie sessions" but records no reasoning; topic 5.1 is where the roadmap makes that argument explicit, before 5.2 wires the library in. This ADR elaborates ADR-000's Auth row — it does not supersede it.

The two mainstream models split on where session state lives: server-side sessions keep it in the database behind an opaque cookie ID, while JWTs sign the state into a self-contained token the server can verify without a lookup. The JWT model's promise is statelessness and horizontal scale; its price is revocation, and the debate between them is real enough that choosing without arguing would just be fashion.

## Decision

Cookie sessions via BetterAuth. PetLife is one SPA and one API on one origin by design (dev proxy now, Caddy path-routing in production) — there is no second party to hand claims to, which is the job JWTs exist for. Every session operation the product actually needs — logout, logout-everywhere, killing a suspected-stolen session — is a row delete in the session table, immediate and complete; the same operations under JWTs require a per-request denylist that reintroduces the state JWTs promise to remove. The avoided cost is one indexed lookup per authenticated request, which is nothing at this scale — ADR-002 already accepted a COUNT(*) per list page on identical reasoning. A native mobile client, third-party API consumers, or service-to-service calls would each be a genuine two-party scenario; none exist in the MVP.

## Consequences

- Sessions live in Postgres: every authenticated request costs one indexed read, and instant revocation comes free (BetterAuth ships revokeSession / revokeOtherSessions / revokeSessions).
- Cookies put CSRF in scope: the cookie flags and layered CSRF stance in the PetLife auth decisions note become deliberate 5.2 configuration, not afterthoughts.
- Same-origin stays a design commitment — the dev proxy (6.1) and Caddy path-routing (10.2) are now security posture, not just convenience.
- A future non-browser client or third-party API consumer is the trigger to reopen this ADR; until then, "should we use JWTs" is settled.
