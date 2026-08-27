# Engineering Decisions

## ADR-001 — Preserve and harden the modular monolith

**Context:** A functional NestJS/Next.js vertical slice exists, but production controls are incomplete.
**Options:** rewrite; split microservices; incremental hardening.
**Decision:** Incrementally harden the current modular monolith.
**Reason:** Lowest migration risk and fastest path to verified correctness.
**Consequences:** Domain boundaries are extracted only where critical invariants or testability justify them.

## ADR-002 — Fail-closed tenant scope

**Context:** Nullable organization IDs can remove Prisma filters when converted to `undefined`.
**Decision:** Tenant runtime services call `requireOrgId`/`tenantScope`; platform administration, if introduced, uses a separate explicit path and policy.
**Consequences:** Misconfigured tenant users receive Forbidden rather than cross-tenant data. Ticket queries were migrated in this cycle.

## ADR-003 — Database-assisted integrity

**Context:** Application-only validation cannot protect concurrent writers or alternate code paths.
**Decision:** Enforce critical invariants in both application transactions and PostgreSQL constraints/locks; evaluate controlled adoption of the validated `prisma/v1` candidate through additive migrations.
**Consequences:** Schema work requires real PostgreSQL integration tests and rollout planning.

## ADR-004 — No production accounting claim without double entry

**Context:** The active runtime has payments/refunds/expenses but no journal/ledger/fiscal periods.
**Decision:** Treat current finance views as operational reporting, not an authoritative accounting ledger.
**Consequences:** Production financial readiness remains blocked until accounting policy decisions and balanced posting/reversal workflows are implemented.

## ADR-005 — Shared per-trip transaction serialization

**Context:** Booking, cancellation, trip cancellation, and manifest departure previously read mutable trip state independently and could interleave.
**Decision:** Every critical write for a trip acquires the same PostgreSQL transaction-scoped advisory lock before reading mutable state.
**Reason:** Provides an immediately deployable correctness boundary across existing services while a deeper state-machine and database contract are developed.
**Consequences:** Writes for one trip serialize and may reduce hot-trip throughput; lock wait latency must be measured. Persisted idempotency, database refund ceilings, and real concurrency tests are still required.
