# State Transition Matrix v1.0

> الـDomain Service يفرض السبب والصلاحية والآثار الجانبية. PostgreSQL trigger يفرض الحد الأدنى من الانتقالات القانونية كدفاع أخير. أي انتقال غير مذكور مرفوض.

## 1. Trip

| From | To | Command | شروط أساسية | آثار ذرية |
|---|---|---|---|---|
| DRAFT | SCHEDULED | ScheduleTrip | Route/Bus/Layout صالح؛ لا تعارض Bus/Driver؛ inventory مكتمل | Audit + Outbox |
| DRAFT | CANCELLED | CancelDraftTrip | لا تذاكر فعالة | Audit |
| SCHEDULED | BOARDING | OpenBoarding | ضمن نافذة التشغيل؛ Manifest OPEN | Audit + Outbox |
| SCHEDULED | CANCELLED | CancelTrip | lock Trip؛ إلغاء items/tickets؛ refund cases وفق السياسة | Audit + Outbox |
| BOARDING | DEPARTED | DepartTrip | Manifest LOCKED؛ لا عمليات booking قيد التنفيذ | revenue event + Audit + Outbox |
| BOARDING | CANCELLED | CancelTrip | override permission + refund workflow | Audit + Outbox |
| DEPARTED | COMPLETED | CompleteTrip | actual arrival مثبت | recognition/finalization events |

**Terminal:** `COMPLETED`, `CANCELLED`. لا عودة إلى حالة نشطة. التصحيح الإداري Event/Adjustment منفصل.

## 2. TripSeat

| From | To | السبب | الشرط |
|---|---|---|---|
| AVAILABLE | HELD | HoldSeat | seat sellable، trip يسمح بالبيع، لا hold active |
| AVAILABLE | BLOCKED | BlockSeat | صلاحية تشغيلية ولا BookingItem فعال |
| HELD | AVAILABLE | Release/Expire | token مطابق أو expiry من وقت DB |
| HELD | SOLD | ConfirmBooking | hold token مطابق والحجز داخل transaction نفسه |
| SOLD | AVAILABLE | CancelItem | السياسة تسمح بإعادة البيع ولم تغادر الرحلة |
| BLOCKED | AVAILABLE | UnblockSeat | seat type قابل للبيع |

يجب تحديث `version` في كل انتقال. لا يعتمد النظام على status وحده؛ SeatHold يحتفظ بالتاريخ.

## 3. SeatHold

| From | To | معنى |
|---|---|---|
| ACTIVE | CONVERTED | تحول إلى BookingItem مؤكد |
| ACTIVE | EXPIRED | انتهى حسب DB time |
| ACTIVE | RELEASED | تحرير صريح |

كل الحالات بعد ACTIVE نهائية. يوجد Active Hold واحد فقط للمقعد عبر partial unique index.

## 4. Booking

| From | To | Command | الشروط |
|---|---|---|---|
| PENDING | CONFIRMED | ConfirmBooking | items صالحة؛ inventory claimed؛ سياسة الدفع محققة |
| PENDING | CANCELLED | CancelBooking | تحرير holds/items |
| PENDING | EXPIRED | ExpireBooking | DB time تجاوز المهلة |
| CONFIRMED | PARTIALLY_CANCELLED | CancelBookingItems | بعض items فقط ألغيت |
| CONFIRMED | CANCELLED | CancelBooking | كل items ألغيت |
| CONFIRMED | COMPLETED | CompleteBooking | كل items استهلكت/انتهت وفق السياسة |
| PARTIALLY_CANCELLED | CANCELLED | CancelRemainingItems | لا items فعالة |
| PARTIALLY_CANCELLED | COMPLETED | CompleteBooking | الباقي استهلك/انتهى |

Payment status **مشتق** من completed allocations/refunds، ولا يخلط مع BookingStatus.

## 5. BookingItem

| From | To |
|---|---|
| RESERVED | CONFIRMED / CANCELLED |
| CONFIRMED | CANCELLED / REFUNDED / USED |
| CANCELLED | REFUNDED عند اكتمال الأثر المالي إذا استحق |

`USED` و`REFUNDED` نهائيتان. `NO_SHOW` قرار مفتوح؛ إن اعتمد يضاف كحالة نهائية.

## 6. Ticket

| From | To | الحدث |
|---|---|---|
| ISSUED | CHECKED_IN | check-in ناجح |
| ISSUED | CANCELLED | إلغاء قبل الاستخدام |
| ISSUED | REFUNDED | refund/void policy |
| ISSUED | EXPIRED | انتهاء صلاحية/رحلة |
| CHECKED_IN | USED | boarding/consumption ناجح |
| CHECKED_IN | CANCELLED | override قبل departure فقط |

لا انتقال من `USED/CANCELLED/REFUNDED/EXPIRED`. كل transition يضيف TicketEvent داخل transaction نفسه.

## 7. Manifest

| From | To | الشروط |
|---|---|---|
| OPEN | LOCKED | lock Trip+Manifest؛ بناء snapshot؛ حساب totals؛ actor وصلاحية |

LOCKED نهائية. إعادة الطباعة Audit event. التصحيح Manifest version/process جديد بعد اعتماد الحقول التنظيمية.

## 8. Payment

| From | To |
|---|---|
| PENDING | AUTHORIZED / COMPLETED / FAILED / CANCELLED |
| AUTHORIZED | COMPLETED / FAILED / CANCELLED |
| COMPLETED | PARTIALLY_REFUNDED / REFUNDED |
| PARTIALLY_REFUNDED | PARTIALLY_REFUNDED / REFUNDED |

Provider callback لا يطبق transition قبل signature validation وProviderEvent idempotency. حقائق الدفع المكتمل لا تعدل؛ refund سجل مستقل.

## 9. Refund

| From | To |
|---|---|
| PENDING | APPROVED / CANCELLED |
| APPROVED | PROCESSING / CANCELLED |
| PROCESSING | COMPLETED / FAILED |
| FAILED | PROCESSING / CANCELLED |

إعادة المحاولة لا تنشئ Refund ماليًا ثانيًا؛ تنشئ Provider attempt/event جديدًا مرتبطًا بنفس Refund. `COMPLETED` immutable.

## 10. Expense

| From | To |
|---|---|
| DRAFT | SUBMITTED / CANCELLED |
| SUBMITTED | APPROVED / REJECTED / CANCELLED |
| REJECTED | DRAFT / CANCELLED |
| APPROVED | POSTED / CANCELLED وفق السياسة وقبل الدفع |

بعد POSTED: لا تعديل. التصحيح Adjustment + reversing Journal Entry.

## 11. Agent Settlement

| From | To |
|---|---|
| DRAFT | APPROVED / CANCELLED |
| APPROVED | POSTED / CANCELLED |

POSTED immutable. كل AgentTransaction يدخل في SettlementLine واحدة نهائية. لا تعتمد سلامة التسوية على منع تداخل التاريخ فقط؛ source-line uniqueness هو الحاجز الأساسي.

## 12. Fiscal Period

| From | To |
|---|---|
| OPEN | CLOSING |
| CLOSING | OPEN / CLOSED |

CLOSED لا يعاد فتحه إلا Emergency governance command بصلاحية منفصلة وAudit وموافقة مزدوجة؛ هذا الاستثناء غير مطبق في v1 candidate.

## 13. Journal Entry

| From | To | الشرط |
|---|---|---|
| DRAFT | POSTED | period OPEN؛ lines موجودة؛ debit = credit؛ currency متطابقة |
| POSTED | REVERSED | إنشاء reversal entry متوازن ثم وسم الأصل داخل نفس transaction |

لا DELETE/UPDATE بعد POSTED. لا تعديل Lines التابعة له.

## 14. Idempotency

| From | To |
|---|---|
| PROCESSING | COMPLETED / FAILED |
| FAILED | PROCESSING فقط عبر retry policy وlock takeover |

نفس `(organization, endpoint, key)` ونفس hash يعيد النتيجة السابقة. hash مختلف يعيد `409 Conflict`.

## 15. Outbox

| From | To |
|---|---|
| PENDING | PROCESSING |
| PROCESSING | PROCESSED / FAILED |
| FAILED | PENDING / DEAD_LETTER |

Claim بواسطة `FOR UPDATE SKIP LOCKED`. نشر الرسالة at-least-once؛ كل consumer يجب أن يكون idempotent.
