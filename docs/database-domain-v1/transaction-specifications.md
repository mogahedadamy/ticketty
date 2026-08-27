# Transaction, Lock & Idempotency Specifications v1.0

## 1. قواعد عامة

1. كل Command يفتح Prisma interactive transaction قصيرة.
2. أول statement بعد BEGIN يثبت Tenant Context على الاتصال نفسه:

```sql
SELECT set_config('app.organization_id', $1, true);
```

3. ترتيب الأقفال ثابت لتجنب deadlocks: `Organization/Period → Trip → Manifest → Agent/Payment → TripSeat (sorted UUID) → Booking → Ticket`.
4. IDs المتعددة ترتب ترتيبًا ثابتًا قبل `FOR UPDATE`.
5. لا HTTP/SMS/PDF/Email/Provider call داخل DB transaction.
6. Audit + Outbox + Idempotency result تكتب داخل transaction نفسها.
7. Isolation الافتراضي `READ COMMITTED` مع row/exclusion locks محددة؛ استخدم `SERIALIZABLE` فقط لعملية ثبتت حاجتها مع retry محدود.
8. أخطاء `40001` و`40P01` يعاد تنفيذها bounded retries مع jitter؛ business conflicts تعاد 409 دون retry أعمى.

## 2. Transaction Matrix

| Command | Idempotency scope | Locks | DB barriers | Events |
|---|---|---|---|---|
| HoldSeats | `booking.hold` | Trip ثم TripSeats مرتبة | one active hold partial unique + version | SEATS_HELD |
| Create/Confirm Booking | `booking.create` | Trip، Manifest، TripSeats، Agent عند الائتمان | tenant FKs، status checks، totals | BOOKING_CONFIRMED، TICKET_ISSUED |
| Cancel Booking/Items | `booking.cancel` | Trip، Booking، Items، Seats، Payments | legal transitions + refund ceiling | BOOKING_CANCELLED، REFUND_REQUESTED |
| Payment Callback | `provider.event` | ProviderEvent ثم Payment | provider event unique + external ref unique | PAYMENT_COMPLETED/FAILED |
| Refund | `refund.create` | Payment ثم Refund | completed refunds <= payment | REFUND_COMPLETED |
| Boarding Scan | `boarding.scan`/offline id | Trip ثم Ticket | ticket transition + offline id unique | TICKET_CHECKED_IN |
| Lock Manifest | `manifest.lock` | Trip ثم Manifest ثم Tickets | locked snapshot immutable | MANIFEST_LOCKED |
| Cancel Trip | `trip.cancel` | Trip ثم Manifest ثم Bookings/Seats | transition trigger + per-booking idempotency | TRIP_CANCELLED |
| Assign Bus/Driver | `trip.assign` | Trip ثم resource advisory/rows | exclusion constraints | TRIP_RESOURCE_ASSIGNED |
| Agent Credit Sale | booking key | Agent ثم TripSeats | version + subledger sum/credit rule | AGENT_CREDIT_USED |
| Generate Settlement | `settlement.generate` | Agent ثم eligible AgentTransactions | transaction line unique | SETTLEMENT_CREATED |
| Post Settlement | `settlement.post` | Agent، Settlement، FiscalPeriod | immutable lines + balanced journal | SETTLEMENT_POSTED |
| Approve/Post Expense | `expense.post` | Expense ثم FiscalPeriod | state + balanced journal | EXPENSE_POSTED |
| Post Journal | `journal.post` | FiscalPeriod ثم Entry | open period + balance trigger | JOURNAL_POSTED |
| Allocate Number | command key | NumberSequence | row lock/version | لا event مستقل |
| Outbox Claim | worker id | Outbox rows | `SKIP LOCKED` | external publish |

## 3. Idempotency Protocol

```text
BEGIN
  SET LOCAL tenant
  INSERT IdempotencyKey(PROCESSING, request_hash)
    ON CONFLICT tenant+endpoint+key ...
  if existing hash differs -> ROLLBACK + 409
  if COMPLETED -> return stored response
  if PROCESSING and lock fresh -> 409/202
  if stale -> controlled takeover
  execute command
  write AuditLog
  write OutboxEvent(s)
  mark IdempotencyKey COMPLETED + resource/response
COMMIT
```

لا تخزن أسرارًا أو PII كاملة في `responseBody`. يفضل تخزين resource reference وresponse minimal.

## 4. Create Booking / Same Seat Race

### Preconditions

- Membership ACTIVE وpermission `bookings.create`.
- branch ضمن scope.
- idempotency key إلزامي.
- seat IDs مرتبة.

### Algorithm

```text
BEGIN
  SET LOCAL tenant
  claim idempotency key
  SELECT Trip FOR UPDATE
  reject CANCELLED/DEPARTED/COMPLETED
  SELECT Manifest FOR UPDATE (if exists); reject LOCKED when sales closed
  SELECT TripSeat ... ORDER BY id FOR UPDATE
  validate seat type/status and unexpired hold token
  if agent credit: SELECT Agent FOR UPDATE and validate credit projection
  allocate booking number atomically
  INSERT Booking + BookingItems
  transition holds to CONVERTED and seats to SOLD with version+1
  create Tickets only if issuance policy permits
  append AgentTransaction/commission snapshots when trigger event is defined
  append Audit + Outbox
  complete idempotency record
COMMIT
```

الحاجز الحقيقي ضد البيع المزدوج هو row lock/conditional version + uniqueness، لا قراءة availability السابقة في UI.

## 5. Trip Cancellation During Booking

العمليتان تقفلان `Trip` أولًا. لذلك:

- إن حصل booking على lock أولًا، يكمل قبل cancellation، ثم cancellation يراه ويعالجه.
- إن حصل cancellation أولًا، تتغير Trip إلى CANCELLED، وبعد release يرفض booking الحالة الجديدة.
- لا يسمح لمسار manifest أو booking بقفل Seat قبل Trip لأن ذلك يخلق deadlock/order inversion.

Cancellation transaction لا تتصل بمزود الدفع. تنشئ Refund records/outbox؛ worker/provider adapter يكملها idempotently.

## 6. Manifest Lock During Boarding/Booking

Lock manifest:

```text
BEGIN
  lock Trip
  lock/create Manifest
  assert Trip in SCHEDULED/BOARDING
  lock relevant Tickets/BookingItems
  rebuild snapshot deterministically
  set LOCKED + totals + actor
  append Audit + Outbox
COMMIT
```

Booking يقفل Trip ثم Manifest، فيرفض البيع بعد LOCKED. Boarding يقفل Trip ثم Ticket؛ يمكن أن يستمر بعد Manifest lock لأن snapshot لا يتغير، وتظهر حالة boarding عبر events لا عبر تعديل snapshot.

## 7. Two Payment Callbacks

```text
BEGIN
  SET LOCAL tenant resolved from signed provider routing metadata
  INSERT PaymentProviderEvent(provider,event_id) ON CONFLICT
  verify signature before financial mutation
  SELECT Payment FOR UPDATE
  if event already processed -> return accepted
  validate amount/currency/reference and legal transition
  update Payment
  create accounting command/outbox exactly once
  mark ProviderEvent PROCESSED
COMMIT
```

لا نثق في `organizationId` من payload غير موقع. Tenant يحل من merchant/provider account mapping.

## 8. Refund Concurrency

```text
BEGIN
  claim idempotency key
  SELECT Payment FOR UPDATE
  sum COMPLETED refunds
  validate requested <= captured - completed - reserved processing amount
  INSERT Refund
  append outbox REFUND_SUBMIT_REQUESTED
COMMIT
```

عند callback النهائي يعاد قفل Payment وRefund. SQL trigger يمنع أن تتجاوز completed refunds أصل الدفع حتى لو أخطأ التطبيق.

## 9. Two Boarding Scans

- Online: lock Ticket؛ أول scan ينقل ISSUED→CHECKED_IN ويكتب event. الثاني يرى CHECKED_IN ويرجع `ALREADY_CHECKED_IN` دون success جديد.
- Offline: `offlineEventId` فريد داخل Tenant. الجهاز يتحقق من توقيع QR وقائمة الرحلة محليًا، ولا يغير مالًا.
- Sync: server يعالج event idempotently. إذا سبقه scan آخر، يسجل `CHECK_IN_REJECTED` أو duplicate reconciliation، ولا يعكس الحقيقة تلقائيًا.
- Device public key/status وmanifest package version يجب التحقق منها؛ key rotation/revocation جزء من التصميم الأمني التفصيلي.

## 10. Agent Credit Race

```text
BEGIN
  SELECT Agent FOR UPDATE
  calculate authoritative exposure from append-only AgentTransactions
  include unsettled sales, payments, refunds, pending allocations per policy
  reject if new exposure > creditLimit
  append AgentTransaction SALE
  continue booking transaction
COMMIT
```

لا يعتمد القرار على `balance_after` وحده. إذا أضيف projection في المستقبل، يحدث داخل transaction وتراجع دوريًا مع ledger.

## 11. Bus/Driver Assignment Race

- Trip row lock يمنع تعديل الرحلة نفسها مرتين.
- PostgreSQL exclusion constraints تمنع overlap `[departure,arrival)` لنفس Bus/Driver حتى من مسارات كتابة مختلفة.
- عند `23P01` يرجع Domain conflict يذكر المورد والفترة، لا 500.
- تغيير الوقت أو المورد يمر عبر نفس constraint.

## 12. Journal Posting

```text
BEGIN
  claim idempotency/source key
  SELECT FiscalPeriod FOR UPDATE
  assert OPEN and entry_date in range
  SELECT JournalEntry FOR UPDATE
  validate DRAFT
  validate lines, tenant, accounts, currency, totals
  UPDATE status POSTED
    -- DB trigger rechecks open period and debit=credit
  append Audit + Outbox
COMMIT
```

إدراج POSTED مباشرة ممنوع على مستوى repository. النمط الوحيد: DRAFT + Lines ثم transition to POSTED.

## 13. Outbox Worker

```sql
WITH claimed AS (
  SELECT id
  FROM outbox_events
  WHERE (
      status IN ('PENDING','FAILED')
      OR (status='PROCESSING' AND locked_at < clock_timestamp() - interval '5 minutes')
    )
    AND available_at <= clock_timestamp()
  ORDER BY available_at, created_at
  FOR UPDATE SKIP LOCKED
  LIMIT $1
)
UPDATE outbox_events o
SET status = 'PROCESSING', attempts = attempts + 1,
    locked_at = clock_timestamp(), locked_by = $2, last_error = NULL
FROM claimed
WHERE o.id = claimed.id
RETURNING o.*;
```

كل event ينشر at-least-once. Consumer deduplication key هو OutboxEvent.id أو `(organization, aggregate, version, eventType)`. العامل العالمي يستخدم دور `ticketty_outbox_worker` محدودًا بجدول Outbox فقط وموثقًا في `003_runtime_roles.sql`؛ أي قراءة للـaggregate تتم لاحقًا داخل Tenant-scoped transaction بدور التطبيق.

## 14. أخطاء يجب Mapping لها

| PostgreSQL | المعنى | HTTP/Domain |
|---|---|---|
| `23505` | unique/duplicate | 409 Conflict أو idempotent replay |
| `23503` | FK/tenant reference invalid | 400/404 بحسب منع التسريب |
| `23514` | invariant/check | 409 Domain invariant violation |
| `23P01` | exclusion overlap | 409 Resource schedule conflict |
| `40001` | serialization failure | retry bounded ثم 503 |
| `40P01` | deadlock | retry bounded + alert |
| `42501` | RLS/permission | 403 أو 404 بحسب السياسة |
| `55000` | immutable record | 409 Correction/reversal required |
