import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../decorators/current-user.decorator';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(
    user: AuthUser,
    action: string,
    entity?: string,
    entityId?: string,
    meta?: Prisma.InputJsonValue,
  ) {
    return this.prisma.auditLog.create({
      data: {
        organizationId: user.orgId,
        branchId: user.branchId,
        userId: user.sub,
        action,
        entity,
        entityId,
        ...(meta !== undefined ? { meta } : {}),
      },
    });
  }
}
