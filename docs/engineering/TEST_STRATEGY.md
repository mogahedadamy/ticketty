# Test Strategy

## Current evidence

- Backend: 15 Jest suites / 40 tests after the current hardening cycle.
- Backend E2E: 3 suites / 7 tests covering production-equivalent app bootstrap, health, refund contention, booking-vs-trip cancellation, and cross-agent isolation.
- PostgreSQL contract scripts cover refund, tenant, and settlement integrity and pass against the migrated local database.
- Frontend: 2 Vitest suites / 7 tests cover server environment, origin, request-ID, and JWT-expiry helpers; lint, strict TypeScript, and production build pass. Component/browser tests remain absent.
- Active Prisma schema validation and all 17 runtime migrations pass; candidate database v1 remains a separate, inactive contract.
- GitHub CI now enforces backend/web quality, database integration contracts, dependency audits, and container builds.

## Test pyramid

1. Unit tests for domain transition policies, calculations, authorization scopes, and error mapping.
2. PostgreSQL integration tests for constraints, transaction boundaries, idempotency, RLS/tenant isolation, and concurrency.
3. API E2E tests using production-equivalent guards, pipes, prefix, and database.
4. Web component/integration tests for forms and failure states.
5. Playwright golden-path E2E for each principal role.
6. Load/soak tests for seat contention, reporting, and operational traffic.

## Mandatory critical scenarios

- Tenant A cannot read/write Tenant B; branch A cannot mutate branch B; agents see only own resources unless explicitly granted all scope.
- Concurrent booking cannot sell one seat twice.
- Expired holds are atomically reclaimable.
- Repeated payment/refund/settlement commands do not duplicate money.
- Booking cannot commit against cancelled/departed/manifest-locked trips.
- Cancelled/refunded tickets cannot board; duplicate scans follow policy.
- Locked manifests cannot mutate.
- Posted entries are balanced and immutable; closed periods reject posting.
- Bus/driver schedule overlap is rejected.

## Quality gates

Required per change: format/lint, strict typecheck, unit tests, relevant integration/E2E, build, Prisma validate/migration validation, and production dependency audit. Coverage is evidence, not a substitute for invariant scenarios.
