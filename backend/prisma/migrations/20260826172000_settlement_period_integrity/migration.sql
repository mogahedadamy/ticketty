ALTER TABLE "settlements"
ADD CONSTRAINT "settlements_date_order_check"
CHECK ("fromDate" <= "toDate"),
ADD CONSTRAINT "settlements_amounts_nonnegative_check"
CHECK ("salesAmount" >= 0 AND "commissionAmount" >= 0 AND "netAmount" >= 0),
ADD CONSTRAINT "settlements_net_calculation_check"
CHECK ("netAmount" = "salesAmount" - "commissionAmount");

CREATE UNIQUE INDEX "settlements_organizationId_agentId_fromDate_toDate_key"
ON "settlements"("organizationId", "agentId", "fromDate", "toDate");

CREATE OR REPLACE FUNCTION prevent_settled_settlement_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."status" = 'SETTLED' THEN
    RAISE EXCEPTION 'Settled records are immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "settlements_prevent_final_mutation"
BEFORE UPDATE OR DELETE ON "settlements"
FOR EACH ROW
EXECUTE FUNCTION prevent_settled_settlement_mutation();
