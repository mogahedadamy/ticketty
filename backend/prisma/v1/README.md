# Prisma Candidate v1.0

هذه الحزمة منفصلة عمدًا عن المخطط التشغيلي الحالي.

- المخطط الحالي: `backend/prisma/schema.prisma`
- المخطط المرشح: `backend/prisma/v1/schema.prisma`
- `prisma.config.ts` لم يتغير، لذلك أوامر migrate العادية لا تطبق المرشح.

## Validation

```bash
cd backend
./prisma/v1/validate-contract.sh
```

السكريبت:

1. يتحقق من Prisma schema.
2. يولد Base SQL في `/tmp`.
3. ينشئ قاعدة PostgreSQL مؤقتة باسم خاص بالعملية.
4. يطبق Base SQL ثم constraints ثم RLS.
5. يشغل smoke tests.
6. يحذف قاعدة الاختبار تلقائيًا.

يتطلب صلاحية `CREATE DATABASE` و`DROP DATABASE` للاتصال الموجود في `backend/.env`. لا تستخدمه باتصال Production.

## ترتيب التطبيق المستهدف

1. Prisma-generated base schema.
2. `sql/001_contract_constraints.sql`.
3. `sql/002_row_level_security.sql`.
4. `sql/003_runtime_roles.sql` بعد مراجعة أسماء أدوار بيئة النشر (لا يطبقه validator لأنه cluster-level DDL).
5. Seed للعملات والـPermission catalog وChart of Accounts templates.
6. Runtime API DB role غير مالك وغير superuser ولا يملك `BYPASSRLS`.

## ما يفرضه SQL خارج Prisma

- CHECK constraints للمبالغ والتواريخ وتماسك status/timestamps.
- Partial unique indexes للـactive hold والمراجع nullable.
- Exclusion constraints لتعارض Bus/Driver والفترات المالية.
- Actor membership FKs.
- immutable Audit/Agent transactions/posted journals/locked manifest.
- balanced journal posting داخل فترة OPEN.
- cumulative refund ceiling.
- minimum legal state transitions.
- FORCE RLS لكل tenant-owned tables.

## قاعدة صيانة مهمة

بعد أي تعديل على `schema.prisma`:

1. شغل `validate-contract.sh`.
2. راجع SQL الناتج من `migrate diff` يدويًا.
3. تحقق أن Prisma migration لا يحذف custom indexes/triggers/policies.
4. أضف smoke test لكل invariant جديد.

لا تستخدم `prisma db push` لإدارة Production contract؛ قد لا يحافظ على SQL objects التي لا يعرفها Prisma.
