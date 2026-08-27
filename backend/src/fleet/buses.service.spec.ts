import { NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { BusesService } from './buses.service';

const user: AuthUser = {
  sub: 'user-1',
  orgId: 'org-1',
  branchId: 'branch-1',
  name: 'Test',
  email: 'test@example.com',
  roleKey: 'OWNER',
  permissions: ['*'],
};

describe('BusesService tenant references', () => {
  const findTemplate = jest.fn();
  const createBus = jest.fn();
  const tx = {
    seatTemplate: { findFirst: findTemplate },
    bus: { create: createBus },
  };
  const transaction = jest.fn((callback: (client: typeof tx) => unknown) =>
    Promise.resolve(callback(tx)),
  );
  const prisma = { $transaction: transaction } as unknown as PrismaService;
  const service = new BusesService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('rejects a seat template outside the authenticated organization', async () => {
    findTemplate.mockResolvedValue(null);

    await expect(
      service.create(user, {
        plateNumber: 'BUS-1',
        seatTemplateId: 'foreign-template',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(findTemplate).toHaveBeenCalledWith({
      where: { id: 'foreign-template', organizationId: 'org-1' },
      select: { id: true },
    });
    expect(createBus).not.toHaveBeenCalled();
  });

  it('creates a bus only after resolving its template in the tenant', async () => {
    findTemplate.mockResolvedValue({ id: 'template-1' });
    createBus.mockResolvedValue({ id: 'bus-1' });

    await service.create(user, {
      plateNumber: 'BUS-1',
      seatTemplateId: 'template-1',
    });

    expect(createBus).toHaveBeenCalledWith({
      data: {
        plateNumber: 'BUS-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        seatTemplateId: 'template-1',
      },
      include: { seatTemplate: { include: { seats: true } } },
    });
  });
});
