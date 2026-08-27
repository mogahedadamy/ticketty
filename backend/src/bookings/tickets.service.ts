import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { resolveAgentId } from '../common/agent-scope';
import { AuditService } from '../common/audit/audit.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { tenantScope } from '../common/org';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(user: AuthUser, tripId?: string) {
    const scope = tenantScope(user);
    const agentId = await resolveAgentId(this.prisma, user);
    const where: Prisma.TicketWhereInput = {
      organizationId: scope.organizationId,
      ...(scope.branchId ? { trip: { branchId: scope.branchId } } : {}),
      ...(agentId ? { booking: { agentId } } : {}),
    };
    if (tripId) where.tripId = tripId;
    return this.prisma.ticket.findMany({
      where,
      include: {
        booking: { include: { payments: true } },
        trip: { include: { route: true, bus: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const scope = tenantScope(user);
    const agentId = await resolveAgentId(this.prisma, user);
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id,
        organizationId: scope.organizationId,
        ...(scope.branchId ? { trip: { branchId: scope.branchId } } : {}),
        ...(agentId ? { booking: { agentId } } : {}),
      },
      include: {
        booking: { include: { payments: true, customer: true } },
        trip: { include: { route: true, bus: true } },
      },
    });
    if (!ticket) throw new NotFoundException('التذكرة غير موجودة');
    return ticket;
  }

  async findByQr(user: AuthUser, qr: string) {
    const scope = tenantScope(user);
    const agentId = await resolveAgentId(this.prisma, user);
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        qrCode: qr,
        organizationId: scope.organizationId,
        ...(scope.branchId ? { trip: { branchId: scope.branchId } } : {}),
        ...(agentId ? { booking: { agentId } } : {}),
      },
      include: {
        booking: true,
        trip: { include: { route: true, bus: true } },
      },
    });
    if (!ticket) throw new NotFoundException('التذكرة غير موجودة');
    return ticket;
  }

  async checkIn(user: AuthUser, id: string) {
    const ticket = await this.findOne(user, id);
    if (ticket.status === 'CANCELLED' || ticket.status === 'REFUNDED') {
      throw new NotFoundException('التذكرة ملغاة');
    }
    if (ticket.status === 'CHECKED_IN') {
      throw new ConflictException('تم تسجيل صعود صاحب هذه التذكرة مسبقاً');
    }
    const updated = await this.prisma.$transaction((tx) =>
      tx.ticket.update({
        where: { id },
        data: { status: 'CHECKED_IN' },
      }),
    );
    await this.audit.log(user, 'TICKET_CHECKED_IN', 'Ticket', id, {
      tripId: ticket.tripId,
    });
    return updated;
  }
}
