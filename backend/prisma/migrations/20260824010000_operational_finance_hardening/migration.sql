CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE "PaymentStatus" AS ENUM ('COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED');
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'APPROVED', 'ADJUSTED');
CREATE TYPE "AdjustmentType" AS ENUM ('INCREASE', 'DECREASE');

ALTER TABLE "agents" ADD COLUMN "branchId" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "branchId" TEXT;
ALTER TABLE "bookings"
  ADD COLUMN "branchId" TEXT,
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "cancelledById" TEXT,
  ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "buses" ADD COLUMN "branchId" TEXT;
ALTER TABLE "expenses"
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "approvedById" TEXT,
  ADD COLUMN "branchId" TEXT,
  ADD COLUMN "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "organizations"
  ADD COLUMN "address" TEXT,
  ADD COLUMN "cancellationFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "ticketTerms" TEXT;
ALTER TABLE "payments"
  ADD COLUMN "branchId" TEXT,
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "refundedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE "routes" ADD COLUMN "branchId" TEXT;
ALTER TABLE "trips" ADD COLUMN "branchId" TEXT, ADD COLUMN "driverId" TEXT;

CREATE TABLE "drivers" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "branchId" TEXT,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "licenseNumber" TEXT NOT NULL,
  "licenseExpiry" TIMESTAMP(3) NOT NULL,
  "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refunds" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "RefundStatus" NOT NULL DEFAULT 'COMPLETED',
  "processedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expense_adjustments" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "expenseId" TEXT NOT NULL,
  "type" "AdjustmentType" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "reason" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "expense_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "drivers_organizationId_status_idx" ON "drivers"("organizationId", "status");
CREATE INDEX "drivers_branchId_idx" ON "drivers"("branchId");
CREATE UNIQUE INDEX "drivers_organizationId_licenseNumber_key" ON "drivers"("organizationId", "licenseNumber");
CREATE INDEX "refunds_organizationId_createdAt_idx" ON "refunds"("organizationId", "createdAt");
CREATE INDEX "refunds_bookingId_idx" ON "refunds"("bookingId");
CREATE INDEX "expense_adjustments_organizationId_createdAt_idx" ON "expense_adjustments"("organizationId", "createdAt");
CREATE INDEX "expense_adjustments_expenseId_idx" ON "expense_adjustments"("expenseId");
CREATE INDEX "agents_branchId_idx" ON "agents"("branchId");
CREATE INDEX "audit_logs_branchId_createdAt_idx" ON "audit_logs"("branchId", "createdAt");
CREATE INDEX "bookings_branchId_createdAt_idx" ON "bookings"("branchId", "createdAt");
CREATE UNIQUE INDEX "bookings_organizationId_idempotencyKey_key" ON "bookings"("organizationId", "idempotencyKey");
CREATE INDEX "buses_branchId_idx" ON "buses"("branchId");
CREATE INDEX "expenses_branchId_createdAt_idx" ON "expenses"("branchId", "createdAt");
CREATE INDEX "payments_branchId_createdAt_idx" ON "payments"("branchId", "createdAt");
CREATE UNIQUE INDEX "payments_organizationId_idempotencyKey_key" ON "payments"("organizationId", "idempotencyKey");
CREATE INDEX "routes_branchId_idx" ON "routes"("branchId");
CREATE INDEX "trips_branchId_departureAt_idx" ON "trips"("branchId", "departureAt");
CREATE INDEX "trips_driverId_departureAt_idx" ON "trips"("driverId", "departureAt");

ALTER TABLE "routes" ADD CONSTRAINT "routes_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "buses" ADD CONSTRAINT "buses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "trips" ADD CONSTRAINT "trips_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "trips" ADD CONSTRAINT "trips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agents" ADD CONSTRAINT "agents_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expense_adjustments" ADD CONSTRAINT "expense_adjustments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expense_adjustments" ADD CONSTRAINT "expense_adjustments_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
