import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { paginationArgs } from '../common/dto/pagination-query.dto';
import { requireOrgId, tenantScope } from '../common/org';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusDto, QueryFleetDto, UpdateBusDto } from './dto';

@Injectable()
export class BusesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateBusDto) {
    const organizationId = requireOrgId(user);
    return this.prisma.$transaction(async (tx) => {
      await this.requireSeatTemplate(tx, organizationId, dto.seatTemplateId);
      return tx.bus.create({
        data: {
          ...dto,
          organizationId,
          branchId: user.branchId,
        },
        include: { seatTemplate: { include: { seats: true } } },
      });
    });
  }

  findAll(user: AuthUser, query: QueryFleetDto = {}) {
    return this.prisma.bus.findMany({
      where: tenantScope(user),
      include: { seatTemplate: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...paginationArgs(query),
    });
  }

  async findOne(user: AuthUser, id: string) {
    const bus = await this.prisma.bus.findFirst({
      where: { id, ...tenantScope(user) },
      include: { seatTemplate: { include: { seats: true } } },
    });
    if (!bus) throw new NotFoundException('الباص غير موجود');
    return bus;
  }

  async update(user: AuthUser, id: string, dto: UpdateBusDto) {
    const organizationId = requireOrgId(user);
    return this.prisma.$transaction(async (tx) => {
      const bus = await tx.bus.findFirst({
        where: { id, ...tenantScope(user) },
      });
      if (!bus) throw new NotFoundException('الباص غير موجود');
      if (dto.seatTemplateId) {
        await this.requireSeatTemplate(tx, organizationId, dto.seatTemplateId);
      }
      return tx.bus.update({
        where: { id },
        data: dto,
        include: { seatTemplate: { include: { seats: true } } },
      });
    });
  }

  async remove(user: AuthUser, id: string) {
    await this.ensureExists(user, id);
    try {
      return await this.prisma.bus.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2003' || error.code === 'P2014')
      ) {
        throw new ConflictException(
          'لا يمكن حذف باص مرتبط برحلات. غيّر حالته إلى معطّل بدلاً من ذلك.',
        );
      }
      throw error;
    }
  }

  private async ensureExists(user: AuthUser, id: string) {
    const bus = await this.prisma.bus.findFirst({
      where: { id, ...tenantScope(user) },
    });
    if (!bus) throw new NotFoundException('الباص غير موجود');
    return bus;
  }

  private async requireSeatTemplate(
    tx: Prisma.TransactionClient,
    organizationId: string,
    seatTemplateId: string,
  ) {
    const template = await tx.seatTemplate.findFirst({
      where: { id: seatTemplateId, organizationId },
      select: { id: true },
    });
    if (!template) throw new NotFoundException('قالب المقاعد غير موجود');
  }
}
