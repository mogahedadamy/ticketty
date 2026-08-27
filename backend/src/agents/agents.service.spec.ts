import { NotFoundException } from '@nestjs/common';
import { AgentType, CommissionType, Prisma } from '@prisma/client';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AgentsService } from './agents.service';

const user: AuthUser = {
  sub: 'user-1',
  orgId: 'org-1',
  branchId: 'branch-1',
  name: 'Test',
  email: 'test@example.com',
  roleKey: 'OWNER',
  permissions: ['*'],
};

describe('AgentsService tenant references', () => {
  const findUser = jest.fn();
  const createAgent = jest.fn();
  const tx = {
    user: { findFirst: findUser },
    agent: { create: createAgent },
  };
  const transaction = jest.fn((callback: (client: typeof tx) => unknown) =>
    Promise.resolve(callback(tx)),
  );
  const prisma = { $transaction: transaction } as unknown as PrismaService;
  const service = new AgentsService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('rejects linking a user outside the tenant and branch scope', async () => {
    findUser.mockResolvedValue(null);

    await expect(
      service.create(user, {
        name: 'External Agent',
        type: AgentType.EXTERNAL,
        commissionType: CommissionType.PERCENT,
        commissionValue: 5,
        userId: 'foreign-user',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(findUser).toHaveBeenCalledWith({
      where: {
        id: 'foreign-user',
        organizationId: 'org-1',
        branchId: 'branch-1',
      },
      select: { id: true },
    });
    expect(createAgent).not.toHaveBeenCalled();
  });

  it('creates an agent after resolving its linked user in scope', async () => {
    findUser.mockResolvedValue({ id: 'agent-user' });
    createAgent.mockResolvedValue({ id: 'agent-1' });

    await service.create(user, {
      name: 'Branch Agent',
      userId: 'agent-user',
    });

    expect(createAgent).toHaveBeenCalledWith({
      data: {
        name: 'Branch Agent',
        userId: 'agent-user',
        organizationId: 'org-1',
        branchId: 'branch-1',
        commissionValue: new Prisma.Decimal(0),
      },
    });
  });
});

describe('AgentsService bounded listing', () => {
  const findMany = jest.fn();
  const commissionGroupBy = jest.fn();
  const settlementGroupBy = jest.fn();
  const prisma = {
    agent: { findMany },
    commission: { groupBy: commissionGroupBy },
    settlement: { groupBy: settlementGroupBy },
  } as unknown as PrismaService;
  const service = new AgentsService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('limits the page and calculates financials with database aggregates', async () => {
    findMany.mockResolvedValue([
      {
        id: 'agent-1',
        name: 'Agent',
        _count: { bookings: 2, commissions: 3 },
      },
    ]);
    commissionGroupBy.mockResolvedValue([
      { agentId: 'agent-1', _sum: { amount: new Prisma.Decimal(25) } },
    ]);
    settlementGroupBy.mockResolvedValue([
      {
        agentId: 'agent-1',
        _sum: { commissionAmount: new Prisma.Decimal(10) },
      },
    ]);

    const result = await service.findAll(user, { limit: 25 });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 25,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
    expect(result[0].financials).toEqual({
      earnedCommission: new Prisma.Decimal(25),
      settledCommission: new Prisma.Decimal(10),
      balance: new Prisma.Decimal(15),
    });
  });

  it('does not query aggregates for an empty page', async () => {
    findMany.mockResolvedValue([]);

    await expect(service.findAll(user, {})).resolves.toEqual([]);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    );
    expect(commissionGroupBy).not.toHaveBeenCalled();
    expect(settlementGroupBy).not.toHaveBeenCalled();
  });
});
