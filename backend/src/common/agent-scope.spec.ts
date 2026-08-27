import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthUser } from './decorators/current-user.decorator';
import { resolveAgentId } from './agent-scope';

const user = (permissions: string[]): AuthUser => ({
  sub: 'user-1',
  orgId: 'org-1',
  branchId: 'branch-1',
  name: 'Test',
  email: 'test@example.com',
  roleKey: 'AGENT',
  permissions,
});

describe('agent ownership scope', () => {
  it('does not restrict staff principals to one agent', async () => {
    const findFirst = jest.fn();
    const tx = { agent: { findFirst } } as unknown as Prisma.TransactionClient;
    await expect(
      resolveAgentId(tx, user(['bookings.read'])),
    ).resolves.toBeUndefined();
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('resolves an external agent only inside tenant and branch scope', async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: 'agent-1' });
    const tx = { agent: { findFirst } } as unknown as Prisma.TransactionClient;
    await expect(resolveAgentId(tx, user(['bookings.read.own']))).resolves.toBe(
      'agent-1',
    );
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        active: true,
        organizationId: 'org-1',
        branchId: 'branch-1',
      },
      select: { id: true },
    });
  });

  it('fails closed when the external agent profile is unavailable', async () => {
    const tx = {
      agent: { findFirst: jest.fn().mockResolvedValue(null) },
    } as unknown as Prisma.TransactionClient;
    await expect(
      resolveAgentId(tx, user(['bookings.read.own'])),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
