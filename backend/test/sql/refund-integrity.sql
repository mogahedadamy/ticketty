BEGIN;

INSERT INTO "organizations" ("id", "name", "slug", "updatedAt") VALUES
  ('test-refund-org', 'Refund Test', 'test-refund-org', CURRENT_TIMESTAMP),
  ('test-refund-other-org', 'Other Refund Test', 'test-refund-other-org', CURRENT_TIMESTAMP);
INSERT INTO "seat_templates" ("id", "organizationId", "name", "rows", "columnsPerRow", "aisleAfterColumn", "updatedAt")
VALUES ('test-refund-template', 'test-refund-org', 'Test', 1, 1, 1, CURRENT_TIMESTAMP);
INSERT INTO "buses" ("id", "organizationId", "plateNumber", "seatTemplateId", "updatedAt")
VALUES ('test-refund-bus', 'test-refund-org', 'TEST-REFUND', 'test-refund-template', CURRENT_TIMESTAMP);
INSERT INTO "routes" ("id", "organizationId", "name", "fromCity", "toCity", "updatedAt")
VALUES ('test-refund-route', 'test-refund-org', 'Test route', 'A', 'B', CURRENT_TIMESTAMP);
INSERT INTO "trips" ("id", "organizationId", "routeId", "busId", "departureAt", "updatedAt")
VALUES ('test-refund-trip', 'test-refund-org', 'test-refund-route', 'test-refund-bus', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "bookings" ("id", "organizationId", "tripId", "createdById", "totalAmount", "status", "updatedAt")
VALUES ('test-refund-booking', 'test-refund-org', 'test-refund-trip', 'test-user', 100, 'CONFIRMED', CURRENT_TIMESTAMP);
INSERT INTO "payments" ("id", "organizationId", "bookingId", "amount", "method", "status", "receivedById")
VALUES ('test-refund-payment', 'test-refund-org', 'test-refund-booking', 100, 'CASH', 'COMPLETED', 'test-user');

INSERT INTO "refunds" ("id", "organizationId", "bookingId", "paymentId", "amount", "reason", "status", "processedById")
VALUES ('test-refund-valid', 'test-refund-org', 'test-refund-booking', 'test-refund-payment', 40, 'contract test', 'COMPLETED', 'test-user');

DO $$
DECLARE current_refunded DECIMAL(12, 2);
BEGIN
  SELECT "refundedAmount" INTO current_refunded FROM "payments" WHERE "id" = 'test-refund-payment';
  IF current_refunded <> 40 THEN
    RAISE EXCEPTION 'Refund trigger did not update payment total';
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    INSERT INTO "refunds" ("id", "organizationId", "bookingId", "paymentId", "amount", "reason", "status", "processedById")
    VALUES ('test-refund-excess', 'test-refund-org', 'test-refund-booking', 'test-refund-payment', 61, 'must fail', 'COMPLETED', 'test-user');
    RAISE EXCEPTION 'TEST_FAILURE: excessive refund was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'TEST_FAILURE:%' THEN RAISE; END IF;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    INSERT INTO "refunds" ("id", "organizationId", "bookingId", "paymentId", "amount", "reason", "status", "processedById")
    VALUES ('test-refund-cross-tenant', 'test-refund-other-org', 'test-refund-booking', 'test-refund-payment', 1, 'must fail', 'COMPLETED', 'test-user');
    RAISE EXCEPTION 'TEST_FAILURE: cross-tenant refund was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'TEST_FAILURE:%' THEN RAISE; END IF;
  END;
END $$;

ROLLBACK;
