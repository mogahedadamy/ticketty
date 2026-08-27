# Security Model

## Trust boundaries

Tenant isolation is a security boundary. Effective authorization is:

`authenticated user → active organization membership → branch scope → permission → ownership/resource policy`

Organization and branch IDs from the client are identifiers to validate, never authority.

## Existing controls

- Password hashing with bcrypt.
- Global JWT and permission guards.
- Active user/organization revalidation per protected request.
- Helmet, constrained CORS, input validation, and rate limiting.
- HttpOnly/SameSite web session cookie through a BFF; no sensitive token in Local Storage.
- Environment files ignored by Git.

## Open high risks

- Known writable related-ID paths now validate tenant/branch scope transactionally, but database-level tenant consistency and RLS remain absent.
- Agent own-vs-all/BOLA policy gaps.
- Refund and trip-state race conditions.
- Weak startup secret/config validation; no JWT issuer/audience/rotation/revocation.
- Partial audit coverage and no request correlation.
- PII exposure is not separated into granular projections/permissions.
- In-memory throttling is not suitable for multiple instances.

## Closed this cycle

Tenant users without an organization are now rejected at login and during JWT request revalidation. Ticket list, ID lookup, and QR lookup additionally fail closed and consistently enforce organization plus optional branch scope. Regression tests cover login and ticket-service boundaries.

## Completion gate

No critical module is complete until authentication, permissions, tenant, branch, ownership, validation, output exposure, CSRF/XSS/SSRF/IDOR, races, replay/idempotency, audit, logging, and abuse controls are reviewed and tested.
