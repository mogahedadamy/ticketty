# Feature Review — Authentication Foundation

## القرار

مسموح للبيئة التطويرية بعد نجاح الاختبارات. قبل Production يلزم Rate Limiting/MFA/Secret Manager واختبار اختراق مسار الدخول.

| المعيار | التقييم |
|---|---|
| Business | يمنح موظفي شركة النقل وصولاً فردياً يمكن سحبه وتدقيقه. |
| Architecture | Nest `auth` مسؤول عن التحقق والتوكن؛ Next BFF مسؤول عن Cookie الجلسة؛ RBAC في Guards. |
| Security | تهديدات: brute force، سرقة token، مستخدم/مؤسسة معطلة، stale permissions، XSS/CSRF. التوكن HttpOnly/SameSite، والحالة والصلاحيات تعاد قراءتها من DB لكل طلب. المتبقي: throttling وMFA وCSRF صريح للعمليات الحساسة. |
| Data | بريد، اسم، password hash، tenant/branch/role، وسجل نجاح الدخول. لا تسجل كلمة المرور أو التوكن. |
| Financial | لا أثر مباشر ولا صلاحية مالية ضمن Auth؛ الوحدات المالية تطبق Maker/Checker لاحقاً. |
| Compliance | `REG-003` و`REG-007` و`REG-011`، مع مراجعة `access-control-policy.md` و`security-policy.md`. |
| Audit | نجاح الدخول يسجل `AUTH_LOGIN_SUCCEEDED`. فشل الدخول يحتاج Security telemetry محدوداً لا يكشف وجود الحساب. |
| Scalability | DB lookup في كل طلب يضمن الإبطال الفوري لكنه يحتاج قياساً/Cache آمناً عند 100 ألف عملية. |
| Maintainability | Auth/guards/BFF/UI مفصولة. لا Business rules في React. |
| Testing | Unit: نجاح، كلمة مرور خاطئة، مؤسسة معطلة. Build/lint/schema verification. المتبقي E2E كامل وnegative permission tests. |

## واجهات API

- `POST /api/auth/login` — Public، DTO whitelist، يعيد access token والهوية.
- `GET /api/auth/me` — Protected، يعيد الهوية الحالية بعد إعادة التحقق Server-side.
- Next `POST /api/session` — BFF يخزن التوكن في `HttpOnly` cookie.
- Next `DELETE /api/session` — يحذف Cookie المحلية.

## شروط الإنتاج المتبقية

- Rate limiting تدريجي وتنبيه محاولات الإساءة.
- MFA للحسابات الإدارية/المالية.
- JWT secret قوي من Secret Manager ودورة Rotation.
- مدة جلسة/Refresh/Revocation مصممة ومختبرة.
- CSRF protection للعمليات المغيرة للحالة.
- E2E على قاعدة بيانات اختبار مع Tenant crossing tests.
