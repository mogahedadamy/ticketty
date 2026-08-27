# Ticketty — Database & Domain Contract v1.0

**الحالة:** Candidate Contract / Validation Baseline
**ليس Migration معتمدًا للإنتاج بعد.**
**المخطط التشغيلي الحالي لم يُستبدل:** ما زال `backend/prisma.config.ts` يشير إلى `backend/prisma/schema.prisma`.

## الغرض

تحويل خط الأساس المعماري إلى عقد قابل للتحقق قبل التنفيذ الكبير. الحزمة تفصل بين:

1. نموذج Prisma مرشح وقابل للـvalidation.
2. قيود PostgreSQL التي لا يستطيع Prisma التعبير عنها.
3. State machines صريحة.
4. حدود Transactions وLocks وIdempotency.
5. قرارات تجارية مفتوحة تمنع اعتماد المخطط نهائيًا.

## المخرجات

| الملف | الوظيفة |
|---|---|
| `backend/prisma/v1/schema.prisma` | Prisma Schema مرشح، مع tenant-safe composite relations في المسارات الحرجة |
| `backend/prisma/v1/sql/001_contract_constraints.sql` | CHECKs، partial indexes، exclusion constraints، immutability، posting/refund guards |
| `backend/prisma/v1/sql/002_row_level_security.sql` | RLS إلزامي ودفاع إضافي لعزل الشركات |
| `backend/prisma/v1/sql/003_runtime_roles.sql` | فصل أدوار التطبيق والمصادقة وعامل Outbox محدود الصلاحية |
| `backend/prisma/v1/tests/*.sql` | Smoke tests للقيود والتزامن المنطقي وRLS بدور غير مالك |
| `domain-model.md` | Bounded contexts، aggregates، الملكية والعلاقات وERD منطقي |
| `state-transition-matrix.md` | الحالات والانتقالات والأحداث المحظورة |
| `invariant-enforcement-matrix.md` | ربط كل invariant بطبقات التطبيق وPrisma وSQL والاختبار |
| `transaction-specifications.md` | المعاملات، ترتيب الأقفال، idempotency، outbox، سيناريوهات التزامن |
| `open-decisions.md` | القرارات التي يجب حسمها قبل Final Prisma Schema |
| `validation-report.md` | نتائج التحقق الآلي وحدود ما تم إثباته |

## قرارات معتمدة في هذا الإصدار

- Modular Monolith وDDD boundaries؛ Prisma أداة Infrastructure وليست Domain Model.
- Shared Database / Shared Schema مع `organization_id` إلزامي لكل سجل Tenant-owned.
- المستخدم عالمي، والوصول للشركات عبر Membership مع Roles وBranch scopes.
- كل علاقة Tenant حرجة تستخدم composite FK أو SQL guard يثبت تطابق الشركة.
- الأموال `NUMERIC(19,4)` مع Currency صريحة؛ لا Float أو JavaScript Number كمصدر حقيقة.
- TripSeat هو inventory مستقل لكل رحلة؛ SeatHold سجل تاريخي، وTripSeat هو lock boundary.
- Booking يمثل الطلب التجاري، BookingItem يمثل مسافرًا/مقعدًا، Ticket وثيقة إصدار لاحقة.
- الدفع منفصل عن الاعتراف بالإيراد، وPaymentAllocation يربط المقبوض بالمستند.
- Refund سجل مستقل؛ لا يُعدّل أصل الدفع لإخفاء التاريخ.
- AgentTransaction وJournalEntry/Line سجلات مالية append-only بعد الاعتماد.
- Journal مزدوج القيد، ولا Posting خارج فترة مفتوحة أو بقيد غير متوازن.
- Audit append-only، وOutbox وIdempotency داخل نفس Business Transaction.
- RLS طبقة دفاع إضافية ولا تستبدل RBAC أو tenant-scoped repositories.

## افتراضات Candidate وليست سياسة عمل نهائية

- v1 يبيع المقعد لكامل الرحلة، وليس Segments مستقلة. دعم المقاطع يغيّر inventory model.
- كل مستند مالي بعملة واحدة. FX والمحاسبة متعددة العملات مؤجلان لحسم السياسة.
- `CHECKED_IN` حالة تذكرة و`USED` تعني صعودًا/استهلاكًا ناجحًا.
- الاعتراف بالإيراد وتوقيت استحقاق العمولة لم يُحسما؛ المخطط يفصل التشغيل عن دفتر الأستاذ كي لا يفرض قرارًا خاطئًا.
- System Roles قوالب Platform لا تُسند مباشرة إلى Membership؛ تُنسخ كـTenant Roles.
- Manifest المقفول Snapshot نهائي؛ التصحيح يكون بعملية إصدار/تصحيح جديدة، لا UPDATE مباشر.

## بوابات الاعتماد

لا ينتقل Candidate إلى `schema.prisma` التشغيلي قبل:

1. حسم كل P0 في `open-decisions.md`.
2. مراجعة محاسب قانوني/خبير مالي لنماذج القيود والاعتراف بالإيراد والضرائب.
3. تشغيل SQL contract على قاعدة disposable نظيفة.
4. نجاح اختبارات tenant escape والتزامن والقيد المتوازن والاسترداد والتسويات.
5. كتابة Migration/Backfill plan من المخطط الحالي ومراجعته على نسخة بيانات مجهولة.
6. Security review لـRLS وأدوار قاعدة البيانات ومسارات background workers/webhooks.

## أوامر التحقق

```bash
cd backend
pnpm exec prisma format --schema prisma/v1/schema.prisma
pnpm exec prisma validate --schema prisma/v1/schema.prisma
```

لتوليد SQL أساسي دون تطبيقه:

```bash
pnpm exec prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/v1/schema.prisma \
  --script > /tmp/ticketty-v1-base.sql
```

بعد ذلك يطبق SQL الأساسي ثم `001_contract_constraints.sql` ثم `002_row_level_security.sql` على قاعدة اختبار disposable فقط.
