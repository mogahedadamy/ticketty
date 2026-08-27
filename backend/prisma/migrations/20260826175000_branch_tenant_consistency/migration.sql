DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "users" x JOIN "branches" b ON b."id" = x."branchId" WHERE x."organizationId" IS DISTINCT FROM b."organizationId"
    UNION ALL SELECT 1 FROM "customers" x JOIN "branches" b ON b."id" = x."branchId" WHERE x."organizationId" IS DISTINCT FROM b."organizationId"
    UNION ALL SELECT 1 FROM "routes" x JOIN "branches" b ON b."id" = x."branchId" WHERE x."organizationId" IS DISTINCT FROM b."organizationId"
    UNION ALL SELECT 1 FROM "buses" x JOIN "branches" b ON b."id" = x."branchId" WHERE x."organizationId" IS DISTINCT FROM b."organizationId"
    UNION ALL SELECT 1 FROM "drivers" x JOIN "branches" b ON b."id" = x."branchId" WHERE x."organizationId" IS DISTINCT FROM b."organizationId"
    UNION ALL SELECT 1 FROM "trips" x JOIN "branches" b ON b."id" = x."branchId" WHERE x."organizationId" IS DISTINCT FROM b."organizationId"
    UNION ALL SELECT 1 FROM "bookings" x JOIN "branches" b ON b."id" = x."branchId" WHERE x."organizationId" IS DISTINCT FROM b."organizationId"
    UNION ALL SELECT 1 FROM "payments" x JOIN "branches" b ON b."id" = x."branchId" WHERE x."organizationId" IS DISTINCT FROM b."organizationId"
    UNION ALL SELECT 1 FROM "agents" x JOIN "branches" b ON b."id" = x."branchId" WHERE x."organizationId" IS DISTINCT FROM b."organizationId"
    UNION ALL SELECT 1 FROM "expenses" x JOIN "branches" b ON b."id" = x."branchId" WHERE x."organizationId" IS DISTINCT FROM b."organizationId"
    UNION ALL SELECT 1 FROM "audit_logs" x JOIN "branches" b ON b."id" = x."branchId" WHERE x."organizationId" IS DISTINCT FROM b."organizationId"
  ) THEN
    RAISE EXCEPTION 'Existing branch references cross organization boundaries';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION enforce_branch_tenant_consistency()
RETURNS TRIGGER AS $$
DECLARE branch_organization_id TEXT;
BEGIN
  IF NEW."branchId" IS NULL THEN RETURN NEW; END IF;
  SELECT "organizationId" INTO branch_organization_id FROM "branches" WHERE "id" = NEW."branchId";
  IF branch_organization_id IS NULL OR NEW."organizationId" IS NULL OR branch_organization_id <> NEW."organizationId" THEN
    RAISE EXCEPTION 'Branch does not belong to the record organization';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "users_branch_tenant_check" BEFORE INSERT OR UPDATE OF "branchId", "organizationId" ON "users" FOR EACH ROW EXECUTE FUNCTION enforce_branch_tenant_consistency();
CREATE TRIGGER "customers_branch_tenant_check" BEFORE INSERT OR UPDATE OF "branchId", "organizationId" ON "customers" FOR EACH ROW EXECUTE FUNCTION enforce_branch_tenant_consistency();
CREATE TRIGGER "routes_branch_tenant_check" BEFORE INSERT OR UPDATE OF "branchId", "organizationId" ON "routes" FOR EACH ROW EXECUTE FUNCTION enforce_branch_tenant_consistency();
CREATE TRIGGER "buses_branch_tenant_check" BEFORE INSERT OR UPDATE OF "branchId", "organizationId" ON "buses" FOR EACH ROW EXECUTE FUNCTION enforce_branch_tenant_consistency();
CREATE TRIGGER "drivers_branch_tenant_check" BEFORE INSERT OR UPDATE OF "branchId", "organizationId" ON "drivers" FOR EACH ROW EXECUTE FUNCTION enforce_branch_tenant_consistency();
CREATE TRIGGER "trips_branch_tenant_check" BEFORE INSERT OR UPDATE OF "branchId", "organizationId" ON "trips" FOR EACH ROW EXECUTE FUNCTION enforce_branch_tenant_consistency();
CREATE TRIGGER "bookings_branch_tenant_check" BEFORE INSERT OR UPDATE OF "branchId", "organizationId" ON "bookings" FOR EACH ROW EXECUTE FUNCTION enforce_branch_tenant_consistency();
CREATE TRIGGER "payments_branch_tenant_check" BEFORE INSERT OR UPDATE OF "branchId", "organizationId" ON "payments" FOR EACH ROW EXECUTE FUNCTION enforce_branch_tenant_consistency();
CREATE TRIGGER "agents_branch_tenant_check" BEFORE INSERT OR UPDATE OF "branchId", "organizationId" ON "agents" FOR EACH ROW EXECUTE FUNCTION enforce_branch_tenant_consistency();
CREATE TRIGGER "expenses_branch_tenant_check" BEFORE INSERT OR UPDATE OF "branchId", "organizationId" ON "expenses" FOR EACH ROW EXECUTE FUNCTION enforce_branch_tenant_consistency();
CREATE TRIGGER "audit_logs_branch_tenant_check" BEFORE INSERT OR UPDATE OF "branchId", "organizationId" ON "audit_logs" FOR EACH ROW EXECUTE FUNCTION enforce_branch_tenant_consistency();
