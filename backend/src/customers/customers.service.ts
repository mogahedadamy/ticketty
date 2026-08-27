import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { paginationArgs } from '../common/dto/pagination-query.dto';
import { requireOrgId, tenantScope } from '../common/org';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, QueryCustomerDto, UpdateCustomerDto } from './dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  create(user: AuthUser, dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        ...dto,
        organizationId: requireOrgId(user),
        branchId: user.branchId,
      },
    });
  }

  findAll(user: AuthUser, query: QueryCustomerDto) {
    const { search } = query;
    const where: Prisma.CustomerWhereInput = { ...tenantScope(user) };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
        {
          nationalId: { contains: search, mode: Prisma.QueryMode.insensitive },
        },
      ];
    }
    return this.prisma.customer.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...paginationArgs(query),
    });
  }

  async findOne(user: AuthUser, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, ...tenantScope(user) },
      include: {
        bookings: {
          include: {
            trip: { include: { route: true } },
            tickets: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!customer) throw new NotFoundException('العميل غير موجود');
    return customer;
  }

  async update(user: AuthUser, id: string, dto: UpdateCustomerDto) {
    await this.ensureExists(user, id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(user: AuthUser, id: string) {
    await this.ensureExists(user, id);
    return this.prisma.customer.delete({ where: { id } });
  }

  private async ensureExists(user: AuthUser, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, ...tenantScope(user) },
    });
    if (!customer) throw new NotFoundException('العميل غير موجود');
    return customer;
  }
}
