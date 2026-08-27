import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthUser } from './decorators/current-user.decorator';
import { tenantScope } from './org';

export function isAgentPrincipal(user: AuthUser): boolean {
  return user.permissions.some((permission) => permission.endsWith('.own'));
}

export async function resolveAgentId(
  tx: Prisma.TransactionClient,
  user: AuthUser,
): Promise<string | undefined> {
  if (!isAgentPrincipal(user)) return undefined;
  const agent = await tx.agent.findFirst({
    where: { userId: user.sub, active: true, ...tenantScope(user) },
    select: { id: true },
  });
  if (!agent) {
    throw new ForbiddenException('لا يوجد ملف وكيل نشط لهذا المستخدم');
  }
  return agent.id;
}
