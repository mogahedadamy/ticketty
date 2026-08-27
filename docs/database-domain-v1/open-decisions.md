# Open Decisions Before Final Prisma Schema

هذه القرارات ليست تفاصيل UI؛ بعضها يغيّر الجداول والمفاتيح والقيود. لا يعتمد `Final Prisma Schema v1.0` قبل توقيع P0.

## P0 — تغيّر النموذج أو المحاسبة

| القرار | الخيارات | التوصية المبدئية | أثره |
|---|---|---|---|
| نطاق بيع المقعد | كامل الرحلة / Segments بين المحطات | كامل الرحلة في v1 | Segments تحتاج inventory per leg ومنع overlap على المقاطع |
| نقطة الاعتراف بالإيراد | الدفع / الإصدار / المغادرة / الاكتمال | المغادرة أو الاكتمال بعد رأي محاسبي | قيود deferred revenue وتقارير الربح |
| نموذج تحصيل الوكيل | الشركة تحصّل / الوكيل يحصّل ويورّد / مختلط | حقل collection model صريح لكل channel | receivables/payables والـsettlement |
| سياسة الإلغاء والاسترداد | حسب السبب والزمن والمقعد | Policy versioned + snapshot لكل CancellationCase | RefundItem، fee/tax reversal، partial cancellation |
| الضرائب | غير مطبقة قانونيًا / inclusive / exclusive | قرار قانوني موثق؛ لا نفترض صفرًا بصمت | TaxRule وinvoice/credit-note والقيود |
| العملات | Tenant single currency / multi-currency | single-currency v1 مع Currency snapshot | FX/base amounts، settlement، journal balancing |
| Customer vs Passenger | profile اختياري + passenger snapshot / كيان واحد | الفصل بينهما | الخصوصية، التاريخ، group bookings |
| Ticket lifecycle | CHECKED_IN كحالة / event فقط؛ USED/BOARDED | حالة CHECKED_IN ثم USED مبدئيًا | triggers وoffline reconciliation |
| إعادة تعيين الرحلة | Bus/Driver فقط / Route/Time/Layout | يمنع تغيير Layout بعد أي sale؛ التغييرات الكبيرة reschedule workflow | seat remapping وnotifications/refunds |
| السنة والفترات المالية | calendar / tenant fiscal year | tenant policy ثابتة قبل أول posting | FiscalPeriod generation/closure |

## P0 — سياسات أمن وتشغيل

1. **Platform administrators:** هل يوجد System Tenant منفصل أم PlatformUser/API منفصل؟ التوصية: DB role/API منفصل ومدقق، وعدم جعل `organizationId` nullable في مسارات tenant runtime.
2. **RLS connection protocol:** إثبات أن كل HTTP request وworker/webhook يستخدم interactive transaction على الاتصال نفسه مع `SET LOCAL`.
3. **Branch scope:** هل branch تعني owning/operating branch أم selling branch؟ يوصى بفصل `operatingBranchId` عن attribution الخاص بعملية البيع إذا كانت الشركة متعددة المحطات.
4. **Own/Assigned/Branch/Tenant scopes:** permission code وحده لا يكفي. يجب اعتماد policy scope لكل membership/role، خصوصًا Agent.
5. **Offline trust:** Device provisioning، QR signature algorithm، key rotation، manifest package expiry، clock skew، loss/revocation، conflict UI.
6. **PII encryption:** KMS/secret manager، key version، rotation، blind-index normalization، access logging، retention.

## P1 — يجب حسمها قبل بناء الـModules المعنية

### Numbering

- tenant أم branch sequence؟
- هل يعاد في السنة المالية؟
- هل gaps مسموحة؟
- هل reissue يحتفظ بالرقم ويزيد version أم رقم جديد؟
- offline number blocks مطلوبة أم لا؟

المخطط المرشح يوفر `NumberSequence`، لكن سياسة التخصيص النهائية غير مثبتة.

### Fare/Pricing

المخطط المرشح يخزن price snapshot فقط. قبل pricing module نحتاج:

- FareProduct/FareRule وversioning.
- Route/seat class/channel/time window priority.
- discount authorization وpromo codes.
- rounding per item أو per booking.
- هل commission تدخل total أم cost منفصل؟ في المرشح total = fare - discount + tax، والعمولة ليست خصمًا للعميل.

### Commission

- استحقاقها عند sale/payment/departure/completion؟
- عكسها كامل/نسبي عند refund؟
- هل fixed rule تحتاج Currency مستقلة؟
- rule overlap/priority وroute/class/channel dimensions.
- هل AgentTransaction subledger كافٍ أم نحتاج CommissionAccrual مستقل؟ التوصية: إضافة Accrual مستقل عند تثبيت قواعد العمولة المعقدة.

### Payments

- authorize/capture منفصلان لكل مزود؟
- cash receipt وcash shift/reconciliation مطلوبة في MVP؟
- chargebacks/disputes؟
- partial/multi-payment للBooking؟ المخطط يدعمه عبر allocations لكن business workflow غير مثبت.
- provider attempt history: المرشح يملك ProviderEvent، ويوصى بإضافة PaymentAttempt/RefundAttempt قبل التكامل الحقيقي.

### Manifest/Regulatory

- الحقول الرسمية المطلوبة في السودان أو سوق التشغيل.
- نسخة هوية كاملة أم masked reference؟
- التوقيع/الختم/الطاقم/الأمتعة.
- versioned correction بعد lock وإعادة الطباعة.

### No-show

- متى يحدد؟
- أثره على Ticket/BookingItem/Revenue/Commission/Refund.
- هل يسمح بإعادة بيع المقعد قبل departure cutoff؟

## P2 — يمكن تأجيلها لكن يجب ألا يغلق التصميم طريقها

- Schedules المتكررة وتوليد Trips.
- TripStop snapshots وsegment inventory.
- Crew متعدد بدل Driver واحد.
- Maintenance, insurance, ownership documents.
- CashRegister/CashShift/CashMovement.
- Chargebacks وprovider reconciliation batches.
- Materialized reporting views/warehouse.
- Data partitioning لـAudit/Outbox/Boarding events.
- B2C channels، loyalty، promotions، multi-language documents.

## قرارات Candidate الحالية القابلة للتغيير

1. UUID من `gen_random_uuid()`؛ UUIDv7 يحتاج وظيفة/extension أو توليد application موثوق.
2. `NUMERIC(19,4)`؛ قد يتغير بعد قرار العملات والتضخم والتقارير.
3. User email unique عالميًا؛ قد يتغير إلى identity provider/global account policy.
4. Passenger reusable داخل tenant؛ يمكن أن يصبح snapshot-only إذا فرضت الخصوصية ذلك.
5. `qrIdentifier` مخزن كنص؛ للإنتاج يفضل opaque token مع تخزين hash وkey/version metadata.
6. Audit وOutbox في المرشح Tenant-only و`organizationId` إلزامي؛ حوادث Platform تحتاج `PlatformAudit`/`PlatformOutbox` منفصلين قبل بناء مسارات الإدارة العامة.
7. Payment `payerId` polymorphic وغير مربوط FK؛ يجب حسم payer model أو استخدام روابط صريحة.
8. Generic `sourceType/sourceId` مفيد للتكامل لكنه لا يعطي FK؛ critical postings تحتاج source-specific uniqueness/tests.

## Sign-off المطلوب

| المجال | المسؤول المقترح |
|---|---|
| Refund/cancellation/no-show | Product + Operations + Finance |
| Revenue recognition/COA/fiscal periods | محاسب/Finance owner |
| Tax/invoice/retention | Legal/Compliance + Finance |
| Agent collection/credit/settlement | Commercial + Finance |
| RLS/platform admin/offline security | Security + Backend lead |
| Manifest fields | Operations + الجهة التنظيمية |
| Numbering and document legality | Finance/Compliance |
| Currency/rounding | Finance + Engineering |
