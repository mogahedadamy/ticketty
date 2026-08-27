CREATE UNIQUE INDEX "seat_templates_id_organizationId_key"
ON "seat_templates"("id", "organizationId");
CREATE UNIQUE INDEX "users_id_organizationId_key"
ON "users"("id", "organizationId");
CREATE UNIQUE INDEX "trips_id_organizationId_key"
ON "trips"("id", "organizationId");
CREATE UNIQUE INDEX "buses_id_organizationId_key"
ON "buses"("id", "organizationId");

ALTER TABLE "buses"
ADD CONSTRAINT "buses_seatTemplateId_organizationId_fkey"
FOREIGN KEY ("seatTemplateId", "organizationId")
REFERENCES "seat_templates"("id", "organizationId")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "agents"
ADD CONSTRAINT "agents_userId_organizationId_fkey"
FOREIGN KEY ("userId", "organizationId")
REFERENCES "users"("id", "organizationId")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "expenses"
ADD CONSTRAINT "expenses_tripId_organizationId_fkey"
FOREIGN KEY ("tripId", "organizationId")
REFERENCES "trips"("id", "organizationId")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "expenses"
ADD CONSTRAINT "expenses_busId_organizationId_fkey"
FOREIGN KEY ("busId", "organizationId")
REFERENCES "buses"("id", "organizationId")
ON DELETE RESTRICT ON UPDATE CASCADE;
