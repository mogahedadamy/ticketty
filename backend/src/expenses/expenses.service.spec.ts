import { ConflictException, NotFoundException } from '@nestjs/common';
import { ExpenseCategory } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ExpensesService } from './expenses.service';

const user: AuthUser = {
  sub: 'user-1',
  orgId: 'org-1',
  branchId: 'branch-1',
  name: 'Test',
  email: 'test@example.com',
  roleKey: 'FINANCE',
  permissions: ['expenses.write'],
};

describe('ExpensesService tenant references', () => {
  const findTrip = jest.fn();
  const findBus = jest.fn();
  const createExpense = jest.fn();
  const tx = {
    trip: { findFirst: findTrip },
    bus: { findFirst: findBus },
    expense: { create: createExpense },
  };
  const transaction = jest.fn((callback: (client: typeof tx) => unknown) =>
    Promise.resolve(callback(tx)),
  );
  const prisma = { $transaction: transaction } as unknown as PrismaService;
  const audit = { log: jest.fn() } as unknown as AuditService;
  const service = new ExpensesService(prisma, audit);

  beforeEach(() => jest.clearAllMocks());

  it('rejects an inaccessible trip reference', async () => {
    findTrip.mockResolvedValue(null);

    await expect(
      service.create(user, {
        tripId: 'foreign-trip',
        category: ExpenseCategory.FUEL,
        description: 'Fuel',
        amount: 100,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(findTrip).toHaveBeenCalledWith({
      where: {
        id: 'foreign-trip',
        organizationId: 'org-1',
        branchId: 'branch-1',
      },
      select: { id: true, busId: true },
    });
    expect(createExpense).not.toHaveBeenCalled();
  });

  it('rejects a bus that does not operate the referenced trip', async () => {
    findTrip.mockResolvedValue({ id: 'trip-1', busId: 'bus-1' });
    findBus.mockResolvedValue({ id: 'bus-2' });

    await expect(
      service.create(user, {
        tripId: 'trip-1',
        busId: 'bus-2',
        category: ExpenseCategory.FUEL,
        description: 'Fuel',
        amount: 100,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(createExpense).not.toHaveBeenCalled();
  });
});
