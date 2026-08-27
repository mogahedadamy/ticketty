ALTER TABLE "customers" ADD COLUMN "branchId" TEXT;
CREATE INDEX "customers_branchId_idx" ON "customers"("branchId");
ALTER TABLE "customers" ADD CONSTRAINT "customers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
