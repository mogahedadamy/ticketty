# سياسة إدارة التغيير

## بوابة الـ Feature

كل Feature تجيب وتقدم Evidence على:

| البعد | السؤال |
|---|---|
| Business | هل تحل مشكلة حقيقية؟ |
| Architecture | أين مكانها وحدود Domain؟ |
| Security | ما Threat Model؟ |
| Data | ما البيانات والغرض والاحتفاظ؟ |
| Financial | هل تمس Ledger أو Settlement؟ |
| Compliance | ما معرّفات `REG-*` المتأثرة؟ |
| Audit | كيف نثبت الحدث والفاعل والسبب؟ |
| Scalability | هل تتحمل 100 ألف عملية؟ |
| Maintainability | هل الوحدة صغيرة بعقد واضح؟ |
| Testing | ما اختبارات النجاح والفشل والعزل؟ |

أي إجابة مفقودة تمنع Production.

## أنواع التغيير

- Standard: منخفض ومكرر مع Runbook معتمد.
- Normal: مراجعة كود/اختبار/Security/Compliance حسب الأثر.
- Emergency: لتقليل ضرر قائم؛ موافقة عاجلة ومراجعة لاحقة إلزامية.

## الربط التنظيمي

كل تغيير تنظيمي يتبع المسار في `regulatory-register.md` ويحمل معرّف Requirement. تُحفظ Evidence: تقييم الأثر، PR، الاختبارات، الموافقات، migration/rollback، سجل النشر والمراقبة.

## ضوابط النشر

- فصل المراجع عن المنفذ للتغييرات المالية/الأمنية عالية الخطورة.
- Backward-compatible migrations وخطة Rollback مجربة.
- Feature flags لا تتجاوز Authorization.
- مراقبة مؤشرات الخطأ والأمن والمال بعد النشر.
- لا يعلن الامتثال أو الترخيص في Release Notes دون موافقة قانونية.
