# Domain Model

## Aggregate areas

- Identity: Organization, Branch, User, Role, permission and scope policies.
- Network: Route, RouteStop, schedules (missing), Trip.
- Fleet: Bus, SeatTemplate, Seat, Driver, maintenance (missing).
- Inventory: TripSeat and server-owned hold lifecycle.
- Sales: Customer, Booking, booking items/passenger snapshots (active model is simplified), Ticket.
- Money: Payment, allocation/provider event (missing in active runtime), Refund.
- Agency: Agent, contract/rules/credit ledger (mostly missing), Commission, Settlement.
- Operations: Boarding event, Manifest snapshot and lock (partially implemented).
- Expenses: Expense and immutable adjustments.
- Accounting: Chart of accounts, fiscal periods, journals, entries, lines and reversals (missing from active runtime; candidate v1 exists under `backend/prisma/v1`).
- Platform: Audit, idempotency, outbox, files, notifications, offline devices/events (mostly missing).

## Required state machines

- Trip: DRAFT → SCHEDULED → BOARDING/OPEN → DEPARTED → COMPLETED; terminal CANCELLED.
- Booking: PENDING → CONFIRMED → PARTIALLY_CANCELLED/CANCELLED/COMPLETED/EXPIRED.
- Ticket: ISSUED/BOOKED → CHECKED_IN → USED; terminal CANCELLED/REFUNDED/EXPIRED/NO_SHOW.
- Expense: DRAFT → SUBMITTED → APPROVED → POSTED, or REJECTED/CANCELLED.
- JournalEntry: DRAFT → POSTED → REVERSED.

The active enums are narrower and permit service-level arbitrary changes in places. Consolidated transition policies and transaction-safe checks are required.

## Core invariants

1. Every tenant-owned operation is scoped by authenticated organization; branch and ownership scopes are additive.
2. A sellable trip seat can be sold once, and only REGULAR/VIP seats are sellable.
3. Holds expire on server time and expired holds can be atomically reclaimed.
4. Terminal trip/manifest transitions and bookings share one concurrency protocol.
5. Financial commands are idempotent; completed refunds cannot exceed captured payment.
6. Posted journal entries balance and are immutable; correction uses reversal/adjustment.
7. Locked manifests are immutable snapshots.
8. Tickets use minimal opaque/signed QR payloads and duplicate scans follow explicit policy.
