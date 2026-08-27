import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { resolveAgentId } from '../common/agent-scope';
import { paginationArgs } from '../common/dto/pagination-query.dto';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { requireOrgId, tenantScope } from '../common/org';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAgentDto,
  QueryAgentDto,
  QueryCommissionDto,
  UpdateAgentDto,
} from './dto';

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
    const pagination = paginationArgs(query);
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
    const agents = await this.prisma.agent.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { bookings: true, commissions: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...pagination,
    });
    const agentIds = agents.map((agent) => agent.id);
    if (agentIds.length === 0) return [];

    const [earnedByAgent, settledByAgent] = await Promise.all([
      this.prisma.commission.groupBy({
        by: ['agentId'],
        where: {
          organizationId: requireOrgId(user),
          agentId: { in: agentIds },
          reversedAt: null,
        },
        _sum: { amount: true },
      }),
      this.prisma.settlement.groupBy({
        by: ['agentId'],
        where: {
          organizationId: requireOrgId(user),
          agentId: { in: agentIds },
          status: 'SETTLED',
        },
        _sum: { commissionAmount: true },
      }),
    ]);
    const earned = new Map(
      earnedByAgent.map((row) => [row.agentId, row._sum.amount]),
    );
    const settled = new Map(
      settledByAgent.map((row) => [row.agentId, row._sum.commissionAmount]),
    );

    return agents.map((agent) => {
      const earnedCommission = earned.get(agent.id) ?? new Prisma.Decimal(0);
      const settledCommission = settled.get(agent.id) ?? new Prisma.Decimal(0);
      return {
        ...agent,
        financials: {
          earnedCommission,
          settledCommission,
          balance: earnedCommission.minus(settledCommission),
        },
      };
    });
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

  async commissions(
    user: AuthUser,
    id: string,
    query: QueryCommissionDto = {},
  ) {
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
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...paginationArgs(query),
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
