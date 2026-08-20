# ADR-004: Object-level authorization response

- **Status:** Accepted
- **Date:** 2026-08-20

## Context

5.3 scopes every pets query by owner, which forces a choice: when an authenticated user requests another user's pet by id, answer `403 Forbidden` (honest, but confirms the resource exists) or `404 Not Found` (hides existence entirely). Broken object-level authorization (BOLA/IDOR) sits at the top of the OWASP API Security Top 10, and the response-code choice decides what an attacker probing ids can learn.

Existence is itself information. The uuidv7 keys chosen in 3.2 defeat _enumeration_, but ids still leak — logs, shared links, referer headers, neighboring API responses — and an attacker holding a leaked id who receives a `403` learns the object is real and worth pursuing. Distinct response codes turn the API into an oracle that maps which ids are live; a uniform answer teaches nothing. RFC 9110 explicitly permits the concealment: a server that wishes to hide the existence of a forbidden resource may respond `404` instead. GitHub's API is the well-known practitioner, answering `404` for private repositories precisely so their existence is never confirmed.

## Decision

`404 Not Found`. A pet that isn't yours and a pet that doesn't exist must be indistinguishable — same status, same problem shape, same message. PetLife's data model makes this the coherent choice, not just the safe one: every pet is privately owned and there is no legitimate cross-user visibility anywhere in the MVP, so there is no user for whom "it exists, ask for access" would ever be useful information — honesty about existence would serve only probers. The owner-scoped repository queries implement the decision structurally rather than procedurally: a foreign pet is simply never found, no unscoped existence check runs anywhere, and the ordinary `NotFoundError` path serves both cases identically. The status vocabulary on pets is therefore: `401` — no valid session; `404` — wrong id _or_ wrong owner, deliberately indistinguishable; `403` — unused, reserved.

## Consequences

- The same `NotFoundError` path and message serve both cases, and the ownership tests assert the cross-user response equals the phantom-id response — the distinction cannot leak by accident, because there is no code path that knows it.
- `403` stays meaningful by its absence: its appearance on pets would signal a new authorization model (roles, sharing, partial visibility) and a revisit of this ADR.
- The two-users integration tests and 12.1's security checklist verify against this decision; any endpoint added to pets later inherits the obligation to answer `404`, not `403`, for foreign objects.
- Household sharing (parking lot) is the named trigger to reopen this: shared pets create legitimate "visible but not editable" states, where a blanket `404` stops being coherent and a scoped `403` earns its place.
