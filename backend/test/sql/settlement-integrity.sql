BEGIN;

INSERT INTO "organizations" ("id", "name", "slug", "updatedAt")
VALUES ('test-settlement-org', 'Settlement Test', 'test-settlement-org', CURRENT_TIMESTAMP);
INSERT INTO "agents" ("id", "organizationId", "name", "updatedAt")
VALUES ('test-settlement-agent', 'test-settlement-org', 'Agent', CURRENT_TIMESTAMP);
INSERT INTO "settlements" ("id", "organizationId", "agentId", "fromDate", "toDate", "salesAmount", "commissionAmount", "netAmount")
VALUES ('test-settlement', 'test-settlement-org', 'test-settlement-agent', '2026-08-01', '2026-08-02', 100, 10, 90);
UPDATE "settlements" SET "status" = 'SETTLED', "settledAt" = CURRENT_TIMESTAMP WHERE "id" = 'test-settlement';

DO $$ BEGIN
  BEGIN
    UPDATE "settlements" SET "netAmount" = 80 WHERE "id" = 'test-settlement';
    RAISE EXCEPTION 'TEST_FAILURE: settled record mutation accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'TEST_FAILURE:%' THEN RAISE; END IF;
  END;
END $$;

DO $$ BEGIN
  BEGIN
    INSERT INTO "settlements" ("id", "organizationId", "agentId", "fromDate", "toDate", "salesAmount", "commissionAmount", "netAmount")
    VALUES ('test-settlement-duplicate', 'test-settlement-org', 'test-settlement-agent', '2026-08-01', '2026-08-02', 100, 10, 90);
    RAISE EXCEPTION 'TEST_FAILURE: duplicate settlement period accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
END $$;

DO $$ BEGIN
  BEGIN
    INSERT INTO "settlements" ("id", "organizationId", "agentId", "fromDate", "toDate", "salesAmount", "commissionAmount", "netAmount")
    VALUES ('test-settlement-invalid', 'test-settlement-org', 'test-settlement-agent', '2026-08-03', '2026-08-04', 100, 10, 95);
    RAISE EXCEPTION 'TEST_FAILURE: invalid settlement arithmetic accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

ROLLBACK;
