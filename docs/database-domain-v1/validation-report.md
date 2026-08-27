# Validation Report — Database Contract v1.0

## النطاق

تم التحقق من الحزمة المرشحة فقط، دون استبدال `backend/prisma/schema.prisma` أو تطبيق Migration على قاعدة المشروع الحالية.

## نتائج آلية

| الفحص | النتيجة |
|---|---|
| Prisma format | ناجح |
| Prisma validate للمخطط المرشح | ناجح |
| توليد SQL من empty database | ناجح |
| تطبيق Base SQL على PostgreSQL disposable | ناجح |
| تطبيق SQL CHECKs/indexes/exclusion/triggers | ناجح |
| تطبيق FORCE RLS policies | ناجح |
| اختبار Tenant escape بدور runtime غير مالك | ناجح |
| التحقق من Runtime role DDL ثم تنظيف الأدوار المؤقتة | ناجح |
| Contract smoke tests | ناجحة |
| Existing backend Jest tests | 3 suites / 7 tests ناجحة |
| تنظيف قاعدة الاختبار المؤقتة | ناجح |

## ما تغطيه Smoke Tests

- رفض Route له نفس origin/destination.
- رفض تداخل Trip لنفس Bus/Driver.
- رفض وجود SeatHold ACTIVE ثانٍ للمقعد والتحقق المؤجل من تطابقه مع TripSeat.
- رفض BookingItem فعال ثانٍ لنفس المقعد عبر حجز مختلف.
- رفض إدراج JournalEntry بحالة POSTED مباشرة.
- رفض Posting لقيد غير متوازن.
- قبول القيد المتوازن داخل فترة OPEN.
- رفض تعديل JournalEntry بعد Posting.
- رفض رجوع Payment مكتمل إلى FAILED ورفض تعديل allocations بعد اكتماله.
- رفض Refund مكتمل أكبر من Payment.
- رفض تعديل AuditLog.
- التحقق من تثبيت RLS policies على tenant tables.
- اختبار RLS فعلي بدور PostgreSQL مؤقت غير مالك وبدون `BYPASSRLS`: Tenant A مرئي، Tenant B مخفي، والسياق malformed يمنع القراءة.

## ما لا تثبته هذه الاختبارات بعد

- correctness الكامل لسياسات الضرائب والاعتراف بالإيراد؛ القرارات مفتوحة.
- load/concurrency behavior تحت مئات الجلسات؛ يلزم integration stress suite.
- مراجعة أدوار النشر النهائية وتدوير أسرارها؛ الاختبار يستخدم دورًا مؤقتًا محدودًا، بينما `003_runtime_roles.sql` يحتاج مراجعة أسماء الأدوار في كل بيئة.
- migration/backfill من المخطط الحالي إلى المرشح.
- تشفير PII وإدارة المفاتيح وQR/device signing.
- Payment provider حقيقي وwebhook signatures.
- Offline conflict reconciliation على أجهزة حقيقية.

## إعادة التشغيل

```bash
cd backend
./prisma/v1/validate-contract.sh
```

السكريبت ينشئ قاعدة مؤقتة مستقلة ويحذفها عند الخروج. يمنع تشغيله باتصال Production.
