import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../common/audit/audit.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { requireOrgId } from '../common/org';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBranchDto,
  CreateRoleDto,
  CreateUserDto,
  UpdateOrganizationDto,
  UpdateUserDto,
} from './dto';

@Injectable()
export class AdministrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}
  organization(user: AuthUser) {
    return this.prisma.organization.findUniqueOrThrow({
      where: { id: requireOrgId(user) },
    });
  }
  async updateOrganization(user: AuthUser, dto: UpdateOrganizationDto) {
    const organizationId = requireOrgId(user);
    const updated = await this.prisma.$transaction((tx) =>
      tx.organization.update({
        where: { id: organizationId },
        data: {
          ...dto,
          cancellationFeePercent:
            dto.cancellationFeePercent !== undefined
              ? new Prisma.Decimal(dto.cancellationFeePercent)
              : undefined,
        },
      }),
    );
    await this.audit.log(
      user,
      'ORGANIZATION_UPDATED',
      'Organization',
      organizationId,
    );
    return updated;
  }
  branches(user: AuthUser) {
    return this.prisma.branch.findMany({
      where: { organizationId: requireOrgId(user) },
      include: { _count: { select: { users: true, trips: true } } },
      orderBy: { name: 'asc' },
    });
  }
  async createBranch(user: AuthUser, dto: CreateBranchDto) {
    const branch = await this.prisma.$transaction((tx) =>
      tx.branch.create({
        data: { ...dto, organizationId: requireOrgId(user) },
      }),
    );
    await this.audit.log(user, 'BRANCH_CREATED', 'Branch', branch.id);
    return branch;
  }
  roles(user: AuthUser) {
    return this.prisma.role.findMany({
      where: {
        OR: [{ organizationId: requireOrgId(user) }, { organizationId: null }],
      },
      include: { _count: { select: { users: true } } },
      orderBy: { nameAr: 'asc' },
    });
  }
  async createRole(user: AuthUser, dto: CreateRoleDto) {
    const role = await this.prisma.$transaction((tx) =>
      tx.role.create({
        data: {
          ...dto,
          key: dto.key.trim().toUpperCase(),
          organizationId: requireOrgId(user),
        },
      }),
    );
    await this.audit.log(user, 'ROLE_CREATED', 'Role', role.id);
    return role;
  }
  users(user: AuthUser) {
    return this.prisma.user.findMany({
      where: { organizationId: requireOrgId(user) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        branch: true,
        role: {
          select: { id: true, key: true, nameAr: true, permissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async createUser(user: AuthUser, dto: CreateUserDto) {
    const organizationId = requireOrgId(user);
    await this.validateRefs(organizationId, dto.roleId, dto.branchId);
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (exists) throw new ConflictException('البريد الإلكتروني مستخدم بالفعل');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const created = await this.prisma.$transaction((tx) =>
      tx.user.create({
        data: {
          organizationId,
          name: dto.name.trim(),
          email: dto.email.trim().toLowerCase(),
          phone: dto.phone,
          roleId: dto.roleId,
          branchId: dto.branchId,
          passwordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          active: true,
          branch: true,
          role: true,
          createdAt: true,
        },
      }),
    );
    await this.audit.log(user, 'USER_CREATED', 'User', created.id);
    return created;
  }
  async updateUser(user: AuthUser, id: string, dto: UpdateUserDto) {
    const organizationId = requireOrgId(user);
    const existing = await this.prisma.user.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundException('المستخدم غير موجود');
    if (id === user.sub && dto.active === false)
      throw new ConflictException('لا يمكنك تعطيل حسابك الحالي');
    await this.validateRefs(organizationId, dto.roleId, dto.branchId);
    const updated = await this.prisma.$transaction((tx) =>
      tx.user.update({
        where: { id },
        data: dto,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          active: true,
          branch: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    );
    await this.audit.log(user, 'USER_UPDATED', 'User', id, {
      active: dto.active,
      roleId: dto.roleId,
      branchId: dto.branchId,
    });
    return updated;
  }
  private async validateRefs(
    orgId: string,
    roleId?: string,
    branchId?: string,
  ) {
    if (roleId) {
      const role = await this.prisma.role.findFirst({
        where: {
          id: roleId,
          OR: [{ organizationId: orgId }, { organizationId: null }],
        },
      });
      if (!role) throw new NotFoundException('الدور غير موجود');
    }
    if (branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: branchId, organizationId: orgId },
      });
      if (!branch) throw new NotFoundException('الفرع غير موجود');
    }
  }
}
