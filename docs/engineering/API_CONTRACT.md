# API Contract

## Current conventions

- Backend base prefix: `/api`.
- Web calls backend through same-origin BFF proxy routes.
- DTO validation uses Nest global `ValidationPipe` with whitelist, transform, and rejection of unknown properties.
- Permissions are declared on controllers and enforced globally.

## Required contract rules

- Authenticated organization/branch/ownership scope is never accepted from request input as authority.
- Transaction-sensitive POST commands require validated `Idempotency-Key` and persist the operation result. Booking creation and booking/trip cancellation currently enforce keys; cancellation also verifies request hashes and safe replay.
- High-volume resource lists (`agents`, agent commissions, bookings, tickets, payments, expenses, settlements, customers, and trips) accept `page` and `limit`, default to 50 rows, cap at 200, preserve the legacy array response shape, and use stable tie-break sorting.
- Lower-growth administration/reference lists must adopt the same pagination contract before high-volume production use.
- Errors use stable codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `DUPLICATE_OPERATION`, `BUSINESS_RULE_VIOLATION`, `RATE_LIMITED`, `INTERNAL_ERROR`.
- Prisma uniqueness/FK failures map to safe 409/400 responses.
- Sensitive projections are permission-aware; passenger PII and financial details are not included by default.
- API versioning and generated OpenAPI documentation remain missing.

## Pagination compatibility

Pagination currently preserves direct array bodies for existing web clients. Consumers advance with `page=N&limit=M` until a page contains fewer than `limit` records. A future cursor/envelope contract must be versioned rather than silently changing these response bodies.
