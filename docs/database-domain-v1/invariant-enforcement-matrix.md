# Invariant Enforcement Matrix v1.0

| Invariant | Domain/Application | Prisma FK/Unique | SQL DB | Test |
|---|---:|---:|---:|---:|
| Tenant cannot reference another tenant | ✅ | ✅ composite keys | ✅ RLS + actor/semantic guards | ✅ runtime-role RLS |
| One active hold per TripSeat | ✅ | — | ✅ partial unique | ✅ |
| TripSeat and active hold agree | ✅ | — | ✅ deferred constraint triggers | ✅ |
| One active BookingItem per TripSeat | ✅ | — | ✅ partial unique | ✅ two-booking case |
| TripSeat matches Trip layout/currency snapshot | ✅ | tenant FK | ✅ snapshot trigger | schema/apply |
| BookingItem seat belongs to Booking trip | ✅ | tenant FK | ✅ semantic trigger | schema/apply |
| Bus/Driver do not overlap | ✅ | — | ✅ exclusion constraints | ✅ |
| Ticket is immutable snapshot | ✅ | tenant FKs | ✅ snapshot + immutable field guard | schema/apply |
| Ticket reissue preserves previous version | ✅ | ✅ chain key | ✅ chain/version trigger + active partial unique | schema/apply |
| Ticket transition has TicketEvent | ✅ | tenant FK | ✅ deferred event trigger | schema/apply |
| Same ticket cannot board successfully twice | ✅ | — | ✅ partial unique | schema/apply |
| Manifest matches Trip and is versioned | ✅ | tenant FK | ✅ branch/version chain trigger | schema/apply |
| Locked Manifest and rows are immutable | ✅ | — | ✅ triggers | schema/apply |
| Manifest totals equal snapshot rows | ✅ | — | ✅ lock-time aggregate check | schema/apply |
| Booking totals equal active item totals | ✅ | — | ✅ deferred aggregate trigger | schema/apply |
| Payment allocation currency matches target | ✅ | tenant FK | ✅ semantic trigger | schema/apply |
| Payment allocations do not exceed source/target | ✅ | — | ✅ deferred aggregate trigger | schema/apply |
| Completed refunds do not exceed payment | ✅ | tenant FK | ✅ locked cumulative trigger | ✅ |
| Completed financial operation has posted journal | ✅ | SQL composite FK | ✅ source-specific journal guard | ✅ Payment |
| Journal entry is balanced | ✅ | — | ✅ posting trigger | ✅ |
| Journal date lies in OPEN period | ✅ | tenant FK | ✅ posting trigger | schema/apply |
| Posted/reversed journal and lines immutable | ✅ | — | ✅ triggers | ✅ |
| Expense/Settlement/Adjustment final records immutable | ✅ | SQL journal FK | ✅ workflow trigger | schema/apply |
| Agent settlement line agent/currency match | ✅ | tenant FK | ✅ semantic trigger | schema/apply |
| Audit append-only and actor tenant-safe | ✅ | SQL membership FK | ✅ trigger + RLS | ✅ append-only |
| Idempotency key/request hash protocol | ✅ | ✅ unique | status/expiry checks | integration pending |
| Outbox logical event unique and crash-reclaimable | ✅ | ✅ unique identity | lease/status checks | worker integration pending |

## Enforcement levels

- **Domain/Application:** رسائل أخطاء مفهومة، صلاحيات، سياسة تجارية، وترتيب orchestration.
- **Prisma:** typing وعلاقات ومفاتيح مركبة قابلة للتوليد.
- **SQL:** آخر حاجز ضد أي writer أو race أو نسيان tenant filter.
- **Test:** الموجود الآن smoke contract؛ الاختبارات ذات كلمة `pending` بوابات إلزامية قبل Final Sign-off.
