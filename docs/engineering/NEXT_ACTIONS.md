# Next Automatic Actions

Prioritized by security risk, data integrity, dependency order, business criticality, and production readiness.

## Current task

1. **Prepare verified runtime RLS**
   - Composite tenant foreign keys and branch/organization triggers now cover the core transactional graph.
   - Implement a transaction-bound tenant context and verify RLS using a non-owner runtime database role before enabling it broadly.
   - Add tests proving missing or malformed tenant context fails closed.

## Next tasks

2. **Double-entry accounting foundation**
   - Immutable, tenant-consistent SettlementLine allocation now prevents one commission entering multiple settlements and freezes lines after settlement.
   - Add Chart of Accounts, Fiscal Period, Journal Entry/Lines, balanced posting, reversal, and settlement-to-ledger integration.
3. **Financial reporting consistency**
   - Define gross/net/refund metrics and remove refunded revenue from operational KPIs.
4. **Operational proof and observability**
   - Run the new container stack in a Docker-enabled staging environment.
   - Complete and record a scratch backup/restore drill.
   - Add hosted metrics, tracing/error tracking, alert ownership, and SLOs.

## Completed in current milestone

- Fail-closed organization scoping at login/JWT/tickets.
- Transactional application validation for known cross-tenant writable foreign IDs.
- Server-side rejection of DRIVER/DISABLED/BLOCKED seat sales and blocked initialization for non-sellable trip seats.
- Shared per-trip transaction locking and terminal manifest-lock validation.
- Settlement service reversal filtering, overlap protection, serialization, and settled-state immutability.
- Branch-safe booking idempotency replay.
- Persisted cancellation idempotency, atomic refund DB enforcement, SQL contract coverage, and real two-client refund/booking-vs-trip cancellation tests.
- Composite tenant foreign keys plus SQL tenant-consistency contract tests.
- External-agent ownership scoping, explicit `.own` permissions, role migration, and cross-agent integration coverage.
- SettlementLine allocation and finalized-line database protection.
- Public liveness and database-backed readiness endpoints, plus web liveness/readiness routes.
- Backend regression baseline: 15 suites / 40 unit tests and 3 suites / 7 E2E tests passing.
- CI quality gates, production container definitions, one-shot migrations, and Compose health orchestration.
- Fail-fast runtime configuration, explicit JWT verification policy, request correlation, and structured HTTP completion logs.
- Patched dependency audit, executable database backup/restore scripts, and operator runbooks.

## Blocked / deferred

Revenue recognition, taxes, cancellation policy versioning, agent collection model, fiscal calendar, and legal document numbering require business/finance sign-off recorded in `docs/database-domain-v1/open-decisions.md`. Engineering continues on non-dependent safety work.
