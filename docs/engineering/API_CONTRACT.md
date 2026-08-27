# API Contract

## Current conventions

- Backend base prefix: `/api`.
- Web calls backend through same-origin BFF proxy routes.
- DTO validation uses Nest global `ValidationPipe` with whitelist, transform, and rejection of unknown properties.
- Permissions are declared on controllers and enforced globally.

## Required contract rules

- Authenticated organization/branch/ownership scope is never accepted from request input as authority.
- Transaction-sensitive POST commands require validated `Idempotency-Key` and persist the operation result. Booking creation and booking/trip cancellation currently enforce keys; cancellation also verifies request hashes and safe replay.
- Resource lists use bounded pagination, filtering, and stable sorting.
- Errors use stable codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `DUPLICATE_OPERATION`, `BUSINESS_RULE_VIOLATION`, `RATE_LIMITED`, `INTERNAL_ERROR`.
- Prisma uniqueness/FK failures map to safe 409/400 responses.
- Sensitive projections are permission-aware; passenger PII and financial details are not included by default.
- API versioning and generated OpenAPI documentation remain missing.

## Current inconsistency

Backend defaults/examples use port 3001, while `web/.env.example` currently points to port 4000. This must be unified and covered by configuration validation.
