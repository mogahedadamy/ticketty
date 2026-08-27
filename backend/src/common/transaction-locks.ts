import { Prisma } from '@prisma/client';

/**
 * Serializes every transaction that can sell, cancel, or depart the same trip.
 * All participating use cases must acquire this lock before reading mutable
 * trip, booking, seat, payment, or manifest state.
 */
export async function lockTripTransaction(
  tx: Prisma.TransactionClient,
  organizationId: string,
  tripId: string,
): Promise<void> {
  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(
      hashtext(${`ticketty:${organizationId}`}),
      hashtext(${`trip:${tripId}`})
    )
  `;
}
