import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { requireOrgId, tenantScope } from '../common/org';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto, QueryRouteDto, UpdateRouteDto } from './dto';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  create(user: AuthUser, dto: CreateRouteDto) {
    const orgId = requireOrgId(user);
    const { stops, ...data } = dto;
    return this.prisma.route.create({
      data: {
        ...data,
        organizationId: orgId,
        branchId: user.branchId,
        ...(stops?.length ? { stops: { create: stops } } : {}),
      },
      include: { stops: { orderBy: { order: 'asc' } } },
    });
  }

  findAll(user: AuthUser, query: QueryRouteDto) {
    const { search } = query;
    const where: Prisma.RouteWhereInput = { ...tenantScope(user) };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { fromCity: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { toCity: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }
    return this.prisma.route.findMany({
      where,
      include: { _count: { select: { trips: true } }, stops: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const route = await this.prisma.route.findFirst({
      where: { id, ...tenantScope(user) },
      include: { stops: { orderBy: { order: 'asc' } } },
    });
    if (!route) throw new NotFoundException('المسار غير موجود');
    return route;
  }

  async update(user: AuthUser, id: string, dto: UpdateRouteDto) {
    await this.ensureExists(user, id);
    const { stops, ...data } = dto;
    return this.prisma.$transaction(async (tx) => {
      if (stops) {
        await tx.routeStop.deleteMany({ where: { routeId: id } });
        await tx.routeStop.createMany({
          data: stops.map((s) => ({ ...s, routeId: id })),
        });
      }
      return tx.route.update({
        where: { id },
        data,
        include: { stops: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async remove(user: AuthUser, id: string) {
    await this.ensureExists(user, id);
    try {
      return await this.prisma.route.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2003' || error.code === 'P2014')
      ) {
        throw new ConflictException(
          'لا يمكن حذف مسار مرتبط برحلات. عطّل المسار بدلاً من حذفه.',
        );
      }
      throw error;
    }
  }

  private async ensureExists(user: AuthUser, id: string) {
    const route = await this.prisma.route.findFirst({
      where: { id, ...tenantScope(user) },
    });
    if (!route) throw new NotFoundException('المسار غير موجود');
    return route;
  }
}
