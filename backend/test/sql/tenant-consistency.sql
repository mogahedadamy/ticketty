BEGIN;

INSERT INTO "organizations" ("id", "name", "slug", "updatedAt") VALUES
  ('test-tenant-a', 'Tenant A', 'test-tenant-a', CURRENT_TIMESTAMP),
  ('test-tenant-b', 'Tenant B', 'test-tenant-b', CURRENT_TIMESTAMP);
INSERT INTO "branches" ("id", "organizationId", "name", "city", "updatedAt")
VALUES ('test-branch-b', 'test-tenant-b', 'Branch B', 'B', CURRENT_TIMESTAMP);
INSERT INTO "roles" ("id", "organizationId", "key", "nameAr", "nameEn", "permissions")
VALUES ('test-role-b', 'test-tenant-b', 'TEST', 'اختبار', 'Test', ARRAY[]::TEXT[]);
INSERT INTO "users" ("id", "organizationId", "roleId", "name", "email", "passwordHash", "updatedAt")
VALUES ('test-user-b', 'test-tenant-b', 'test-role-b', 'User B', 'tenant-b-test@example.invalid', 'not-a-real-hash', CURRENT_TIMESTAMP);
INSERT INTO "seat_templates" ("id", "organizationId", "name", "rows", "columnsPerRow", "aisleAfterColumn", "updatedAt") VALUES
  ('test-template-a', 'test-tenant-a', 'A', 1, 1, 1, CURRENT_TIMESTAMP),
  ('test-template-b', 'test-tenant-b', 'B', 1, 1, 1, CURRENT_TIMESTAMP);
INSERT INTO "buses" ("id", "organizationId", "plateNumber", "seatTemplateId", "updatedAt")
VALUES ('test-bus-a', 'test-tenant-a', 'TENANT-A', 'test-template-a', CURRENT_TIMESTAMP);
INSERT INTO "routes" ("id", "organizationId", "name", "fromCity", "toCity", "updatedAt")
VALUES ('test-route-a', 'test-tenant-a', 'A route', 'A', 'B', CURRENT_TIMESTAMP);
INSERT INTO "trips" ("id", "organizationId", "routeId", "busId", "departureAt", "updatedAt")
VALUES ('test-trip-a', 'test-tenant-a', 'test-route-a', 'test-bus-a', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

DO $$ BEGIN
  BEGIN
    INSERT INTO "customers" ("id", "organizationId", "branchId", "name", "phone", "updatedAt")
    VALUES ('test-cross-branch-customer', 'test-tenant-a', 'test-branch-b', 'Cross Branch', '000', CURRENT_TIMESTAMP);
    RAISE EXCEPTION 'TEST_FAILURE: cross-tenant branch accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'TEST_FAILURE:%' THEN RAISE; END IF;
  END;
END $$;

DO $$ BEGIN
  BEGIN
    INSERT INTO "buses" ("id", "organizationId", "plateNumber", "seatTemplateId", "updatedAt")
    VALUES ('test-cross-bus', 'test-tenant-a', 'CROSS-BUS', 'test-template-b', CURRENT_TIMESTAMP);
    RAISE EXCEPTION 'TEST_FAILURE: cross-tenant bus template accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
END $$;

DO $$ BEGIN
  BEGIN
    INSERT INTO "agents" ("id", "organizationId", "userId", "name", "updatedAt")
    VALUES ('test-cross-agent', 'test-tenant-a', 'test-user-b', 'Cross Agent', CURRENT_TIMESTAMP);
    RAISE EXCEPTION 'TEST_FAILURE: cross-tenant agent user accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
END $$;

DO $$ BEGIN
  BEGIN
    INSERT INTO "expenses" ("id", "organizationId", "tripId", "description", "amount", "createdById", "updatedAt")
    VALUES ('test-cross-expense', 'test-tenant-b', 'test-trip-a', 'Cross expense', 1, 'test-user', CURRENT_TIMESTAMP);
    RAISE EXCEPTION 'TEST_FAILURE: cross-tenant expense trip accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
END $$;

DO $$ BEGIN
  BEGIN
    INSERT INTO "bookings" ("id", "organizationId", "tripId", "createdById", "totalAmount", "status", "updatedAt")
    VALUES ('test-cross-booking', 'test-tenant-b', 'test-trip-a', 'test-user', 1, 'CONFIRMED', CURRENT_TIMESTAMP);
    RAISE EXCEPTION 'TEST_FAILURE: cross-tenant booking trip accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
END $$;

ROLLBACK;
