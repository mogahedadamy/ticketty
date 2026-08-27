import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { resolveAgentId } from '../common/agent-scope';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { requireOrgId, tenantScope } from '../common/org';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto, QueryAgentDto, UpdateAgentDto } from './dto';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateAgentDto) {
    const orgId = requireOrgId(user);
    const { commissionValue, ...data } = dto;
    return this.prisma.$transaction(async (tx) => {
      if (dto.userId) await this.requireLinkableUser(tx, user, dto.userId);
      return tx.agent.create({
        data: {
          ...data,
          organizationId: orgId,
          branchId: user.branchId,
          commissionValue: commissionValue
            ? new Prisma.Decimal(commissionValue)
            : new Prisma.Decimal(0),
        },
      });
    });
  }

  async findAll(user: AuthUser, query: QueryAgentDto) {
    const { search } = query;
    const agentId = await resolveAgentId(this.prisma, user);
    const where: Prisma.AgentWhereInput = {
      ...tenantScope(user),
      ...(agentId ? { id: agentId } : {}),
    };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }
    return this.prisma.agent
      .findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          commissions: { select: { amount: true, reversedAt: true } },
          settlements: {
            where: { status: 'SETTLED' },
            select: { commissionAmount: true },
          },
          _count: { select: { bookings: true, commissions: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      .then((agents) =>
        agents.map(({ commissions, settlements, ...agent }) => {
          const earned = commissions
            .filter((commission) => !commission.reversedAt)
            .reduce(
              (sum, commission) => sum.plus(commission.amount),
              new Prisma.Decimal(0),
            );
          const settled = settlements.reduce(
            (sum, settlement) => sum.plus(settlement.commissionAmount),
            new Prisma.Decimal(0),
          );
          return {
            ...agent,
            financials: {
              earnedCommission: earned,
              settledCommission: settled,
              balance: earned.minus(settled),
            },
          };
        }),
      );
  }

  async findMe(orgId: string, userId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { organizationId: orgId, userId },
    });
    if (!agent)
      throw new NotFoundException('لا يوجد ملف وكيل مرتبط بهذا المستخدم');
    return agent;
  }

  async findOne(user: AuthUser, id: string) {
    const agentId = await resolveAgentId(this.prisma, user);
    if (agentId && agentId !== id)
      throw new NotFoundException('الوكيل غير موجود');
    const agent = await this.prisma.agent.findFirst({
      where: { id, ...tenantScope(user) },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!agent) throw new NotFoundException('الوكيل غير موجود');
    return agent;
  }

  async commissions(user: AuthUser, id: string) {
    const agentId = await resolveAgentId(this.prisma, user);
    if (agentId && agentId !== id)
      throw new NotFoundException('الوكيل غير موجود');
    await this.ensureExists(user, id);
    return this.prisma.commission.findMany({
      where: { organizationId: requireOrgId(user), agentId: id },
      include: {
        ticket: true,
        booking: { include: { trip: { include: { route: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(user: AuthUser, id: string, dto: UpdateAgentDto) {
    const { commissionValue, ...data } = dto;
    return this.prisma.$transaction(async (tx) => {
      const agent = await tx.agent.findFirst({
        where: { id, ...tenantScope(user) },
      });
      if (!agent) throw new NotFoundException('الوكيل غير موجود');
      if (dto.userId) await this.requireLinkableUser(tx, user, dto.userId);
      return tx.agent.update({
        where: { id },
        data: {
          ...data,
          ...(commissionValue !== undefined
            ? { commissionValue: new Prisma.Decimal(commissionValue) }
            : {}),
        },
      });
    });
  }

  async remove(user: AuthUser, id: string) {
    await this.ensureExists(user, id);
    return this.prisma.agent.delete({ where: { id } });
  }

  private async ensureExists(user: AuthUser, id: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, ...tenantScope(user) },
    });
    if (!agent) throw new NotFoundException('الوكيل غير موجود');
    return agent;
  }

  private async requireLinkableUser(
    tx: Prisma.TransactionClient,
    user: AuthUser,
    userId: string,
  ) {
    const linkedUser = await tx.user.findFirst({
      where: { id: userId, ...tenantScope(user) },
      select: { id: true },
    });
    if (!linkedUser) throw new NotFoundException('المستخدم المرتبط غير موجود');
  }
}
