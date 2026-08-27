# Ticketty Project State

_Last verified: 2026-08-27T12:48:17+02:00_

## Executive status

- Overall evidence-based completion: **71% (functional, not production-ready)**.
- Production-readiness controls: **83% — still NO-GO for real passenger or financial data until finance, RLS, browser-test, and production-like operational release gates close**.
- Strategy: preserve the working vertical slice and harden it incrementally; do not rewrite from scratch.
- Repository branch: `master`; repository currently has no commits and all project files are untracked.

## Current architecture

- `backend/`: NestJS 11 modular monolith, Prisma 6, PostgreSQL.
- `web/`: Next.js 16 App Router, React 19, TypeScript, Tailwind, TanStack Query, Arabic RTL.
- Authentication: JWT at backend; Web BFF keeps the credential in an HttpOnly cookie.
- Domain code is module-oriented but mostly controller/service/Prisma rather than the target application/domain/infrastructure layering.

## Implemented domains

Organizations/branches, users/roles, customers, routes, buses/seat templates, drivers, trips/trip seats, bookings, payments/refunds, tickets/boarding, manifests, agents/commissions, expenses/adjustments, settlements, reports, and audit logging have partial implementations.

Accounting ledger, fiscal periods, journal posting, outbox/workers, robust offline sync, provider payment integration, server-side documents, and production operations are not implemented in the active schema/runtime.

## Current critical risks

1. Composite tenant foreign keys cover the core transactional graph, and database triggers now reject branch/organization mismatches across all branch-owned tables; runtime RLS remains absent.
2. Booking, cancellation, trip cancellation, and manifest lock now share a per-trip transaction lock, but persisted refund-command idempotency and real two-connection concurrency proof remain missing.
3. Refund inserts now lock and atomically update the payment with database-enforced amount/tenant/booking bounds; two-connection end-to-end cancellation proof remains missing.
4. External-agent ownership is enforced and the AGENT role now uses explicit `.own` permissions across booking, ticket, payment, agent, and settlement operations; broader endpoint authorization matrices remain.
5. Settlement service now excludes reversals, rejects overlapping periods, serializes generation, and prevents rewriting settled records; immutable line allocation and database uniqueness remain missing.
6. Active runtime schema lacks double-entry accounting.
7. Critical integration/concurrency/security test coverage is very low.
8. CI, container definitions, health probes, request-correlation logs, and backup/restore tooling exist; a local scratch restore drill passed, while hosted metrics/alerts and a production-like restore drill remain missing.

## Changes in this cycle

- Closed the organization-less tenant fail-open path at login, JWT request revalidation, and ticket queries.
- Added unit regression coverage for organization-less login and ticket list, ID, and QR tenant/branch scoping.
- Created the persistent engineering memory under `docs/engineering/`.
- Added transactional tenant/branch validation for Bus→SeatTemplate, Expense→Trip/Bus, and Agent→User writes.
- Enforced server-side seat eligibility: only REGULAR/VIP seats can be held or booked; newly materialized non-sellable trip seats start BLOCKED.
- Added regression tests for the protected relation and seat paths.
- Added one shared PostgreSQL transaction lock across booking creation, booking cancellation, trip cancellation, and manifest locking; branch-scoped idempotency replay was also closed.
- Hardened manifest locking against repeat and terminal-trip transitions.
- Hardened settlements against reversed commissions, invalid/overlapping periods, concurrent generation, regeneration after settlement, and repeated finalization.
- Added and locally applied a persisted idempotency-record schema with endpoint/key uniqueness, request hashes, status, response metadata, resource linkage, and expiry.
- Added reusable validated idempotency primitives and wired them into booking/trip cancellation endpoints.
- Cancellation retries now validate endpoint/key/request hash, return the persisted resource safely, and avoid duplicate refund/audit execution.
- Added PostgreSQL refund-integrity checks and a trigger that locks the payment, validates tenant/booking ownership, rejects cumulative over-refunds, and atomically maintains payment refund totals/status.
- Added a rollback-safe SQL contract test proving valid updates and rejection of excessive/cross-tenant refunds.
- Added a real two-Prisma-client PostgreSQL contention test proving one of two cumulative over-refunds is rejected.
- Expired idempotency keys are transactionally replaced under an operation-scoped advisory lock.
- Added a real service-level race test between booking and trip cancellation; it exposed that Prisma cannot deserialize PostgreSQL advisory-lock `void` results, so all lock calls were corrected from `$queryRaw` to `$executeRaw` and the race now passes.
- Added composite tenant-consistency foreign keys and a rollback-safe database contract test.
- Added fail-closed external-agent ownership scoping across bookings, tickets, payments, agent data, commissions, and settlements.
- Added a real PostgreSQL cross-agent integration test proving one external agent cannot list or directly retrieve another agent's operational/financial records.
- Replaced implicit role-name ownership detection with explicit `.own` permission semantics and migrated existing AGENT role permissions.
- Expanded tenant-consistent composite foreign keys across the core transactional graph and extended the SQL tenant contract.
- Added database settlement invariants for unique periods, date ordering, nonnegative/balanced totals, and immutable finalized records.
- Fixed a trigger bug discovered by E2E cleanup: BEFORE DELETE must return OLD rather than NEW.
- Added migration preflight validation and runtime triggers enforcing branch-to-organization consistency for users, customers, routes, buses, drivers, trips, bookings, payments, agents, expenses, and audit logs.
- Added immutable SettlementLine allocation: each commission can belong to only one settlement, tenant consistency is enforced, and lines cannot change after finalization.
- Added public liveness and database-backed readiness endpoints with safe failure responses and unit/E2E coverage.
- Added CI gates for backend/web quality, PostgreSQL E2E and SQL contracts, dependency audits, and image builds.
- Added fail-fast environment validation and explicit JWT algorithm, issuer, and audience enforcement.
- Added request correlation and structured HTTP completion logging.
- Added reproducible backend/web container definitions, a one-shot migration Compose stack, web health routes, and graceful shutdown.
- Added executable PostgreSQL backup/restore tooling and operator runbooks.
- Resolved the known High `deepmerge-ts` advisory with a tested pnpm override.
- Centralized validated web server configuration and removed inconsistent API defaults.
- Hardened BFF mutation origin checks, upstream timeouts, proxy response handling, JWT-aligned cookie expiry, and request-ID propagation.
- Established the first Web test baseline with 2 suites / 7 security and configuration helper tests.
- Added bounded trusted-proxy configuration and restricted report queries to validated date-only ranges of at most 366 days.
- Added validated bounded pagination to all top-level operational and reference lists and replaced agent lifetime relation loading with page-scoped database aggregates.
- Added CSP, HSTS in production, and cross-domain policy response headers to the Web application.
- Added automated permission metadata coverage for every business endpoint and enforced role-assignment grant ceilings.
- Added a stable sanitized API error envelope with request IDs and safe Prisma mappings.
- Added persistent failed-login counting and a 15-minute database-backed account lockout after five failures.
- Fixed backup/restore handling for Prisma-style `?schema=` URLs and completed an isolated PostgreSQL restore drill with all database integrity contracts passing.

## Last validated commands

- `backend: pnpm test --runInBand` — passed: 21 suites, 83 tests, including login lockout, pagination, grant ceilings, error mapping, guard behavior, and explicit permission metadata coverage for every business route.
- `backend: pnpm test:e2e --runInBand` — passed: 3 suites, 9 tests, including production-equivalent health/bootstrap, stable error envelopes, refund contention, booking-cancel versus trip-cancel, and cross-agent isolation.
- Backend refund, tenant-consistency, and settlement SQL contract scripts — passed.
- `backend: pnpm lint:check`, `pnpm typecheck`, `pnpm build`, and `pnpm exec prisma validate` — passed.
- `backend: pnpm exec prisma migrate status` — 18 migrations; local database is up to date.
- `backend: pnpm audit --prod` — no known vulnerabilities after the patched transitive override.
- `web: pnpm lint:check`, `pnpm typecheck`, `pnpm test`, and `pnpm build` — passed; 2 suites / 7 tests, standalone server output, and 16 generated routes.
- `web: pnpm audit --prod` — no known vulnerabilities.
- Standalone Web production server was started on port 3100 and its liveness endpoint, CSP, HSTS, frame, and content-type headers were verified.
- `docker compose config` — passed. Image builds were not executable locally because the Docker daemon is unavailable; CI includes both image builds.

## Blockers

No environment blocker for continued development. Production release remains blocked by the critical risks above and by unresolved finance/business policies recorded in `docs/database-domain-v1/open-decisions.md`.

## Next actions

See `NEXT_ACTIONS.md`. Shared trip locking and persisted cancellation idempotency are implemented. Immediate focus is real PostgreSQL concurrency tests and database refund ceilings, followed by database-level tenant constraints and agent ownership.
