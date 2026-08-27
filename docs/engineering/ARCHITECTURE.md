# Architecture

## Current system

Ticketty is a two-application repository:

- Next.js App Router web application acting as UI and BFF.
- NestJS modular-monolith API using Prisma/PostgreSQL.

The existing backend modules align with business areas, but most business rules are implemented directly in Nest services that depend on Prisma. This is acceptable as a migration baseline, not the final target.

## Target boundaries

For critical modules, evolve incrementally toward:

`Presentation (controller) → Application use case → Domain policy/state machine → Repository port → Prisma adapter → PostgreSQL`

Do not perform a repository-wide ceremonial rewrite. Extract domain/application boundaries when addressing a critical invariant or when a service becomes difficult to test.

## Cross-cutting architecture

- Authenticated context is the sole source of tenant and branch scope.
- Shared policy helpers enforce tenant/branch/ownership scope and fail closed.
- Financial and transactional writes use explicit transactions and persisted idempotency.
- Domain events are committed through a transactional outbox; external I/O happens after commit.
- Audit is append-only and linked to actor, tenant, branch, entity, and request ID.
- API errors use a stable taxonomy and do not expose internals.

## Deployment direction

Remain a modular monolith. Add reproducible containers, CI quality gates, PostgreSQL health/readiness checks, structured logs, metrics, migration runbooks, and verified backup/restore before production. No microservice split is justified currently.
