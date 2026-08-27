DROP INDEX IF EXISTS "tickets_tripSeatId_key";
CREATE INDEX "tickets_tripSeatId_idx" ON "tickets"("tripSeatId");
