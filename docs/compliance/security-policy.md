# السياسة الأمنية

## الهدف

حماية السرية والسلامة والتوافر لمنصة Ticketty وبيانات المستثمرين والجهات الحكومية وشركات النقل والعملاء ومزودي الدفع.

## المراجع

- `REG-003` و`REG-007` و`REG-011` و`REG-013`.
- `access-control-policy.md` و`incident-response.md`.

## الحد الأدنى الملزم

1. هوية فردية لكل مستخدم؛ يمنع الحساب المشترك.
2. MFA للحسابات الإدارية والمالية عند الإنتاج.
3. صلاحيات Server-side وTenant isolation في كل Query.
4. TLS أثناء النقل وتشفير الأسرار والحقول شديدة الحساسية.
5. أسرار الإنتاج في Secret Manager مع Rotation؛ لا أسرار في Git أو Logs.
6. Audit append-only للعمليات الحساسة ومراقبة العبث.
7. فحص Dependencies وSAST وSecrets وContainer قبل النشر.
8. نسخ احتياطي مشفر واختبار Restore دوري.
9. Rate limiting وLockout مدروس لمسارات المصادقة.
10. Threat Model وSecurity Review لكل Feature حسب `engineering-principles.md`.

## مستويات الشدة

- Critical: سيطرة حساب إداري، تسرب واسع، تلاعب مالي، توقف جوهري.
- High: وصول غير مخول محدود أو تعطيل خدمة أساسية.
- Medium/Low: أثر محدود مع تعويضات متاحة.

## Evidence

تقارير الفحص، تغييرات الصلاحيات، اختبارات Restore، نتائج Pen Test، سجلات الحوادث، وموافقات الاستثناء محددة المدة.
