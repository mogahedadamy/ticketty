import { Prisma } from '@prisma/client';
import { lockTripTransaction } from './transaction-locks';

describe('lockTripTransaction', () => {
  it('binds the organization and trip to one transaction-scoped lock', async () => {
    let values: unknown[] = [];
    const executeRaw = jest.fn(
      (
        _strings: TemplateStringsArray,
        organizationLockKey: string,
        tripLockKey: string,
      ) => {
        values = [organizationLockKey, tripLockKey];
        return Promise.resolve([{ pg_advisory_xact_lock: null }]);
      },
    );
    const tx = {
      $executeRaw: executeRaw,
    } as unknown as Prisma.TransactionClient;

    await lockTripTransaction(tx, 'org-1', 'trip-1');

    expect(executeRaw).toHaveBeenCalledTimes(1);
    expect(values).toEqual(['ticketty:org-1', 'trip:trip-1']);
  });
});
