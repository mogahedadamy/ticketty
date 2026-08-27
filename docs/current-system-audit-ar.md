# تقرير الحالة والجاهزية الإنتاجية — Ticketty ERP

**تاريخ المراجعة:** 24 أغسطس 2026
**نطاق المراجعة:** `backend/` و`web/` و`prisma/` و`docs/` وخطة المنتج `ticketty-erp-plan.md`
**نوع المراجعة:** مراجعة ساكنة للكود والإعدادات + تشغيل Build/Lint/Tests/Prisma validation/dependency audit.
**القرار المختصر:** **NO-GO — النظام غير جاهز للإنتاج حالياً.**

> هذا التقرير يقيّم الموجود في المستودع الحالي فقط. لم يُنفذ اختبار اختراق خارجي، أو Load Test، أو Disaster-Recovery Drill؛ لذلك لا يجوز تفسير نجاح البناء والاختبارات الحالية على أنه إثبات للأمان أو الأداء الإنتاجي.

---

## 1. الخلاصة التنفيذية

Ticketty ليس مشروعاً فارغاً أو مجرد واجهات؛ توجد نواة عملية مترابطة وقابلة لإعادة الاستخدام مبنية على NestJS وPrisma/PostgreSQL وNext.js. المسار الأساسي التالي موجود فعلياً بدرجة جيدة:

`رحلة → خريطة مقاعد → Hold → حجز متعدد المقاعد → تسجيل دفع → تذاكر وQR → منفستو → Check-in`

كما توجد وحدات حقيقية للفروع والمستخدمين والصلاحيات والعملاء والمسارات والأسطول والسائقين والوكلاء والعمولات والمصروفات والتسويات والتقارير.

لكن النسخة الحالية أقرب إلى **Pre-production vertical slice / pre-alpha متقدم**، وليست ERP مكتملة ولا MVP آمناً للإطلاق العام. توجد مخاطر حرجة في:

1. صلاحيات الوكيل والوصول الأفقي لبيانات وكلاء آخرين.
2. عزل الشركات Multi-tenancy وبعض العلاقات التي تسمح بربط بيانات بين شركتين.
3. سباقات الإلغاء والاسترداد التي قد تنتج Refund مزدوجاً.
4. سباق الحجز مع إلغاء الرحلة أو قفل المنفستو.
5. احتساب التسويات وإمكانية التكرار أو إدخال عمولات معكوسة.
6. السماح المحتمل بحجز مقاعد غير قابلة للبيع عبر الـAPI.
7. محدودية شديدة في الاختبارات وعدم وجود اختبارات Web.
8. غياب بنية التشغيل الإنتاجي: CI/CD، Containers، Health Checks، Observability، Backup/Restore automation، Runbooks.

### التقدير العام

هذه نسب هندسية تقريبية مبنية على مقارنة الخطة بالمصدر، وليست قياساً تجارياً نهائياً:

| المحور | التقدير الحالي | الحكم |
|---|---:|---|
| تغطية الرؤية الكاملة في الخطة | 40–45% | نواة جيدة، أجزاء واسعة مفقودة |
| تغطية MVP الوظيفية | 55–60% | معظم المسار الأساسي موجود لكن ناقص |
| الأمن وعزل البيانات | 35–45% | ضوابط أساسية جيدة، مع ثغرات عالية الأثر |
| الاستقرار وصحة المعاملات | 40–50% | الحجز الأساسي جيد، المالية والتزامن تحتاج تقوية |
| الاختبارات وضمان الجودة | 15–20% | 8 اختبارات Backend فقط، وصفر Web |
| التشغيل والمراقبة والتعافي | 10–20% | سياسات مكتوبة دون تنفيذ تشغيلي كافٍ |
| الجاهزية الإنتاجية الكلية | 25–30% | غير جاهز للإنتاج |

### القرار الاستراتيجي

- **لا أنصح بإعادة بناء النظام من الصفر.**
- أنصح بخيار **Reuse & Harden**: الاحتفاظ بالنواة الحالية، ثم إصلاح الأمان والتزامن وسلامة السجل المالي، وبعدها إكمال وظائف MVP وبنية التشغيل.
- **لا يُنشر الآن ببيانات أو أموال حقيقية.** يمكن استخدامه في بيئة تطوير/عرض داخلية ببيانات وهمية فقط.

---

## 2. ما تم التحقق منه عملياً

| الفحص | النتيجة |
|---|---|
| Backend TypeScript/Build | نجح `nest build` |
| Backend Unit Tests | نجحت 3 suites و7 tests |
| Backend E2E | نجح اختبار واحد فقط، وهو Hello World |
| Prisma Schema Validation | نجح |
| Prisma migrations | 8 migrations؛ أفاد الفحص أن قاعدة البيانات الحالية محدثة |
| Web ESLint | نجح |
| Web Production Build | نجح؛ جرى توليد 14 route |
| Web Tests | لا توجد ملفات اختبار ولا test script |
| Web dependency audit | لا توجد ثغرات معروفة بحسب `pnpm audit --prod` وقت الفحص |
| Backend dependency audit | فشل بسبب ثغرة High في `deepmerge-ts <8.0.0` عبر Prisma config/tooling |
| Git history | لا يوجد أي commit؛ جميع ملفات المشروع غير متتبعة |

### ملاحظة على نتائج الفحص

نجاح Build يعني أن الكود يُترجم، وليس أنه صحيح وظيفياً أو آمناً. تغطية الاختبارات الحالية لا تشمل حجوزات متزامنة، عزل شركتين، صلاحيات الوكلاء، الاسترداد، التسويات، المنفستو، أو التقارير.

---

## 3. جرد النظام الحالي

### Backend

- NestJS 11 + Prisma 6 + PostgreSQL.
- وحدات: Authentication، Administration، Customers، Routes، Fleet، Drivers، Trips، Bookings/Tickets، Payments، Agents، Expenses، Settlements، Manifests، Reports، Audit.
- 24 نموذج Prisma تقريباً، من Organization إلى AuditLog.
- Global JWT guard + permissions guard + throttling.
- DTO validation عامة مع whitelist ومنع الحقول غير المعروفة.
- معاملات وقفل advisory في مسار إنشاء الحجز.

### Web

- Next.js 16 + React 19 + TypeScript + Tailwind.
- واجهة عربية RTL.
- الصفحات الحالية: Login، Dashboard، Bookings، Boarding، Trips، Buses، Agents، Manifests، Financial، Settings.
- TanStack Query للبيانات.
- BFF يحتفظ بالـJWT في HttpOnly Cookie بدلاً من Local Storage.
- QR generation/scanning وطباعة من المتصفح.

### الوثائق

توجد وثائق مبادئ هندسية وسياسات أمن وامتثال واستجابة للحوادث واستمرارية أعمال واحتفاظ بالبيانات. هذه نقطة جيدة من ناحية الاتجاه، لكنها حالياً **وثائق مستهدفة أكثر من كونها ضوابط منفذة وقابلة للإثبات**.

---

## 4. حالة الوحدات: المكتمل والمتبقي

> كلمة "مكتمل" هنا تعني وظيفياً داخل النسخة الحالية، وليس Production-complete. فعلياً لا توجد وحدة يمكن اعتبارها مكتملة إنتاجياً مع الأمن والاختبارات والتشغيل.

| الوحدة | الحالة | تقدير تقريبي | الموجود | المتبقي المهم |
|---|---|---:|---|---|
| الشركات والفروع وMulti-tenancy | جزئي | 60% | Organization/Branch وربط معظم الكيانات بـorganizationId | Super Admin SaaS، إغلاق ثغرات cross-tenant، قيود DB دفاعية/RLS |
| تسجيل الدخول وRBAC | جزئي قوي | 70% | JWT، bcrypt، إعادة جلب المستخدم والدور، permissions دقيقة | MFA، refresh/revocation، lockout، session/device management، grant ceilings |
| العملاء | جزئي | 55% | CRUD وبحث وربط بالحجوزات | صفحة عميل مخصصة وسجل رحلات/بحث أسرع في Web |
| المسارات والرحلات | جزئي | 60% | مسارات وتوقفات وإنشاء/تعديل/إلغاء رحلة | Schedule دوري، تأجيل، أسعار موسمية/درجات، state machine صارمة، منع تعارض باص/سائق |
| الأسطول والمقاعد والسائقون | جزئي | 55% | Bus/Driver/SeatTemplate وحالات جاهزية | صيانة مجدولة وتاريخية، ملكية وتأمين، طاقم مساعد، ضوابط أقوى لأنواع المقاعد |
| الحجز والتذاكر | جزئي قوي | 70% | Hold، حجز متعدد المقاعد، idempotency، دفع مسجل، QR، إلغاء/Refund | Change-seat، No-show، PDF خادمي، سياسات أوسع، اختبارات تنافسية |
| شاشة المقاعد الحية | جزئي | 50% | مخطط تفاعلي وREST hold/release | WebSocket؛ الموجود polling كل 15 ثانية، reconnect/offline UX، منع حجز كل seatType غير صالح |
| الوكلاء والعمولات | جزئي | 50% | وكيل داخلي/خارجي، نسبة/قيمة ثابتة، عمولة تلقائية | Own-vs-all authorization، wallet/credit limit، قواعد route×class، hierarchy، شاشة ذاتية آمنة |
| المدفوعات | جزئي ضعيف | 30% | أنواع طرق الدفع، مرجع، Payment record وRefund | Gateway adapter، تكامل حقيقي، webhook signature، reconciliation؛ UI يدعم عملياً Cash/Card فقط |
| المصروفات | جزئي قوي | 65% | ربط بفرع/رحلة/باص، approval، adjustments | تحقق tenant للعلاقات، دورة مالية/محاسبية متكاملة |
| التسويات | جزئي مع عيوب | 40% | generate/list/settle | SettlementLine، منع overlap/duplicate، استبعاد reversals، immutability، تسوية صندوق/محطة، طباعة |
| Ledger | مفقود | 0% | — | LedgerEntry وdouble-entry/reconciliation/export |
| التقارير | جزئي | 50% | Dashboard، sales، financial، occupancy | توحيد gross/net/refunds، aggregation في DB، pagination/window limits، exports وأبعاد كاملة |
| المنفستو | جزئي | 55% | توليد بيانات وقفل وطباعة Browser | PDF خادمي، immutable snapshot، reprint audit، توقيع/أمتعة، معالجة السباقات |
| المستندات | مفقود | 0% | — | تخزين آمن، رخص/عقود/هويات، تنبيهات انتهاء، S3 |
| الإشعارات | مفقود | 0% | — | SMS/WhatsApp/in-app، Queue، retries/DLQ |
| التكاملات | شبه مفقود | 5% | أسماء طرق دفع فقط | مزود دفع فعلي، SMS، abstraction/adapters |
| Audit Log | جزئي | 35% | model وخدمة وبعض الأحداث | تغطية كل العمليات الحساسة، viewer، request/IP/outcome، atomic/outbox، tamper resistance |
| العربي وRTL | أساس قوي | 85% | Arabic RTL فعلي | i18n/English، Hijri optional، مراجعة accessibility كاملة |
| B2C / AI / Offline full sync | مفقود/مؤجل | 0% | — | مقبول تأجيل B2C/AI؛ تحمل ضعف الشبكة يحتاج معالجة قبل السوق المستهدف |

---

## 5. نقاط القوة الحالية

1. **بنية قابلة للاستمرار:** فصل Backend وWeb ووحدات Domain واضح إجمالاً.
2. **الحجز ليس Mock:** توجد معاملة حقيقية تنشئ Booking وPayment وTickets وCommission.
3. **تقليل Double Booking تطبيقياً:** استخدام idempotency ومطالبة شرطية بالمقعد وقفل PostgreSQL advisory.
4. **ضوابط API أساسية جيدة:** Helmet، CORS محدود، validation whitelist، JWT وpermissions guards.
5. **إعادة التحقق من المستخدم:** الـguard يعيد قراءة المستخدم والدور والمؤسسة في كل طلب، فتفعيل/تعطيل الحساب والصلاحيات يسري سريعاً.
6. **حماية الرمز في الويب:** JWT داخل HttpOnly/SameSite Cookie عبر BFF، وليس Local Storage.
7. **واجهة عربية عملية:** حجز، مقاعد، QR، صعود، منفستو، مالية، وكلاء وإعدادات مرتبطة بالـAPI.
8. **Schema مالية أولية جيدة:** Decimal للمبالغ، idempotency keys، Refund/Adjustment/Reversal concepts.
9. **وجود وثائق سياسات:** اتجاه جيد للحوكمة حتى لو لم يُنفذ تشغيلياً بعد.

---

## 6. تدقيق الأمان

### 6.1 مخاطر عالية — Release Blockers

#### SEC-H1: الوكيل الخارجي يمكنه الوصول الأفقي لبيانات وكلاء آخرين

صلاحيات AGENT الحالية واسعة على مستوى الفرع/الشركة، بينما استعلامات الحجوزات والتذاكر والوكلاء لا تفرض ملكية `agent.userId = currentUser`. قد يستطيع وكيل الاطلاع على بيانات ركاب ومدفوعات وعمولات ليست له، وإلغاء حجوزات أو تنفيذ check-in ضمن نطاق أوسع من المطلوب.

**الأثر:** كشف PII وتعديل عمليات الغير.
**المعالجة:** صلاحيات `own` مقابل `all`، وفرض ownership في كل query/mutation واختبارات object-level authorization.

#### SEC-H2: استعلامات التذاكر تفشل باتجاه السماح عند غياب organizationId

`User.organizationId` قابل لأن يكون null. بعض استعلامات Tickets تستخدم `organizationId: user.orgId ?? undefined`؛ Prisma يحذف شرط undefined، ما قد يتحول لاستعلام عبر كل الشركات لمستخدم سيئ التهيئة ولديه صلاحية tickets.

**الأثر:** تسريب بيانات بين الشركات وربما check-in عابر للـtenant.
**المعالجة:** `requireOrgId()` افتراضياً، وفصل مسار system admin بوضوح وعدم استخدام undefined في حدود الأمن.

#### SEC-H3: Cross-tenant foreign-reference injection

إنشاء/تعديل Bus يقبل `seatTemplateId`، وAgent يقبل `userId`، وExpense يقبل `tripId/busId` دون تحقق كامل أن المرجع ينتمي لنفس organization. مفاتيح FK العادية تثبت وجود السجل فقط ولا تثبت تطابق الشركة.

**الأثر:** ربط وتسريب بيانات بين tenants وفساد تكامل البيانات.
**المعالجة:** تحقق داخل transaction + composite tenant foreign keys أو RLS/triggers كدفاع إضافي.

#### SEC-H4: Refund مزدوج تحت التزامن

مسار إلغاء الحجز/الرحلة يقرأ الحالة والمبلغ، ينشئ Refund مكتمل، ثم يحدث Payment/Booking. طلبان متزامنان قد يقرآن الحالة القديمة وينشئان Refundين، ولا يوجد unique idempotency key على Refund.

**الأثر:** دفع مالي مكرر وسجل محاسبي خاطئ.
**المعالجة:** row locks/conditional transitions + refund idempotency constraint + integration concurrency tests.

#### SEC-H5: سباق الحجز مع قفل المنفستو أو إلغاء الرحلة

فحص حالة الرحلة في بداية معاملة الحجز لا يتشارك قفلاً موحداً مع lock manifest أو cancel trip. يمكن نظرياً أن يكتمل حجز بعد بدء المغادرة/الإلغاء.

**الأثر:** تذكرة مؤكدة بعد مغادرة أو إلغاء الرحلة.
**المعالجة:** قفل صف الرحلة أو optimistic version، وتوحيد جميع state transitions وإعادة التحقق قبل commit.

#### SEC-H6: خلل التسويات

توليد التسوية لا يستبعد دائماً العمولات التي تم عكسها، ويسمح بفترات متداخلة، ويستخدم find-then-create بلا unique constraint، ويمكنه تعديل سجل تمت تسويته.

**الأثر:** دفع عمولات مضاعفة وتغيير تاريخ مالي نهائي.
**المعالجة:** SettlementLine، ربط العمولة بتسوية واحدة، استبعاد `reversedAt`، منع overlap، immutability بعد SETTLED، وقفل/قيد DB.

#### SEC-H7: إعدادات الإنتاج والأسرار غير مقواة

لا يوجد schema تحقق كامل للبيئة. يكفي أن يكون JWT_SECRET غير فارغ؛ لا issuer/audience/algorithm policy، ولا حد إلزامي قوي، ولا سياسة rotation/revocation. لوحظ أن إعداد البيئة النشط يبدو تطويرياً ويجب تغييره قبل أي نشر، دون نسخ قيمته في هذا التقرير.

**المعالجة:** تدوير الأسرار، secret manager، تحقق fail-fast، JWT algorithm/issuer/audience، جلسات أقصر مع refresh/revocation، ومنع dev values في production.

#### SEC-H8: إمكانية بيع مقعد غير صالح عبر API

إنشاء الرحلة ينسخ نوع المقعد لكن يترك حالته AVAILABLE، ومسار hold/create يركز على status أكثر من seatType. الاعتماد على إخفاء المقعد في الواجهة ليس حاجزاً أمنياً.

**الأثر:** بيع DRIVER/BLOCKED/DISABLED عند استدعاء API مباشرة أو بسبب اختلاف UI.
**المعالجة:** invariant server-side يمنع كل نوع غير قابل للبيع، مع tests وقيد/حالة صريحة.

### 6.2 مخاطر متوسطة

1. مستخدم يملك `settings.write` قد ينشئ دوراً بصلاحية `*` دون grant ceiling واضح.
2. لا MFA للإدارة والمالية.
3. لا refresh token أو revocation list أو إدارة جلسات/أجهزة.
4. Audit جزئي: محاولات الدخول الفاشلة وعمليات CRUD عديدة غير مسجلة.
5. سجل التدقيق ليس دائماً ذرياً مع العملية؛ قد تتغير البيانات ويفشل الرد بسبب فشل audit لاحق.
6. استجابات Tickets قد تعرض هاتف/هوية/Payments دون فصل صلاحيات PII والمالية.
7. Rate limiting داخل الذاكرة غير كافٍ عند عدة instances، ولا توجد Redis store موحدة.
8. لا توثيق trusted proxy/IP extraction للإنتاج.
9. لا قيود DB كافية للمبالغ غير السالبة، refund ≤ payment، النسبة ≤100، والفترات الصحيحة.
10. أخطاء Prisma uniqueness/FK قد تظهر 500 بدلاً من 409/400 بسبب غياب exception mapping موحد.
11. حماية CSRF تعتمد على same-origin check وSameSite=Lax؛ جيدة كأساس، لكن يجب اختبار سلوك reverse proxy وOrigin/Host في بيئة النشر.
12. لا CSP مخصصة مثبتة في هذا الفحص، ولا Security Headers tests آلية.

### 6.3 ثغرات التبعيات

- Web: لا ثغرات معروفة وفق `pnpm audit --prod` وقت الفحص.
- Backend: ثغرة High في `deepmerge-ts <8.0.0` عبر Prisma config/tooling (`GHSA-ggr8-5vv4-36mx`). قد يكون سطح وصولها من HTTP محدوداً، لكنها تحتاج Upgrade أو توثيق قبول مخاطر بعد تحقق رسمي.

---

## 7. الاستقرار وصحة البيانات

### الجوانب الإيجابية

- إنشاء الحجز داخل transaction.
- idempotency key للحجز والدفع.
- claim شرطي للمقاعد.
- Decimal للمبالغ بدلاً من float.
- وجود Refund وExpenseAdjustment وCommission reversal بدلاً من الحذف المباشر في بعض العمليات.

### المخاطر

1. لا توجد اختبارات تنافسية تثبت فعلياً صفر Double Booking.
2. Refund race قد يكرر دفعاً خارجياً.
3. Trip/Manifest/Booking state transitions غير موحدة بقفل أو state machine.
4. Hold المنتهي يُنظف غالباً عند قراءة المقاعد، وليس عبر scheduler موثوق أو takeover ذري شامل.
5. لا منع لتعارض نفس الباص أو السائق في رحلتين متزامنتين.
6. بعض العلاقات tenant-denormalized بلا قيود تطابق في DB.
7. قفل المنفستو ليس immutable بشكل كامل؛ التوليد يمكن أن يغير النسخة في حالات يجب منعها.
8. لا Ledger؛ لذلك لا يمكن إعادة بناء الوضع المالي أو إجراء reconciliation محاسبي موثوق.
9. dashboard/sales والـfinancial لا تتعامل مع refunds والمصروفات بنفس التعريف، فتظهر أرقام مختلفة.
10. لا Queue/Outbox للعمليات الخارجية أو الأحداث؛ فشل مزود مستقبلي قد يترك حالات جزئية ما لم يُصمم بعناية.

### حكم الاستقرار

- مناسب لتجربة تطوير داخلية محدودة.
- غير مناسب حالياً للمعاملات المالية الحقيقية أو العمل متعدد الشركات دون الإصلاحات.
- الاستقرار المترجم/build-time جيد، لكن الاستقرار التشغيلي والمالي غير مثبت.

---

## 8. الأداء والسرعة

### ما يمكن إثباته حالياً

- Web production build نجح بسرعة في بيئة التطوير الحالية.
- الواجهة تستخدم TanStack Query وstale times في مواضع متعددة.
- فهارس Prisma موجودة على عدد من مفاتيح organization/branch/date/status.

### نقاط الخطر

1. كثير من قوائم Backend بلا pagination إلزامية: الحجوزات والتذاكر والمدفوعات والوكلاء والسائقون والرحلات والتسويات.
2. بعض استعلامات الوكلاء تعيد تاريخ العمولات كاملاً.
3. التقارير تحمل نطاقات كاملة إلى Node وتحسبها في الذاكرة بدلاً من SQL aggregation.
4. لا سقف واضح لفترة التقارير؛ شهر/سنة/سنوات قد يرفع الذاكرة وزمن الاستجابة.
5. المقاعد ليست WebSocket؛ يجري polling كل 15 ثانية، فلا توجد لحظية حقيقية ويزيد الحمل مع عدد الباعة.
6. JwtAuthGuard ينفذ DB lookup لكل طلب. هذا مفيد للأمان، لكنه يحتاج indexing/cache محسوب وقياس تحت الحمل.
7. لا Redis للأقفال/الحصص/الجلسات أو throttling موزع.
8. لا CDN/static asset strategy أو performance budgets موثقة.
9. لا load/stress tests، ولا قياس p95/p99، ولا إثبات لهدف الحجز أقل من 60 ثانية أو المنفستو أقل من 5 ثوانٍ.

### الحكم على السرعة

**لا توجد أدلة كافية للقول إن النظام سريع Production.** الأداء يبدو مقبولاً على بيانات تطوير، لكن التصميم الحالي سيتدهور مع نمو السجلات بسبب unbounded queries والتجميع داخل التطبيق. يلزم Benchmark حقيقي ببيانات مماثلة للإنتاج.

### اختبارات الأداء المطلوبة

- 100–500 بائع متزامن على نفس الرحلة.
- سباق Hold/Book للمقعد نفسه آلاف المرات.
- تقارير على 1–10 ملايين Payment/Ticket.
- قياس p50/p95/p99 لكل endpoint حرج.
- soak test لمدة 4–8 ساعات.
- اختبار فقد DB/Redis/مزود الدفع وإعادة الاتصال.

---

## 9. الواجهة وتجربة المستخدم

### الموجود الجيد

- RTL عربي فعلي.
- Layout وصفحات Feature متصلة بالـAPI.
- حالات Loading/Empty/Error في أجزاء متعددة.
- شاشة حجز ومقاعد وQR scanner وطباعة متصفح.
- BFF يقلل تعرض رمز الجلسة للـJavaScript.

### الفجوات

1. قائمة التنقل تعرض الأقسام لكل المستخدمين ولا تُفلتر بالكامل حسب الصلاحيات؛ Backend يمنع بعض الطلبات لكن UX لا يطابق الدور.
2. بعض الصفحات تعتمد على فشل API بدلاً من route-level permission guard واضح.
3. لا اختبارات Component/Integration/E2E أو accessibility آلية.
4. لا Error Boundary/telemetry واضحة للحالات غير المتوقعة.
5. لا offline indicator/retry queue؛ رغم أن السوق المستهدف يعاني ضعف الاتصال.
6. عبارة حالة الأنظمة/آخر مزامنة تبدو ثابتة وليست health status حقيقياً.
7. لا صفحة عملاء مستقلة رغم وجود Backend.
8. الطباعة Browser-based وليست PDF خادمية ثابتة قابلة للأرشفة والتدقيق.
9. إعداد API غير متسق: README/backend example على 3001، بينما `web/.env.example` وproxy fallback يستخدمان 4000 في مواضع.
10. ملفات Features عديدة مكتوبة كسطر طويل جداً، ما يضعف القراءة والمراجعة والصيانة حتى لو نجح lint.

---

## 10. الاختبارات والجودة

### الوضع الحالي

- Backend: 3 suites / 7 unit tests.
- E2E: اختبار واحد لـHello World ولا يطبق بالضرورة نفس global pipes/guards/prefix المستخدمة في `main.ts`.
- Web: لا توجد اختبارات.
- لا coverage gate.
- لا CI يمنع merge عند فشل lint/build/test/security scan.

### الاختبارات الضرورية قبل الإنتاج

1. مصفوفة RBAC لكل role × endpoint × operation.
2. عزل شركتين وفروع متعددة، بما في ذلك IDs مسروقة من tenant آخر.
3. Agent ownership واختبارات IDOR/BOLA.
4. ضغط حجز المقعد نفسه ومنع Double Booking.
5. Hold expiry/takeover/release.
6. إلغاء حجز/رحلة متزامن وRefund idempotency.
7. Manifest lock مع حجز/إلغاء متزامن.
8. Settlement overlap/reversal/immutability.
9. تقارير gross/net/refund/expense consistency.
10. Web E2E للـlogin والحجز والطباعة والصعود والصلاحيات.
11. Migration tests على نسخة DB حقيقية من الإصدار السابق.
12. Security tests: CSRF، headers، brute force، session expiration، tenant escape.

### هدف مقترح

لا يكفي رقم coverage وحده، لكن كبوابة أولية:

- Domain services الحرجة: 80%+ branch coverage.
- RBAC/tenancy/finance/concurrency: سيناريوهات تكامل إلزامية 100% للـinvariants.
- Web critical flows: Playwright E2E على الأقل لكل دور رئيسي.

---

## 11. التشغيل وDevOps والاستمرارية

### المفقود حالياً

- لا Dockerfile/Compose إنتاجي.
- لا GitHub Actions أو CI/CD آخر.
- لا health/readiness/liveness endpoints مرتبطة بـDB.
- لا structured logging أو correlation IDs.
- لا metrics/tracing/error tracking/alerts.
- لا secret manager configuration.
- لا backup automation أو دليل Restore منفذ.
- لا migration/rollback/deployment runbook.
- لا Infrastructure as Code.
- لا بيئات staging/production موثقة.
- لا SLA/SLO أو RTO/RPO معتمد ومقاس.
- لا commits أو tags أو release history أصلاً.

### التناقض بين السياسة والتنفيذ

وثائق الاستمرارية تطلب Queue/DLQ ونسخاً احتياطية متعددة المواقع واختبارات Restore وتوثيق RTO/RPO. لا توجد أدلة تنفيذ لهذه البنود في المستودع. وجود السياسة مفيد، لكنه لا يحقق الامتثال أو الاستمرارية دون تشغيل واختبارات وأدلة.

---

## 12. هل النظام جاهز للإنتاج؟

### الإجابة

**لا.** القرار الحالي **NO-GO**.

### لماذا؟

لأن الإنتاج يعني أكثر من نجاح Build. يجب أن يثبت النظام:

- عزل كل شركة وكل وكيل دون استثناء.
- عدم تكرار بيع أو Refund أو Settlement تحت التزامن.
- صحة سجل مالي قابل للمصالحة.
- استعادة الخدمة والبيانات عند الفشل.
- مراقبة وإنذار وتشخيص.
- نشر قابل للتكرار والرجوع.
- اختبارات تغطي السيناريوهات الحرجة.

هذه الشروط غير متحققة حالياً.

### ما الاستخدام الآمن الآن؟

- Demo داخلي ببيانات وهمية.
- تطوير واستعراض UX.
- اختبار محدود داخل شبكة غير عامة.

### ما غير المسموح به حالياً؟

- بيانات ركاب حقيقية على خدمة عامة.
- ربط دفع حقيقي.
- تشغيل عدة شركات دون إصلاح tenancy.
- الاعتماد عليه كسجل مالي نهائي.
- إطلاق عام أو Pilot مالي قبل إغلاق P0.

---

## 13. خارطة الطريق المقترحة

### المرحلة 0 — تثبيت خط الأساس والحوكمة (2–3 أيام)

- إنشاء أول commit نظيف وتثبيت baseline tag.
- توحيد المنافذ وملفات `.env.example`.
- إضافة CI أولي: format-check، lint، typecheck، unit، build، dependency/secret scan.
- منع secrets وبيانات demo في production.

**بوابة الخروج:** build/test موحد من clean checkout داخل CI.

### المرحلة 1 — إغلاق مخاطر P0 الأمنية والمالية (1–2 أسبوع)

- Agent own-vs-all authorization.
- منع orgless fail-open.
- تحقق cross-tenant لكل FK + composite constraints/RLS حسب التصميم.
- منع حجز seatType غير صالح.
- Refund idempotency وقفل التزامن.
- Trip/Booking/Manifest state locking.
- إصلاح Settlement reversal/overlap/immutability.
- تدوير الأسرار والتحقق الصارم من config.

**بوابة الخروج:** اختبارات tenant escape وconcurrency وrefund وsettlement كلها خضراء.

### المرحلة 2 — إكمال Vertical Slice الإنتاجي (2–3 أسابيع)

- WebSocket/Redis للمقاعد.
- cleanup موثوق للـholds.
- PDF server-side للتذكرة والمنفستو.
- immutable manifest snapshot + reprint audit.
- Change-seat وNo-show.
- Customer profile/history Web.
- فلترة routes/navigation حسب الصلاحيات وroute guards.
- Audit viewer.

**بوابة الخروج:** stress test يثبت عدم Double Booking، والمنفستو ثابت بعد القفل، وتنجح رحلة المستخدم E2E.

### المرحلة 3 — Money MVP صحيح (3–4 أسابيع)

- LedgerEntry وقيود متوازنة.
- SettlementLine وreconciliation.
- Payment adapter + مزود حقيقي واحد مع signed webhook وidempotency.
- قواعد عمولة متقدمة وwallet/credit limits.
- تعريف موحد gross/net/refund/expense في التقارير.
- exports محاسبية.

**بوابة الخروج:** يمكن إعادة بناء كل رصيد من ledger، وتنجح سيناريوهات reversal/refund/settlement.

### المرحلة 4 — Production Operations (2–4 أسابيع)

- Containers وartifact immutable.
- Staging مماثلة للإنتاج.
- health/readiness، logs منظمة، metrics، tracing، error tracking، alerts.
- DB backups مشفرة واختبار restore.
- Runbooks للحوادث والrollback والمهاجرات.
- Redis-backed throttling/queues.
- MFA للإدارة والمالية وسياسة session/revocation.
- Load/soak/failure/security tests.

**بوابة الخروج:** restore drill ناجح، SLOs مقاسة، security sign-off، ولا Critical/High مفتوحة.

### المرحلة 5 — Pilot مضبوط (2–4 أسابيع)

- شركة واحدة وفرع محدود.
- مستخدمون وبيانات رئيسية مراجعة.
- تدريب وصلاحيات فعلية.
- طابعات حرارية وA4 مجربة.
- مراقبة يومية ومصالحة مالية يدوية موازية.
- خطة rollback ودعم مباشر.

**بوابة الخروج:** فترة تشغيل مستقرة ومصالحة مالية بلا فروقات قبل التوسع.

---

## 14. قائمة Release Gates النهائية

لا يُعتمد Production إلا عند تحقق جميع البنود التالية:

- [ ] إغلاق جميع High/Critical الأمنية.
- [ ] اختبارات Multi-tenant وAgent ownership ناجحة.
- [ ] اختبارات Double Booking/Refund/Settlement concurrency ناجحة.
- [ ] Ledger/Reconciliation أو قرار نطاق واضح يمنع الادعاء المالي غير المدعوم.
- [ ] تكامل الدفع الحقيقي يتحقق من webhook ولا يعتمد على مرجع يدوي.
- [ ] Audit يغطي كل العمليات المالية والحساسة.
- [ ] CI/CD وreview وrelease tags موجودة.
- [ ] Health/metrics/logs/alerts تعمل في staging.
- [ ] Backup وRestore مجربان بنتيجة موثقة.
- [ ] Load test يحقق أهداف p95/p99 المتفق عليها.
- [ ] Penetration test ومراجعة Security نهائية.
- [ ] لا ثغرات dependency High/Critical غير مقبولة رسمياً.
- [ ] Runbooks وRTO/RPO وrollback معتمدة.
- [ ] Pilot محدود ناجح قبل التوسع.

---

## 15. الأدلة المرجعية الرئيسية

- تركيب الوحدات والحراس: `backend/src/app.module.ts:41-72`
- Helmet/CORS/Validation: `backend/src/main.ts:9-21`
- التحقق الحي من المستخدم: `backend/src/common/guards/jwt-auth.guard.ts:37-66`
- permission matching: `backend/src/common/guards/permissions.guard.ts:14-18`
- نماذج الـtenant والمال والتدقيق: `backend/prisma/schema.prisma:17-716`
- منطق الحجز والقفل: `backend/src/bookings/bookings.service.ts`
- التذاكر ونطاق المؤسسة: `backend/src/bookings/tickets.service.ts`
- إلغاء الرحلات والاسترداد: `backend/src/trips/trips.service.ts`
- التسويات: `backend/src/settlements/settlements.service.ts`
- التقارير: `backend/src/reports/reports.service.ts`
- BFF proxy: `web/src/app/api/proxy/[...path]/route.ts:20-55`
- Cookie session: `web/src/app/api/session/route.ts:26-80`
- حماية dashboard: `web/src/app/(dashboard)/layout.tsx:10-13`
- التنقل: `web/src/config/navigation.ts:30-54`
- polling المقاعد: `web/src/features/bookings/hooks/use-trip-seats.ts:11-18`
- المبادئ الهندسية: `docs/engineering-principles.md:5-32`
- استمرارية الأعمال المستهدفة: `docs/compliance/business-continuity.md:11-28`

---

## 16. الحكم النهائي

**Ticketty لديه أساس تقني يستحق الاستمرار، لكنه غير جاهز للإنتاج اليوم.** الأولوية ليست إضافة شاشات جديدة، بل تثبيت حدود الشركات والوكلاء، وضمان invariants المقعد والمال تحت التزامن، وإكمال سجل التدقيق والاختبارات، ثم بناء طبقة تشغيل ومراقبة وتعافٍ حقيقية. بعد إغلاق هذه البنود، يمكن إطلاق Pilot محدود ومراقب، وليس إطلاقاً عاماً مباشراً.
