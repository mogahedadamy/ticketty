import { ConflictException } from '@nestjs/common';
import { SeatType, TripStatus } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from './bookings.service';

const user: AuthUser = {
  sub: 'user-1',
  orgId: 'org-1',
  branchId: 'branch-1',
  name: 'Test',
  email: 'test@example.com',
  roleKey: 'SELLER',
  permissions: ['bookings.write'],
};

type UpdateSeatsArgs = {
  where: {
    id: string;
    tripId: string;
    seatType: { in: SeatType[] };
  };
};

describe('BookingsService seat eligibility', () => {
  const findTrip = jest.fn();
  let capturedArgs: UpdateSeatsArgs | undefined;
  const updateSeats = jest.fn((args: UpdateSeatsArgs) => {
    capturedArgs = args;
    return Promise.resolve({ count: 1 });
  });
  const auditLog = jest.fn();
  const prisma = {
    trip: { findFirst: findTrip },
    tripSeat: { updateMany: updateSeats },
  } as unknown as PrismaService;
  const audit = { log: auditLog } as unknown as AuditService;
  const service = new BookingsService(prisma, audit);

  beforeEach(() => {
    jest.clearAllMocks();
    capturedArgs = undefined;
    findTrip.mockResolvedValue({ id: 'trip-1', status: TripStatus.OPEN });
  });

  it('limits seat holds to explicitly sellable seat types', async () => {
    await service.hold(user, { tripId: 'trip-1', seatId: 'seat-1' });

    expect(updateSeats).toHaveBeenCalledTimes(1);
    expect(capturedArgs?.where.id).toBe('seat-1');
    expect(capturedArgs?.where.tripId).toBe('trip-1');
    expect(capturedArgs?.where.seatType.in).toEqual([
      SeatType.REGULAR,
      SeatType.VIP,
    ]);
    expect(auditLog).toHaveBeenCalled();
  });

  it('rejects a seat when the guarded claim does not match', async () => {
    updateSeats.mockResolvedValue({ count: 0 });

    await expect(
      service.hold(user, { tripId: 'trip-1', seatId: 'blocked-seat' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(auditLog).not.toHaveBeenCalled();
  });
});
