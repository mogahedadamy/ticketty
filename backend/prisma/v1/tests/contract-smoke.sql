-- Smoke tests for Ticketty Database Contract v1.0.
-- Run only against a disposable database after base schema + SQL contract.
\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('app.organization_id', '11111111-1111-4111-8111-111111111111', true);

INSERT INTO currencies(id, code, name, "minorUnits", active)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'SDG', 'Sudanese Pound', 2, true);

INSERT INTO organizations(id, code, legal_name, display_name, status, default_currency_id, timezone, updated_at)
VALUES ('11111111-1111-4111-8111-111111111111', 'TEST', 'Test Transport', 'Test', 'ACTIVE',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Africa/Khartoum', now());

INSERT INTO branches(id, organization_id, code, name, timezone, updated_at)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111',
        'HQ', 'HQ', 'Africa/Khartoum', now());

INSERT INTO users(id, email, password_hash, updated_at)
VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'contract@example.test', 'not-a-real-hash', now());
INSERT INTO organization_memberships(id, organization_id, user_id, updated_at)
VALUES ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '11111111-1111-4111-8111-111111111111',
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc', now());

INSERT INTO stations(id, organization_id, code, name, city, updated_at) VALUES
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', '11111111-1111-4111-8111-111111111111', 'KRT', 'Khartoum', 'Khartoum', now()),
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', '11111111-1111-4111-8111-111111111111', 'ATB', 'Atbara', 'Atbara', now());

-- Route origin and destination must differ.
DO $$
BEGIN
  BEGIN
    INSERT INTO routes(id, organization_id, code, name, origin_station_id, destination_station_id, status, updated_at)
    VALUES ('ffffffff-ffff-4fff-8fff-fffffffffff0', '11111111-1111-4111-8111-111111111111',
            'BAD', 'Bad route', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
            'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'ACTIVE', now());
    RAISE EXCEPTION 'expected route check violation';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

INSERT INTO routes(id, organization_id, code, name, origin_station_id, destination_station_id, status, updated_at)
VALUES ('ffffffff-ffff-4fff-8fff-ffffffffffff', '11111111-1111-4111-8111-111111111111',
        'KRT-ATB', 'Khartoum - Atbara', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
        'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', 'ACTIVE', now());

INSERT INTO seat_layouts(id, organization_id, name, layout_type, version, status, updated_at)
VALUES ('10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
        'Coach 2+2', 'COACH_2_2', 1, 'ACTIVE', now());
INSERT INTO seat_definitions(id, organization_id, seat_layout_id, seat_code, row_number, column_number, seat_type)
VALUES ('10000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
        '10000000-0000-4000-8000-000000000001', 'A1', 1, 1, 'REGULAR');
INSERT INTO bus_models(id, organization_id, manufacturer, model, seat_layout_id, status)
VALUES ('10000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111',
        'Test', 'Coach', '10000000-0000-4000-8000-000000000001', 'ACTIVE');
INSERT INTO buses(id, organization_id, branch_id, bus_model_id, code, registration_number, status, updated_at)
VALUES ('10000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111',
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '10000000-0000-4000-8000-000000000003',
        'BUS-1', 'TEST-001', 'READY', now());
INSERT INTO drivers(id, organization_id, branch_id, employee_code, first_name, last_name, status, updated_at)
VALUES ('10000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111',
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'DRV-1', 'Test', 'Driver', 'ACTIVE', now());

INSERT INTO trips(id, organization_id, branch_id, route_id, service_date,
                  scheduled_departure_at, scheduled_arrival_at, status, currency_id,
                  base_fare, bus_id, driver_id, seat_layout_id, updated_at)
VALUES ('10000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111',
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        DATE '2030-01-01', TIMESTAMPTZ '2030-01-01 08:00:00+00', TIMESTAMPTZ '2030-01-01 12:00:00+00',
        'SCHEDULED', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 100,
        '10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000005',
        '10000000-0000-4000-8000-000000000001', now());

-- Same bus or driver cannot overlap an active trip.
DO $$
BEGIN
  BEGIN
    INSERT INTO trips(id, organization_id, branch_id, route_id, service_date,
                      scheduled_departure_at, scheduled_arrival_at, status, currency_id,
                      base_fare, bus_id, driver_id, seat_layout_id, updated_at)
    VALUES ('10000000-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111',
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'ffffffff-ffff-4fff-8fff-ffffffffffff',
            DATE '2030-01-01', TIMESTAMPTZ '2030-01-01 10:00:00+00', TIMESTAMPTZ '2030-01-01 14:00:00+00',
            'SCHEDULED', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 100,
            '10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000005',
            '10000000-0000-4000-8000-000000000001', now());
    RAISE EXCEPTION 'expected resource overlap violation';
  EXCEPTION WHEN exclusion_violation THEN NULL;
  END;
END $$;

INSERT INTO trip_seats(id, organization_id, trip_id, seat_definition_id, seat_code, row_number, column_number,
                       seat_type, status, fare, currency_id, hold_expires_at, updated_at)
VALUES ('10000000-0000-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111',
        '10000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002',
        'A1', 1, 1, 'REGULAR', 'HELD', 100, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        now() + interval '5 minutes', now());
INSERT INTO seat_holds(id, organization_id, trip_seat_id, held_by_membership_id, status, expires_at)
VALUES ('10000000-0000-4000-8000-000000000009', '11111111-1111-4111-8111-111111111111',
        '10000000-0000-4000-8000-000000000008', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        'ACTIVE', now() + interval '5 minutes');

DO $$
BEGIN
  BEGIN
    INSERT INTO seat_holds(id, organization_id, trip_seat_id, status, expires_at)
    VALUES ('10000000-0000-4000-8000-000000000010', '11111111-1111-4111-8111-111111111111',
            '10000000-0000-4000-8000-000000000008', 'ACTIVE', now() + interval '5 minutes');
    RAISE EXCEPTION 'expected one-active-hold violation';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
END $$;

-- Different bookings cannot actively reserve/sell the same TripSeat.
INSERT INTO passengers(id, organization_id, first_name, last_name, updated_at)
VALUES ('11000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Test', 'Passenger', now());
INSERT INTO bookings(id, organization_id, branch_id, booking_number, trip_id, status, currency_id,
                     subtotal, discount, commission, tax, total, created_by_membership_id, updated_at) VALUES
('11000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'B-1', '10000000-0000-4000-8000-000000000006',
 'PENDING', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 100, 0, 0, 0, 100,
 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', now()),
('11000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'B-2', '10000000-0000-4000-8000-000000000006',
 'PENDING', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 100, 0, 0, 0, 100,
 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', now());
INSERT INTO booking_items(id, organization_id, booking_id, trip_seat_id, passenger_id,
                          fare, discount, commission, tax, total, status, updated_at)
VALUES ('11000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111',
        '11000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000008',
        '11000000-0000-4000-8000-000000000001', 100, 0, 0, 0, 100, 'RESERVED', now());
DO $$
BEGIN
  BEGIN
    INSERT INTO booking_items(id, organization_id, booking_id, trip_seat_id, passenger_id,
                              fare, discount, commission, tax, total, status, updated_at)
    VALUES ('11000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111',
            '11000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000008',
            '11000000-0000-4000-8000-000000000001', 100, 0, 0, 0, 100, 'RESERVED', now());
    RAISE EXCEPTION 'expected active seat allocation uniqueness violation';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
END $$;

-- Journal cannot post unbalanced, can post balanced, and is immutable afterward.
INSERT INTO accounts(id, organization_id, code, name, type, status) VALUES
('20000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '1000', 'Cash', 'ASSET', 'ACTIVE'),
('20000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '2000', 'Deferred Revenue', 'LIABILITY', 'ACTIVE');
INSERT INTO fiscal_periods(id, organization_id, fiscal_year, period_number, starts_at, ends_at, status)
VALUES ('20000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111',
        2030, 1, DATE '2030-01-01', DATE '2030-01-31', 'OPEN');
INSERT INTO journals(id, organization_id, code, name)
VALUES ('20000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'SALES', 'Sales Journal');
DO $$
BEGIN
  BEGIN
    INSERT INTO journal_entries(id, organization_id, journal_id, fiscal_period_id, entry_number,
                                entry_date, source_type, source_id, currency_id, status, description, updated_at)
    VALUES ('20000000-0000-4000-8000-000000000099', '11111111-1111-4111-8111-111111111111',
            '20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000003',
            'JE-BYPASS', DATE '2030-01-01', 'SMOKE', '20000000-0000-4000-8000-000000000099',
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'POSTED', 'Must fail', now());
    RAISE EXCEPTION 'expected direct posted insert violation';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

INSERT INTO journal_entries(id, organization_id, journal_id, fiscal_period_id, entry_number,
                            entry_date, source_type, source_id, currency_id, status, description, updated_at)
VALUES ('20000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111',
        '20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000003',
        'JE-1', DATE '2030-01-01', 'SMOKE', '20000000-0000-4000-8000-000000000006',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'DRAFT', 'Smoke entry', now());
INSERT INTO journal_entry_lines(organization_id, journal_entry_id, line_number, account_id, debit, credit, currency_id)
VALUES ('11111111-1111-4111-8111-111111111111', '20000000-0000-4000-8000-000000000005', 1,
        '20000000-0000-4000-8000-000000000001', 100, 0, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

DO $$
BEGIN
  BEGIN
    UPDATE journal_entries SET status = 'POSTED' WHERE id = '20000000-0000-4000-8000-000000000005';
    RAISE EXCEPTION 'expected unbalanced journal violation';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

INSERT INTO journal_entry_lines(organization_id, journal_entry_id, line_number, account_id, debit, credit, currency_id)
VALUES ('11111111-1111-4111-8111-111111111111', '20000000-0000-4000-8000-000000000005', 2,
        '20000000-0000-4000-8000-000000000002', 0, 100, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
UPDATE journal_entries SET status = 'POSTED' WHERE id = '20000000-0000-4000-8000-000000000005';

DO $$
BEGIN
  BEGIN
    UPDATE journal_entries SET description = 'illegal edit' WHERE id = '20000000-0000-4000-8000-000000000005';
    RAISE EXCEPTION 'expected posted journal immutability violation';
  EXCEPTION WHEN SQLSTATE '55000' THEN NULL;
  END;
END $$;

-- Completed payments require a posted source-specific journal entry.
INSERT INTO journal_entries(id, organization_id, journal_id, fiscal_period_id, entry_number,
                            entry_date, source_type, source_id, currency_id, status, description, updated_at)
VALUES ('30000000-0000-4000-8000-000000000099', '11111111-1111-4111-8111-111111111111',
        '20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000003',
        'JE-PAY-1', DATE '2030-01-01', 'PAYMENT', '30000000-0000-4000-8000-000000000001',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'DRAFT', 'Payment smoke entry', now());
INSERT INTO journal_entry_lines(organization_id, journal_entry_id, line_number, account_id, debit, credit, currency_id) VALUES
('11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000099', 1,
 '20000000-0000-4000-8000-000000000001', 100, 0, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
('11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000099', 2,
 '20000000-0000-4000-8000-000000000002', 0, 100, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
UPDATE journal_entries SET status='POSTED' WHERE id='30000000-0000-4000-8000-000000000099';

-- Completed refunds may not exceed captured payment.
INSERT INTO payments(id, organization_id, branch_id, payment_number, payer_type, amount, currency_id,
                     method, status)
VALUES ('30000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'PAY-1', 'CUSTOMER', 100,
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'CASH', 'PENDING');
UPDATE payments SET status='COMPLETED', received_at=now(),
                    journal_entry_id='30000000-0000-4000-8000-000000000099'
WHERE id='30000000-0000-4000-8000-000000000001';
DO $$
BEGIN
  BEGIN
    UPDATE payments SET status='FAILED' WHERE id='30000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'expected illegal completed payment transition';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO payment_allocations(organization_id,payment_id,target_type,booking_id,amount)
    VALUES ('11111111-1111-4111-8111-111111111111','30000000-0000-4000-8000-000000000001',
            'BOOKING','11000000-0000-4000-8000-000000000002',10);
    RAISE EXCEPTION 'expected completed payment allocation immutability';
  EXCEPTION WHEN SQLSTATE '55000' THEN NULL;
  END;
END $$;
DO $$
BEGIN
  BEGIN
    INSERT INTO refunds(id, organization_id, payment_id, refund_number, amount, currency_id, reason, status, completed_at)
    VALUES ('30000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
            '30000000-0000-4000-8000-000000000001', 'REF-1', 101,
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Too much', 'COMPLETED', now());
    RAISE EXCEPTION 'expected refund ceiling violation';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

-- Audit is append-only.
INSERT INTO audit_logs(id, organization_id, action, entity_type, entity_id, request_id)
VALUES ('40000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
        'SMOKE', 'Contract', '40000000-0000-4000-8000-000000000002', 'smoke-request');
DO $$
BEGIN
  BEGIN
    UPDATE audit_logs SET action = 'TAMPERED' WHERE id = '40000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'expected append-only audit violation';
  EXCEPTION WHEN SQLSTATE '55000' THEN NULL;
  END;
END $$;

-- Ensure RLS policies were installed for tenant tables.
DO $$
DECLARE policy_count integer;
BEGIN
  SELECT count(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
  IF policy_count < 50 THEN
    RAISE EXCEPTION 'expected at least 50 RLS policies, found %', policy_count;
  END IF;
END $$;

-- Force all deferred aggregate constraints before discarding fixture data.
SET CONSTRAINTS ALL IMMEDIATE;

ROLLBACK;
\echo 'Ticketty contract smoke tests passed.'
