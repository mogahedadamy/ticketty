import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { resolveAgentId } from '../common/agent-scope';
import { paginationArgs } from '../common/dto/pagination-query.dto';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { tenantScope } from '../common/org';
import { PrismaService } from '../prisma/prisma.service';
import { QueryPaymentDto } from './dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser, query: QueryPaymentDto) {
    const { date, method, bookingId } = query;
    const agentId = await resolveAgentId(this.prisma, user);
    const where: Prisma.PaymentWhereInput = {
      ...tenantScope(user),
      ...(agentId ? { booking: { agentId } } : {}),
    };
    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      where.createdAt = { gte: start, lt: end };
    }
    if (method) where.method = method;
    if (bookingId) where.bookingId = bookingId;

    return this.prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: { trip: { include: { route: true } }, tickets: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...paginationArgs(query),
    });
  }

  async findOne(user: AuthUser, id: string) {
    const agentId = await resolveAgentId(this.prisma, user);
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        ...tenantScope(user),
        ...(agentId ? { booking: { agentId } } : {}),
      },
      include: {
        booking: {
          include: { trip: { include: { route: true } }, tickets: true },
        },
      },
    });
    if (!payment) throw new NotFoundException('الدفعة غير موجودة');
    return payment;
  }
}
