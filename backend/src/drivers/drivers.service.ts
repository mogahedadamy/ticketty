import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { requireOrgId } from '../common/org';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto, QueryDriverDto, UpdateDriverDto } from './dto';

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, dto: CreateDriverDto) {
    const organizationId = requireOrgId(user);
    const branchId = user.branchId ?? dto.branchId ?? null;
    await this.validateBranch(organizationId, branchId);
    const driver = await this.prisma.driver.create({
      data: {
        ...dto,
        organizationId,
        branchId,
        licenseExpiry: new Date(dto.licenseExpiry),
      },
      include: { branch: true, _count: { select: { trips: true } } },
    });
    await this.audit.log(user, 'DRIVER_CREATED', 'Driver', driver.id);
    return driver;
  }

  findAll(user: AuthUser, query: QueryDriverDto) {
    const organizationId = requireOrgId(user);
    const where: Prisma.DriverWhereInput = {
      organizationId,
      ...(user.branchId ? { branchId: user.branchId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search } },
              {
                licenseNumber: { contains: query.search, mode: 'insensitive' },
              },
            ],
          }
        : {}),
    };
    return this.prisma.driver.findMany({
      where,
      include: { branch: true, _count: { select: { trips: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const driver = await this.prisma.driver.findFirst({
      where: this.scope(user, id),
      include: { branch: true, _count: { select: { trips: true } } },
    });
    if (!driver) throw new NotFoundException('السائق غير موجود');
    return driver;
  }

  async update(user: AuthUser, id: string, dto: UpdateDriverDto) {
    const existing = await this.findOne(user, id);
    const branchId = user.branchId ?? dto.branchId ?? existing.branchId;
    await this.validateBranch(requireOrgId(user), branchId);
    const driver = await this.prisma.driver.update({
      where: { id },
      data: {
        ...dto,
        branchId,
        licenseExpiry: dto.licenseExpiry
          ? new Date(dto.licenseExpiry)
          : undefined,
      },
      include: { branch: true, _count: { select: { trips: true } } },
    });
    await this.audit.log(user, 'DRIVER_UPDATED', 'Driver', id);
    return driver;
  }

  async remove(user: AuthUser, id: string) {
    const driver = await this.findOne(user, id);
    if (driver._count.trips > 0) {
      const updated = await this.prisma.driver.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
      await this.audit.log(user, 'DRIVER_DEACTIVATED', 'Driver', id);
      return updated;
    }
    await this.prisma.driver.delete({ where: { id } });
    await this.audit.log(user, 'DRIVER_DELETED', 'Driver', id);
    return { deleted: true };
  }

  private scope(user: AuthUser, id: string): Prisma.DriverWhereInput {
    return {
      id,
      organizationId: requireOrgId(user),
      ...(user.branchId ? { branchId: user.branchId } : {}),
    };
  }

  private async validateBranch(
    organizationId: string,
    branchId: string | null,
  ) {
    if (!branchId) return;
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, organizationId },
    });
    if (!branch) throw new ConflictException('الفرع غير صالح لهذه المؤسسة');
  }
}
