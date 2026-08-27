# Database Contract

## Active schema

Source of truth: `backend/prisma/schema.prisma` plus eight migrations under `backend/prisma/migrations/`.

The active schema provides PostgreSQL foreign keys, tenant columns on most business entities, useful indexes, decimal money columns, booking/payment idempotency keys, and unique trip seat labels.

## Known active-schema gaps

- Composite foreign keys now enforce matching `organizationId` across the core trip, booking, payment, refund, ticket, manifest, commission, expense, settlement, fleet, and agent graph. Branch/organization consistency is enforced by preflight-validated triggers across branch-owned tables. Runtime RLS remains pending.
- No RLS policies in active migrations.
- Missing CHECK constraints for positive amounts, cancellation percentage bounds, refund bounds, commission percentage bounds, and valid periods.
- A generic persisted idempotency record enforces tenant+endpoint+key uniqueness and request hashing for booking/trip cancellation.
- PostgreSQL enforces positive payment/refund amounts, refunded-amount bounds, refund tenant/booking consistency, and atomic cumulative refund updates through a payment-row-locking trigger.
- Settlement has no immutable line allocation or overlap/duplicate protection.
- No active double-entry ledger/fiscal-period schema.
- Trip bus/driver overlap is not database-assisted.

## Candidate v1

`backend/prisma/v1/` contains a separately validated candidate contract with stronger constraints, RLS, accounting, and invariant smoke tests. It is **not active** and must not be described as runtime behavior. Adoption requires an additive migration/backfill/switch plan and decisions in `docs/database-domain-v1/open-decisions.md`.

## Migration policy

Use `add → backfill → dual-read/write where needed → validate → switch → remove`. Every change requires migration SQL review, data compatibility analysis, rollback/roll-forward notes, and validation against a disposable PostgreSQL instance before deployment.
