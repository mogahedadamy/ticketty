import { ForbiddenException } from '@nestjs/common';
import type { AuthUser } from './decorators/current-user.decorator';

/**
 * يستخرج معرف المؤسسة من المستخدم الحالي، ويرفض الطلب إذا لم يكن مرتبطاً بمؤسسة.
 * (كل المستخدمين الحقيقيين في النظام مرتبطون بمؤسسة — Organization/Tenant).
 */
export function requireOrgId(user: AuthUser): string {
  if (!user.orgId) {
    throw new ForbiddenException('لا توجد مؤسسة مرتبطة بهذا المستخدم');
  }
  return user.orgId;
}

export function tenantScope(user: AuthUser): {
  organizationId: string;
  branchId?: string;
} {
  return {
    organizationId: requireOrgId(user),
    ...(user.branchId ? { branchId: user.branchId } : {}),
  };
}
