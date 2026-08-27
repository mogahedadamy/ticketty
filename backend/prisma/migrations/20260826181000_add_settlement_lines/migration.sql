CREATE TABLE "settlement_lines" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "settlementId" TEXT NOT NULL,
  "commissionId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "settlement_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "settlement_lines_amount_positive_check" CHECK ("amount" >= 0)
);
CREATE UNIQUE INDEX "settlements_id_organizationId_key" ON "settlements"("id", "organizationId");
CREATE UNIQUE INDEX "commissions_id_organizationId_key" ON "commissions"("id", "organizationId");
CREATE UNIQUE INDEX "settlement_lines_commissionId_key" ON "settlement_lines"("commissionId");
CREATE INDEX "settlement_lines_organizationId_settlementId_idx" ON "settlement_lines"("organizationId", "settlementId");
ALTER TABLE "settlement_lines" ADD CONSTRAINT "settlement_lines_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settlement_lines" ADD CONSTRAINT "settlement_lines_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settlement_lines" ADD CONSTRAINT "settlement_lines_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "commissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlement_lines" ADD CONSTRAINT "settlement_lines_settlementId_organizationId_fkey" FOREIGN KEY ("settlementId", "organizationId") REFERENCES "settlements"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settlement_lines" ADD CONSTRAINT "settlement_lines_commissionId_organizationId_fkey" FOREIGN KEY ("commissionId", "organizationId") REFERENCES "commissions"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_final_settlement_line_mutation()
RETURNS TRIGGER AS $$
DECLARE parent_status "SettlementStatus";
BEGIN
  SELECT "status" INTO parent_status FROM "settlements" WHERE "id" = COALESCE(NEW."settlementId", OLD."settlementId");
  IF parent_status = 'SETTLED' THEN RAISE EXCEPTION 'Final settlement lines are immutable'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "settlement_lines_prevent_final_mutation"
BEFORE INSERT OR UPDATE OR DELETE ON "settlement_lines"
FOR EACH ROW EXECUTE FUNCTION prevent_final_settlement_line_mutation();
