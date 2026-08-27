# Ticketty — المبادئ الهندسية غير القابلة للتفاوض

> المعيار الذي نحكم به على كل Feature قبل دخوله إلى Production.

## القواعد العشر (Non-Negotiable)

1. **لا ملف ضخم** — Modules صغيرة، كل وحدة مسؤولة عن Domain واحد.
2. **لا Business Logic داخل React** — الواجهة عرض فقط؛ القرارات في الـ Backend.
3. **لا تعديل مباشر على السجلات المالية المعتمدة** — استخدم Ledger / Adjustment / Reversal.
4. **لا Payment Provider مربوط مباشرة بالـ Core** — Adapter Layer.
5. **لا AI يملك صلاحية مالية مباشرة**.
6. **كل عملية حساسة قابلة للتدقيق** (Audit Log).
7. **كل صلاحية تُفرض Server-side**.
8. **كل Feature جديدة لها Tests + Documentation + Security Review**.
9. **النظام Banking/Regulatory-ready** لكن لا يدّعي صفة ترخيصية لم يحصل عليها.
10. **التصميم يسمح بالنمو** من نظام تذاكر ← منصة تشغيل نقل ← بنية تحتية رقمية للنقل والمدفوعات في السودان.

## معيار الحكم على أي Feature

قبل إضافة أي Feature نجيب على:
- **Business:** هل تحل مشكلة حقيقية؟
- **Architecture:** أين مكانها؟
- **Security:** ما الـ Threat Model؟
- **Data:** ما البيانات التي تجمعها؟
- **Financial:** هل تؤثر على Ledger؟
- **Compliance:** هل تؤثر على التزام قانوني؟
- **Audit:** كيف نثبت ماذا حدث؟
- **Scalability:** هل ستعمل عند 100 ألف عملية؟
- **Maintainability:** هل يمكن تعديلها دون كسر وحدات أخرى؟
- **Testing:** كيف سنثبت أنها تعمل؟

> إذا لم نستطع الإجابة، لا تدخل الـ Feature إلى Production.

## البنية المستهدفة

```
TICKETTY
   │
   ├── Transport ─────── Operators / Routes / Trips / Tickets / Manifest
   ├── Finance ───────── Payments / Ledger / Refunds / Settlement / Reconciliation
   ├── Compliance ────── KYC / AML / Risk / Audit / Policies
   │
   └── PLATFORM CORE ── API / Events / Integrations
            └── Infrastructure ── Security + DevOps
```

## أصحاب المصلحة (Stakeholders)

- مستثمر (Investor)
- جهة حكومية (Government / Regulator)
- مزود دفع (Payment Provider)
- شركة النقل (Operator) — العميل الأساسي
- الوكيل/البائع (Agent/Seller)
