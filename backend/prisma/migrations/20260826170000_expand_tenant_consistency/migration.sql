CREATE UNIQUE INDEX "routes_id_organizationId_key" ON "routes"("id", "organizationId");
CREATE UNIQUE INDEX "drivers_id_organizationId_key" ON "drivers"("id", "organizationId");
CREATE UNIQUE INDEX "customers_id_organizationId_key" ON "customers"("id", "organizationId");
CREATE UNIQUE INDEX "agents_id_organizationId_key" ON "agents"("id", "organizationId");
CREATE UNIQUE INDEX "bookings_id_organizationId_key" ON "bookings"("id", "organizationId");
CREATE UNIQUE INDEX "payments_id_organizationId_key" ON "payments"("id", "organizationId");
CREATE UNIQUE INDEX "tickets_id_organizationId_key" ON "tickets"("id", "organizationId");
CREATE UNIQUE INDEX "expenses_id_organizationId_key" ON "expenses"("id", "organizationId");

ALTER TABLE "trips" ADD CONSTRAINT "trips_routeId_organizationId_fkey"
FOREIGN KEY ("routeId", "organizationId") REFERENCES "routes"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trips" ADD CONSTRAINT "trips_busId_organizationId_fkey"
FOREIGN KEY ("busId", "organizationId") REFERENCES "buses"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trips" ADD CONSTRAINT "trips_driverId_organizationId_fkey"
FOREIGN KEY ("driverId", "organizationId") REFERENCES "drivers"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tripId_organizationId_fkey"
FOREIGN KEY ("tripId", "organizationId") REFERENCES "trips"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customerId_organizationId_fkey"
FOREIGN KEY ("customerId", "organizationId") REFERENCES "customers"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_agentId_organizationId_fkey"
FOREIGN KEY ("agentId", "organizationId") REFERENCES "agents"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_organizationId_fkey"
FOREIGN KEY ("bookingId", "organizationId") REFERENCES "bookings"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_bookingId_organizationId_fkey"
FOREIGN KEY ("bookingId", "organizationId") REFERENCES "bookings"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_paymentId_organizationId_fkey"
FOREIGN KEY ("paymentId", "organizationId") REFERENCES "payments"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tickets" ADD CONSTRAINT "tickets_bookingId_organizationId_fkey"
FOREIGN KEY ("bookingId", "organizationId") REFERENCES "bookings"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tripId_organizationId_fkey"
FOREIGN KEY ("tripId", "organizationId") REFERENCES "trips"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "manifests" ADD CONSTRAINT "manifests_tripId_organizationId_fkey"
FOREIGN KEY ("tripId", "organizationId") REFERENCES "trips"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "commissions" ADD CONSTRAINT "commissions_agentId_organizationId_fkey"
FOREIGN KEY ("agentId", "organizationId") REFERENCES "agents"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_bookingId_organizationId_fkey"
FOREIGN KEY ("bookingId", "organizationId") REFERENCES "bookings"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_ticketId_organizationId_fkey"
FOREIGN KEY ("ticketId", "organizationId") REFERENCES "tickets"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_adjustments" ADD CONSTRAINT "expense_adjustments_expenseId_organizationId_fkey"
FOREIGN KEY ("expenseId", "organizationId") REFERENCES "expenses"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_agentId_organizationId_fkey"
FOREIGN KEY ("agentId", "organizationId") REFERENCES "agents"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
