-- Ticketty Database Contract v1.0
-- SQL objects Prisma cannot represent. Apply only after generating the v1 schema.
-- This script is designed for PostgreSQL 15+ and is idempotent where practical.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ---------------------------------------------------------------------------
-- Scalar and row-local invariants
-- ---------------------------------------------------------------------------

ALTER TABLE currencies
  ADD CONSTRAINT currencies_code_upper_chk CHECK (code = upper(code)),
  ADD CONSTRAINT currencies_minor_units_chk CHECK ("minorUnits" BETWEEN 0 AND 6);

ALTER TABLE organizations
  ADD CONSTRAINT organizations_timezone_chk CHECK (length(trim(timezone)) > 0);

ALTER TABLE stations
  ADD CONSTRAINT stations_latitude_chk CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  ADD CONSTRAINT stations_longitude_chk CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);

ALTER TABLE routes
  ADD CONSTRAINT routes_distinct_endpoints_chk CHECK (origin_station_id <> destination_station_id),
  ADD CONSTRAINT routes_distance_chk CHECK (distance_km IS NULL OR distance_km > 0),
  ADD CONSTRAINT routes_duration_chk CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0);

ALTER TABLE route_stops
  ADD CONSTRAINT route_stops_sequence_chk CHECK (sequence > 0),
  ADD CONSTRAINT route_stops_offsets_chk CHECK (
    arrival_offset_minutes IS NULL OR departure_offset_minutes IS NULL
    OR departure_offset_minutes >= arrival_offset_minutes
  ),
  ADD CONSTRAINT route_stops_distance_chk CHECK (distance_from_origin_km IS NULL OR distance_from_origin_km >= 0);

ALTER TABLE seat_definitions
  ADD CONSTRAINT seat_definitions_coordinates_chk CHECK (row_number >= 0 AND column_number >= 0);
CREATE UNIQUE INDEX seat_definitions_layout_coordinates_uq
  ON seat_definitions(seat_layout_id, row_number, column_number);

ALTER TABLE buses
  ADD CONSTRAINT buses_license_expiry_chk CHECK (license_expiry IS NULL OR license_expiry >= DATE '1900-01-01');

ALTER TABLE driver_documents
  ADD CONSTRAINT driver_documents_dates_chk CHECK (expires_at IS NULL OR issued_at IS NULL OR expires_at >= issued_at);

ALTER TABLE trips
  ADD CONSTRAINT trips_schedule_window_chk CHECK (scheduled_arrival_at > scheduled_departure_at),
  ADD CONSTRAINT trips_actual_window_chk CHECK (
    actual_arrival_at IS NULL OR actual_departure_at IS NULL OR actual_arrival_at >= actual_departure_at
  ),
  ADD CONSTRAINT trips_base_fare_chk CHECK (base_fare >= 0),
  ADD CONSTRAINT trips_version_chk CHECK (version >= 0);

ALTER TABLE trip_seats
  ADD CONSTRAINT trip_seats_fare_chk CHECK (fare >= 0),
  ADD CONSTRAINT trip_seats_coordinates_chk CHECK (row_number >= 0 AND column_number >= 0),
  ADD CONSTRAINT trip_seats_sellable_type_chk CHECK (
    seat_type::text NOT IN ('CREW', 'BLOCKED') OR status::text = 'BLOCKED'
  ),
  ADD CONSTRAINT trip_seats_hold_state_chk CHECK (
    (status::text = 'HELD' AND hold_expires_at IS NOT NULL)
    OR (status::text <> 'HELD' AND hold_expires_at IS NULL)
  ),
  ADD CONSTRAINT trip_seats_version_chk CHECK (version >= 0);

ALTER TABLE seat_holds
  ADD CONSTRAINT seat_holds_expiry_chk CHECK (expires_at > created_at),
  ADD CONSTRAINT seat_holds_release_chk CHECK (
    (status::text IN ('EXPIRED', 'RELEASED') AND released_at IS NOT NULL)
    OR status::text IN ('ACTIVE', 'CONVERTED')
  );
CREATE UNIQUE INDEX seat_holds_one_active_per_seat_uq
  ON seat_holds(trip_seat_id)
  WHERE status = 'ACTIVE'::"HoldStatus";

ALTER TABLE bookings
  ADD CONSTRAINT bookings_amounts_chk CHECK (
    subtotal >= 0 AND discount >= 0 AND commission >= 0 AND tax >= 0 AND total >= 0
  ),
  ADD CONSTRAINT bookings_total_chk CHECK (total = subtotal - discount + tax),
  ADD CONSTRAINT bookings_version_chk CHECK (version >= 0);

ALTER TABLE booking_items
  ADD CONSTRAINT booking_items_amounts_chk CHECK (
    fare >= 0 AND discount >= 0 AND commission >= 0 AND tax >= 0 AND total >= 0
  ),
  ADD CONSTRAINT booking_items_total_chk CHECK (total = fare - discount + tax);
CREATE UNIQUE INDEX booking_items_one_active_per_trip_seat_uq
  ON booking_items(trip_seat_id)
  WHERE status IN ('RESERVED'::"BookingItemStatus", 'CONFIRMED'::"BookingItemStatus", 'USED'::"BookingItemStatus");

ALTER TABLE tickets
  ADD CONSTRAINT tickets_status_timestamps_chk CHECK (
    (status::text = 'CANCELLED' AND cancelled_at IS NOT NULL)
    OR (status::text <> 'CANCELLED')
  ),
  ADD CONSTRAINT tickets_used_timestamp_chk CHECK (
    (status::text = 'USED' AND used_at IS NOT NULL)
    OR (status::text <> 'USED')
  ),
  ADD CONSTRAINT tickets_version_chk CHECK (version >= 0 AND document_version > 0),
  ADD CONSTRAINT tickets_fare_chk CHECK (fare >= 0);
CREATE UNIQUE INDEX tickets_one_active_per_booking_item_uq
  ON tickets(booking_item_id)
  WHERE status IN ('ISSUED'::"TicketStatus", 'CHECKED_IN'::"TicketStatus");

ALTER TABLE manifests
  ADD CONSTRAINT manifests_version_chk CHECK (version > 0 AND snapshot_version > 0),
  ADD CONSTRAINT manifests_lock_state_chk CHECK (
    (status::text = 'LOCKED' AND locked_at IS NOT NULL AND locked_by_membership_id IS NOT NULL)
    OR (status::text = 'OPEN' AND locked_at IS NULL)
  ),
  ADD CONSTRAINT manifests_totals_chk CHECK (
    passenger_count >= 0 AND gross_sales >= 0 AND total_commission >= 0
    AND net_sales = gross_sales - total_commission
  );

ALTER TABLE agents
  ADD CONSTRAINT agents_credit_limit_chk CHECK (credit_limit >= 0),
  ADD CONSTRAINT agents_version_chk CHECK (version >= 0);

ALTER TABLE commission_rules
  ADD CONSTRAINT commission_rules_value_chk CHECK (
    (type::text = 'PERCENTAGE' AND value BETWEEN 0 AND 100)
    OR (type::text = 'FIXED' AND value >= 0)
  ),
  ADD CONSTRAINT commission_rules_period_chk CHECK (effective_to IS NULL OR effective_to > effective_from);

ALTER TABLE agent_transactions
  ADD CONSTRAINT agent_transactions_sides_chk CHECK (
    debit >= 0 AND credit >= 0 AND ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
  );

ALTER TABLE agent_settlements
  ADD CONSTRAINT agent_settlements_period_chk CHECK (period_end > period_start),
  ADD CONSTRAINT agent_settlements_amounts_chk CHECK (
    gross_amount >= 0 AND commission_amount >= 0 AND net_amount >= 0
    AND net_amount = gross_amount - commission_amount
  ),
  ADD CONSTRAINT agent_settlements_approval_chk CHECK (
    (status::text = 'APPROVED' AND approved_at IS NOT NULL AND approved_by_membership_id IS NOT NULL)
    OR (status::text = 'POSTED' AND approved_at IS NOT NULL AND approved_by_membership_id IS NOT NULL
        AND posted_at IS NOT NULL AND journal_entry_id IS NOT NULL)
    OR status::text IN ('DRAFT', 'CANCELLED')
  );

ALTER TABLE agent_settlement_lines
  ADD CONSTRAINT agent_settlement_lines_amount_chk CHECK (amount > 0);

ALTER TABLE payments
  ADD CONSTRAINT payments_amount_chk CHECK (amount > 0),
  ADD CONSTRAINT payments_received_chk CHECK (
    (status::text IN ('COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED') AND received_at IS NOT NULL AND journal_entry_id IS NOT NULL)
    OR status::text IN ('PENDING', 'AUTHORIZED', 'FAILED', 'CANCELLED')
  ),
  ADD CONSTRAINT payments_version_chk CHECK (version >= 0);
DROP INDEX IF EXISTS payments_organization_id_provider_external_reference_key;
CREATE UNIQUE INDEX payments_provider_reference_uq
  ON payments(organization_id, provider, external_reference)
  WHERE provider IS NOT NULL AND external_reference IS NOT NULL;

ALTER TABLE payment_allocations
  ADD CONSTRAINT payment_allocations_amount_chk CHECK (amount > 0),
  ADD CONSTRAINT payment_allocations_target_chk CHECK (
    (target_type::text = 'BOOKING' AND booking_id IS NOT NULL AND agent_settlement_id IS NULL AND expense_id IS NULL)
    OR (target_type::text = 'AGENT_SETTLEMENT' AND booking_id IS NULL AND agent_settlement_id IS NOT NULL AND expense_id IS NULL)
    OR (target_type::text = 'EXPENSE' AND booking_id IS NULL AND agent_settlement_id IS NULL AND expense_id IS NOT NULL)
    OR (target_type::text = 'OTHER' AND booking_id IS NULL AND agent_settlement_id IS NULL AND expense_id IS NULL)
  );

ALTER TABLE refunds
  ADD CONSTRAINT refunds_amount_chk CHECK (amount > 0),
  ADD CONSTRAINT refunds_completion_chk CHECK (
    (status::text = 'COMPLETED' AND completed_at IS NOT NULL AND journal_entry_id IS NOT NULL)
    OR status::text <> 'COMPLETED'
  );
DROP INDEX IF EXISTS refunds_organization_id_provider_reference_key;
CREATE UNIQUE INDEX refunds_provider_reference_uq
  ON refunds(organization_id, provider_reference)
  WHERE provider_reference IS NOT NULL;

ALTER TABLE payment_provider_events
  ADD CONSTRAINT payment_provider_events_signature_chk CHECK (
    status::text IN ('RECEIVED', 'IGNORED', 'FAILED') OR signature_valid
  );

ALTER TABLE expenses
  ADD CONSTRAINT expenses_amounts_chk CHECK (subtotal >= 0 AND tax >= 0 AND total = subtotal + tax),
  ADD CONSTRAINT expenses_approval_chk CHECK (
    (status::text = 'APPROVED' AND approved_at IS NOT NULL AND approved_by_membership_id IS NOT NULL)
    OR (status::text = 'POSTED' AND approved_at IS NOT NULL AND approved_by_membership_id IS NOT NULL
        AND posted_at IS NOT NULL AND journal_entry_id IS NOT NULL)
    OR status::text IN ('DRAFT', 'SUBMITTED', 'REJECTED', 'CANCELLED')
  );

ALTER TABLE fiscal_periods
  ADD CONSTRAINT fiscal_periods_number_chk CHECK (period_number > 0),
  ADD CONSTRAINT fiscal_periods_window_chk CHECK (ends_at >= starts_at),
  ADD CONSTRAINT fiscal_periods_closed_chk CHECK (
    (status::text = 'CLOSED' AND closed_at IS NOT NULL) OR status::text <> 'CLOSED'
  );
ALTER TABLE fiscal_periods
  ADD CONSTRAINT fiscal_periods_no_overlap_excl
  EXCLUDE USING gist (
    organization_id WITH =,
    daterange(starts_at, ends_at, '[]') WITH &&
  );

ALTER TABLE journal_entry_lines
  ADD CONSTRAINT journal_entry_lines_sides_chk CHECK (
    debit >= 0 AND credit >= 0 AND ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
  );

ALTER TABLE idempotency_keys
  ADD CONSTRAINT idempotency_keys_expiry_chk CHECK (expires_at > created_at);

ALTER TABLE outbox_events
  ADD CONSTRAINT outbox_events_attempts_chk CHECK (attempts >= 0 AND aggregate_version > 0),
  ADD CONSTRAINT outbox_events_lease_chk CHECK (
    (status::text = 'PROCESSING' AND locked_at IS NOT NULL AND locked_by IS NOT NULL)
    OR status::text <> 'PROCESSING'
  ),
  ADD CONSTRAINT outbox_events_processed_chk CHECK (
    (status::text = 'PROCESSED' AND processed_at IS NOT NULL) OR status::text <> 'PROCESSED'
  );

ALTER TABLE file_assets
  ADD CONSTRAINT file_assets_size_chk CHECK (size_bytes >= 0);

ALTER TABLE number_sequences
  ADD CONSTRAINT number_sequences_values_chk CHECK (next_value > 0 AND padding BETWEEN 1 AND 20),
  ADD CONSTRAINT number_sequences_scope_chk CHECK (
    (scope::text = 'BRANCH' AND branch_id IS NOT NULL)
    OR (scope::text = 'ORGANIZATION' AND branch_id IS NULL)
  );
DROP INDEX IF EXISTS number_sequences_organization_id_branch_id_code_key;
CREATE UNIQUE INDEX number_sequences_tenant_scope_uq
  ON number_sequences(organization_id, coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid), code);

-- PostgreSQL NULL semantics do not protect global system role codes.
CREATE UNIQUE INDEX roles_system_code_uq ON roles(code)
  WHERE scope = 'SYSTEM'::"RoleScope" AND organization_id IS NULL;
ALTER TABLE roles
  ADD CONSTRAINT roles_scope_tenant_chk CHECK (
    (scope::text = 'SYSTEM' AND organization_id IS NULL)
    OR (scope::text = 'TENANT' AND organization_id IS NOT NULL)
  );

-- Case-insensitive identity uniqueness. Keep application normalization too.
CREATE UNIQUE INDEX users_email_lower_uq ON users(lower(email));

-- ---------------------------------------------------------------------------
-- Scheduling conflicts: active trips may not overlap for the same resource.
-- The interval is [departure, arrival), allowing immediate reuse at arrival.
-- ---------------------------------------------------------------------------
ALTER TABLE trips
  ADD CONSTRAINT trips_bus_schedule_no_overlap_excl
  EXCLUDE USING gist (
    organization_id WITH =,
    bus_id WITH =,
    tstzrange(scheduled_departure_at, scheduled_arrival_at, '[)') WITH &&
  ) WHERE (bus_id IS NOT NULL AND status IN ('SCHEDULED'::"TripStatus", 'BOARDING'::"TripStatus", 'DEPARTED'::"TripStatus"));

ALTER TABLE trips
  ADD CONSTRAINT trips_driver_schedule_no_overlap_excl
  EXCLUDE USING gist (
    organization_id WITH =,
    driver_id WITH =,
    tstzrange(scheduled_departure_at, scheduled_arrival_at, '[)') WITH &&
  ) WHERE (driver_id IS NOT NULL AND status IN ('SCHEDULED'::"TripStatus", 'BOARDING'::"TripStatus", 'DEPARTED'::"TripStatus"));

-- ---------------------------------------------------------------------------
-- Composite actor and scope FKs not modeled as navigation properties in Prisma.
-- They ensure actor IDs are memberships of the same tenant.
-- ---------------------------------------------------------------------------
ALTER TABLE bookings ADD CONSTRAINT bookings_creator_membership_fk
  FOREIGN KEY (organization_id, created_by_membership_id)
  REFERENCES organization_memberships(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE agent_settlements ADD CONSTRAINT agent_settlements_creator_membership_fk
  FOREIGN KEY (organization_id, created_by_membership_id)
  REFERENCES organization_memberships(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE agent_settlements ADD CONSTRAINT agent_settlements_approver_membership_fk
  FOREIGN KEY (organization_id, approved_by_membership_id)
  REFERENCES organization_memberships(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE expenses ADD CONSTRAINT expenses_creator_membership_fk
  FOREIGN KEY (organization_id, created_by_membership_id)
  REFERENCES organization_memberships(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE expenses ADD CONSTRAINT expenses_approver_membership_fk
  FOREIGN KEY (organization_id, approved_by_membership_id)
  REFERENCES organization_memberships(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE refunds ADD CONSTRAINT refunds_approver_membership_fk
  FOREIGN KEY (organization_id, approved_by_membership_id)
  REFERENCES organization_memberships(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE manifests ADD CONSTRAINT manifests_locker_membership_fk
  FOREIGN KEY (organization_id, locked_by_membership_id)
  REFERENCES organization_memberships(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_poster_membership_fk
  FOREIGN KEY (organization_id, posted_by_membership_id)
  REFERENCES organization_memberships(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE seat_holds ADD CONSTRAINT seat_holds_actor_membership_fk
  FOREIGN KEY (organization_id, held_by_membership_id)
  REFERENCES organization_memberships(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE ticket_events ADD CONSTRAINT ticket_events_actor_membership_fk
  FOREIGN KEY (organization_id, actor_membership_id)
  REFERENCES organization_memberships(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE boarding_events ADD CONSTRAINT boarding_events_actor_membership_fk
  FOREIGN KEY (organization_id, performed_by_membership_id)
  REFERENCES organization_memberships(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_actor_membership_fk
  FOREIGN KEY (organization_id, actor_membership_id)
  REFERENCES organization_memberships(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE payments ADD CONSTRAINT payments_journal_entry_fk
  FOREIGN KEY (organization_id, journal_entry_id)
  REFERENCES journal_entries(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE refunds ADD CONSTRAINT refunds_journal_entry_fk
  FOREIGN KEY (organization_id, journal_entry_id)
  REFERENCES journal_entries(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE expenses ADD CONSTRAINT expenses_journal_entry_fk
  FOREIGN KEY (organization_id, journal_entry_id)
  REFERENCES journal_entries(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE agent_settlements ADD CONSTRAINT agent_settlements_journal_entry_fk
  FOREIGN KEY (organization_id, journal_entry_id)
  REFERENCES journal_entries(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE adjustments ADD CONSTRAINT adjustments_creator_membership_fk
  FOREIGN KEY (organization_id, created_by_membership_id)
  REFERENCES organization_memberships(organization_id, id) ON DELETE RESTRICT;
ALTER TABLE adjustments ADD CONSTRAINT adjustments_approver_membership_fk
  FOREIGN KEY (organization_id, approved_by_membership_id)
  REFERENCES organization_memberships(organization_id, id) ON DELETE RESTRICT;

-- Standalone tenant tables whose organization relation is intentionally not a
-- Prisma navigation property still receive a real database FK.
ALTER TABLE devices ADD CONSTRAINT devices_organization_fk
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;
ALTER TABLE vendors ADD CONSTRAINT vendors_organization_fk
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;
ALTER TABLE adjustments ADD CONSTRAINT adjustments_organization_fk
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;
ALTER TABLE idempotency_keys ADD CONSTRAINT idempotency_keys_organization_fk
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;
ALTER TABLE payment_provider_events ADD CONSTRAINT payment_provider_events_organization_fk
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_organization_fk
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;
ALTER TABLE outbox_events ADD CONSTRAINT outbox_events_organization_fk
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION ticketty_validate_role_tenant()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE role_org uuid;
BEGIN
  SELECT organization_id INTO role_org FROM roles WHERE id = NEW.role_id;
  IF NOT FOUND OR role_org IS DISTINCT FROM NEW.organization_id THEN
    RAISE EXCEPTION 'role tenant does not match relation tenant' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER role_permissions_tenant_guard
BEFORE INSERT OR UPDATE ON role_permissions
FOR EACH ROW EXECUTE FUNCTION ticketty_validate_role_tenant();
CREATE TRIGGER membership_roles_tenant_guard
BEFORE INSERT OR UPDATE ON membership_roles
FOR EACH ROW EXECUTE FUNCTION ticketty_validate_role_tenant();

CREATE OR REPLACE FUNCTION ticketty_validate_agent_membership_tenant()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.membership_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE id = NEW.membership_id AND organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'agent membership does not belong to agent tenant' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER agents_membership_tenant_guard
BEFORE INSERT OR UPDATE OF membership_id, organization_id ON agents
FOR EACH ROW EXECUTE FUNCTION ticketty_validate_agent_membership_tenant();

-- ---------------------------------------------------------------------------
-- Cross-aggregate semantic consistency
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX agents_membership_uq
  ON agents(organization_id, membership_id) WHERE membership_id IS NOT NULL;
CREATE UNIQUE INDEX boarding_one_success_per_ticket_uq
  ON boarding_events(ticket_id)
  WHERE event_type IN ('CHECK_IN'::"BoardingEventType", 'OVERRIDE'::"BoardingEventType");

CREATE OR REPLACE FUNCTION ticketty_validate_trip_seat_snapshot()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s record; t record;
BEGIN
  SELECT seat_layout_id, currency_id INTO t FROM trips
    WHERE id = NEW.trip_id AND organization_id = NEW.organization_id;
  SELECT seat_layout_id, seat_code, row_number, column_number, seat_type INTO s FROM seat_definitions
    WHERE id = NEW.seat_definition_id AND organization_id = NEW.organization_id;
  IF NOT FOUND OR s.seat_layout_id <> t.seat_layout_id OR NEW.currency_id <> t.currency_id
     OR NEW.seat_code <> s.seat_code OR NEW.row_number <> s.row_number
     OR NEW.column_number <> s.column_number OR NEW.seat_type <> s.seat_type THEN
    RAISE EXCEPTION 'TripSeat snapshot does not match Trip layout/currency and SeatDefinition' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trip_seats_snapshot_guard
BEFORE INSERT OR UPDATE OF trip_id, seat_definition_id, seat_code, row_number, column_number, seat_type, currency_id
ON trip_seats FOR EACH ROW EXECUTE FUNCTION ticketty_validate_trip_seat_snapshot();

CREATE OR REPLACE FUNCTION ticketty_validate_booking_item_trip()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM bookings b JOIN trip_seats ts ON ts.id = NEW.trip_seat_id
    WHERE b.id = NEW.booking_id AND b.organization_id = NEW.organization_id
      AND ts.organization_id = NEW.organization_id AND b.trip_id = ts.trip_id
  ) THEN RAISE EXCEPTION 'BookingItem seat does not belong to Booking trip' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER booking_items_trip_guard
BEFORE INSERT OR UPDATE OF booking_id, trip_seat_id ON booking_items
FOR EACH ROW EXECUTE FUNCTION ticketty_validate_booking_item_trip();

CREATE OR REPLACE FUNCTION ticketty_validate_ticket_snapshot()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE facts record; previous record;
BEGIN
  SELECT concat_ws(' ', p.first_name, p.last_name) AS passenger_name, p.phone,
         ts.seat_code, bi.fare, b.currency_id, t.scheduled_departure_at
    INTO facts
  FROM booking_items bi
  JOIN passengers p ON p.id = bi.passenger_id AND p.organization_id = bi.organization_id
  JOIN trip_seats ts ON ts.id = bi.trip_seat_id AND ts.organization_id = bi.organization_id
  JOIN bookings b ON b.id = bi.booking_id AND b.organization_id = bi.organization_id
  JOIN trips t ON t.id = b.trip_id AND t.organization_id = b.organization_id
  WHERE bi.id = NEW.booking_item_id AND bi.organization_id = NEW.organization_id;
  IF NOT FOUND OR NEW.passenger_name <> facts.passenger_name
     OR NEW.passenger_phone IS DISTINCT FROM facts.phone OR NEW.seat_code <> facts.seat_code
     OR NEW.fare <> facts.fare OR NEW.currency_id <> facts.currency_id
     OR NEW.scheduled_departure_at <> facts.scheduled_departure_at THEN
    RAISE EXCEPTION 'Ticket snapshot does not match issuance facts' USING ERRCODE='23514';
  END IF;
  IF NEW.supersedes_ticket_id IS NOT NULL THEN
    SELECT booking_item_id, document_version, status::text INTO previous
      FROM tickets WHERE id = NEW.supersedes_ticket_id AND organization_id = NEW.organization_id;
    IF NOT FOUND OR previous.booking_item_id <> NEW.booking_item_id
       OR NEW.document_version <> previous.document_version + 1
       OR previous.status NOT IN ('CANCELLED','REFUNDED','EXPIRED') THEN
      RAISE EXCEPTION 'invalid ticket reissue chain' USING ERRCODE='23514';
    END IF;
  ELSIF NEW.document_version <> 1 THEN
    RAISE EXCEPTION 'initial ticket document version must be 1' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER tickets_snapshot_guard
BEFORE INSERT ON tickets FOR EACH ROW EXECUTE FUNCTION ticketty_validate_ticket_snapshot();

CREATE OR REPLACE FUNCTION ticketty_validate_boarding_trip()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM tickets tk
    JOIN booking_items bi ON bi.id = tk.booking_item_id AND bi.organization_id = tk.organization_id
    JOIN bookings b ON b.id = bi.booking_id AND b.organization_id = bi.organization_id
    WHERE tk.id = NEW.ticket_id AND tk.organization_id = NEW.organization_id AND b.trip_id = NEW.trip_id
  ) THEN RAISE EXCEPTION 'BoardingEvent trip does not match Ticket trip' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER boarding_events_trip_guard
BEFORE INSERT OR UPDATE OF trip_id, ticket_id ON boarding_events
FOR EACH ROW EXECUTE FUNCTION ticketty_validate_boarding_trip();

CREATE OR REPLACE FUNCTION ticketty_validate_manifest_consistency()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE trip_branch uuid; previous record;
BEGIN
  SELECT branch_id INTO trip_branch FROM trips WHERE id=NEW.trip_id AND organization_id=NEW.organization_id;
  IF trip_branch IS NULL OR trip_branch <> NEW.branch_id THEN
    RAISE EXCEPTION 'Manifest branch does not match Trip branch' USING ERRCODE='23514';
  END IF;
  IF NEW.supersedes_manifest_id IS NOT NULL THEN
    SELECT trip_id, version, status::text INTO previous FROM manifests
      WHERE id=NEW.supersedes_manifest_id AND organization_id=NEW.organization_id;
    IF NOT FOUND OR previous.trip_id <> NEW.trip_id OR previous.status <> 'LOCKED'
       OR NEW.version <> previous.version + 1 THEN
      RAISE EXCEPTION 'invalid manifest correction chain' USING ERRCODE='23514';
    END IF;
  ELSIF NEW.version <> 1 THEN
    RAISE EXCEPTION 'initial manifest version must be 1' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER manifests_consistency_guard
BEFORE INSERT ON manifests FOR EACH ROW EXECUTE FUNCTION ticketty_validate_manifest_consistency();

CREATE OR REPLACE FUNCTION ticketty_validate_manifest_passenger()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM manifests m
    JOIN tickets tk ON tk.id=NEW.ticket_id AND tk.organization_id=m.organization_id
    JOIN booking_items bi ON bi.id=NEW.booking_item_id AND bi.id=tk.booking_item_id AND bi.organization_id=m.organization_id
    JOIN bookings b ON b.id=bi.booking_id AND b.organization_id=m.organization_id
    WHERE m.id=NEW.manifest_id AND m.organization_id=NEW.organization_id AND b.trip_id=m.trip_id
  ) THEN RAISE EXCEPTION 'ManifestPassenger references unrelated ticket/item/trip' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER manifest_passengers_consistency_guard
BEFORE INSERT OR UPDATE OF manifest_id, ticket_id, booking_item_id ON manifest_passengers
FOR EACH ROW EXECUTE FUNCTION ticketty_validate_manifest_passenger();

CREATE OR REPLACE FUNCTION ticketty_validate_financial_currency()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent_currency uuid; target_currency uuid;
BEGIN
  IF TG_TABLE_NAME = 'refunds' THEN
    SELECT currency_id INTO parent_currency FROM payments WHERE id=NEW.payment_id AND organization_id=NEW.organization_id;
    IF parent_currency IS NULL OR parent_currency <> NEW.currency_id THEN
      RAISE EXCEPTION 'Refund currency differs from Payment currency' USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME = 'agent_settlement_lines' THEN
    SELECT s.currency_id INTO parent_currency FROM agent_settlements s WHERE s.id=NEW.settlement_id AND s.organization_id=NEW.organization_id;
    IF NOT EXISTS (
      SELECT 1 FROM agent_settlements s JOIN agent_transactions t ON t.id=NEW.agent_transaction_id
      WHERE s.id=NEW.settlement_id AND s.organization_id=NEW.organization_id
        AND t.organization_id=s.organization_id AND t.agent_id=s.agent_id AND t.currency_id=s.currency_id
    ) THEN RAISE EXCEPTION 'Settlement line agent/currency mismatch' USING ERRCODE='23514'; END IF;
  ELSIF TG_TABLE_NAME = 'payment_allocations' THEN
    SELECT currency_id INTO parent_currency FROM payments WHERE id=NEW.payment_id AND organization_id=NEW.organization_id;
    IF NEW.booking_id IS NOT NULL THEN SELECT currency_id INTO target_currency FROM bookings WHERE id=NEW.booking_id AND organization_id=NEW.organization_id;
    ELSIF NEW.agent_settlement_id IS NOT NULL THEN SELECT currency_id INTO target_currency FROM agent_settlements WHERE id=NEW.agent_settlement_id AND organization_id=NEW.organization_id;
    ELSIF NEW.expense_id IS NOT NULL THEN SELECT currency_id INTO target_currency FROM expenses WHERE id=NEW.expense_id AND organization_id=NEW.organization_id;
    ELSE target_currency := parent_currency; END IF;
    IF parent_currency IS NULL OR target_currency IS NULL OR parent_currency <> target_currency THEN
      RAISE EXCEPTION 'Payment allocation currency mismatch' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER refunds_currency_guard BEFORE INSERT OR UPDATE OF payment_id, currency_id ON refunds
FOR EACH ROW EXECUTE FUNCTION ticketty_validate_financial_currency();
CREATE TRIGGER settlement_lines_consistency_guard BEFORE INSERT OR UPDATE ON agent_settlement_lines
FOR EACH ROW EXECUTE FUNCTION ticketty_validate_financial_currency();
CREATE TRIGGER payment_allocations_currency_guard BEFORE INSERT OR UPDATE ON payment_allocations
FOR EACH ROW EXECUTE FUNCTION ticketty_validate_financial_currency();

-- Deferred seat/hold coherence allows the command to update both rows in either
-- order while requiring a consistent final state at COMMIT.
CREATE OR REPLACE FUNCTION ticketty_check_seat_hold_coherence()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE seat_id uuid; seat_state text; seat_expiry timestamptz; active_count integer; active_expiry timestamptz;
BEGIN
  IF TG_TABLE_NAME='trip_seats' THEN
    seat_id := COALESCE(NEW.id,OLD.id);
  ELSE
    seat_id := COALESCE(NEW.trip_seat_id,OLD.trip_seat_id);
  END IF;
  SELECT status::text, hold_expires_at INTO seat_state, seat_expiry FROM trip_seats WHERE id=seat_id;
  SELECT count(*), max(expires_at) INTO active_count, active_expiry FROM seat_holds WHERE trip_seat_id=seat_id AND status::text='ACTIVE';
  IF (seat_state='HELD' AND (active_count<>1 OR seat_expiry IS DISTINCT FROM active_expiry))
     OR (seat_state<>'HELD' AND active_count<>0) THEN
    RAISE EXCEPTION 'TripSeat and active SeatHold are inconsistent' USING ERRCODE='23514';
  END IF;
  RETURN COALESCE(NEW,OLD);
END;
$$;
CREATE CONSTRAINT TRIGGER trip_seats_hold_coherence
AFTER INSERT OR UPDATE OR DELETE ON trip_seats DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION ticketty_check_seat_hold_coherence();
CREATE CONSTRAINT TRIGGER seat_holds_trip_seat_coherence
AFTER INSERT OR UPDATE OR DELETE ON seat_holds DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION ticketty_check_seat_hold_coherence();

-- ---------------------------------------------------------------------------
-- Aggregate checks and immutable records
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION ticketty_reject_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is append-only; % is not allowed', TG_TABLE_NAME, TG_OP
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER audit_logs_append_only
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION ticketty_reject_mutation();

CREATE TRIGGER agent_transactions_append_only
BEFORE UPDATE OR DELETE ON agent_transactions
FOR EACH ROW EXECUTE FUNCTION ticketty_reject_mutation();

CREATE OR REPLACE FUNCTION ticketty_manifest_immutable_when_locked()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE totals record;
BEGIN
  IF OLD.status::text = 'LOCKED' THEN
    RAISE EXCEPTION 'locked manifest cannot be modified or deleted' USING ERRCODE = '55000';
  END IF;
  IF TG_OP='UPDATE' AND NEW.status::text='LOCKED' THEN
    SELECT count(*)::int AS passenger_count, COALESCE(sum(fare),0) AS gross_sales,
           COALESCE(sum(commission),0) AS total_commission INTO totals
    FROM manifest_passengers WHERE manifest_id=NEW.id;
    IF NEW.passenger_count<>totals.passenger_count OR NEW.gross_sales<>totals.gross_sales
       OR NEW.total_commission<>totals.total_commission
       OR NEW.net_sales<>totals.gross_sales-totals.total_commission THEN
      RAISE EXCEPTION 'Manifest totals differ from snapshot rows' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;
CREATE TRIGGER manifests_locked_immutable
BEFORE UPDATE OR DELETE ON manifests
FOR EACH ROW EXECUTE FUNCTION ticketty_manifest_immutable_when_locked();

CREATE OR REPLACE FUNCTION ticketty_manifest_lines_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE manifest_status text;
BEGIN
  SELECT status::text INTO manifest_status
  FROM manifests WHERE id = COALESCE(NEW.manifest_id, OLD.manifest_id) FOR UPDATE;
  IF manifest_status = 'LOCKED' THEN
    RAISE EXCEPTION 'locked manifest snapshot cannot be modified' USING ERRCODE = '55000';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER manifest_passengers_locked_guard
BEFORE INSERT OR UPDATE OR DELETE ON manifest_passengers
FOR EACH ROW EXECUTE FUNCTION ticketty_manifest_lines_guard();

CREATE OR REPLACE FUNCTION ticketty_journal_line_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE entry_status text;
BEGIN
  SELECT status::text INTO entry_status
  FROM journal_entries WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id) FOR UPDATE;
  IF entry_status IN ('POSTED', 'REVERSED') THEN
    RAISE EXCEPTION 'lines of a posted/reversed journal entry are immutable' USING ERRCODE = '55000';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER journal_lines_posted_guard
BEFORE INSERT OR UPDATE OR DELETE ON journal_entry_lines
FOR EACH ROW EXECUTE FUNCTION ticketty_journal_line_guard();

CREATE OR REPLACE FUNCTION ticketty_settlement_line_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE settlement_status text;
BEGIN
  SELECT status::text INTO settlement_status FROM agent_settlements
    WHERE id=COALESCE(NEW.settlement_id,OLD.settlement_id) FOR UPDATE;
  IF settlement_status='POSTED' THEN
    RAISE EXCEPTION 'lines of a posted settlement are immutable' USING ERRCODE='55000';
  END IF;
  RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END;
$$;
CREATE TRIGGER agent_settlement_lines_posted_guard
BEFORE INSERT OR UPDATE OR DELETE ON agent_settlement_lines
FOR EACH ROW EXECUTE FUNCTION ticketty_settlement_line_guard();

CREATE OR REPLACE FUNCTION ticketty_journal_entry_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  debit_total numeric(19,4);
  credit_total numeric(19,4);
  bad_currency_count integer;
  period_row record;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status::text <> 'DRAFT' THEN
    RAISE EXCEPTION 'journal entry must be inserted as DRAFT and posted after lines exist' USING ERRCODE='23514';
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF OLD.status::text IN ('POSTED','REVERSED') THEN
      RAISE EXCEPTION 'posted/reversed journal entry cannot be deleted' USING ERRCODE='55000';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status::text = 'REVERSED' THEN
    RAISE EXCEPTION 'reversed journal entry is immutable' USING ERRCODE='55000';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status::text = 'POSTED' THEN
    IF NEW.status::text <> 'REVERSED'
       OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
       OR NEW.journal_id IS DISTINCT FROM OLD.journal_id
       OR NEW.fiscal_period_id IS DISTINCT FROM OLD.fiscal_period_id
       OR NEW.entry_number IS DISTINCT FROM OLD.entry_number
       OR NEW.entry_date IS DISTINCT FROM OLD.entry_date
       OR NEW.source_type IS DISTINCT FROM OLD.source_type
       OR NEW.source_id IS DISTINCT FROM OLD.source_id
       OR NEW.currency_id IS DISTINCT FROM OLD.currency_id
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NOT EXISTS (
         SELECT 1 FROM journal_entries r
         WHERE r.reversal_of_id=OLD.id AND r.organization_id=OLD.organization_id AND r.status::text='POSTED'
       ) THEN
      RAISE EXCEPTION 'posted journal may only transition to REVERSED after a posted reversal entry exists' USING ERRCODE='55000';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status::text = 'POSTED' AND OLD.status::text = 'DRAFT' THEN
    SELECT COALESCE(sum(debit),0), COALESCE(sum(credit),0),
           count(*) FILTER (WHERE currency_id <> NEW.currency_id)
      INTO debit_total, credit_total, bad_currency_count
    FROM journal_entry_lines WHERE journal_entry_id = NEW.id;
    IF debit_total <= 0 OR debit_total <> credit_total THEN
      RAISE EXCEPTION 'journal entry is not balanced: debit %, credit %', debit_total, credit_total USING ERRCODE='23514';
    END IF;
    IF bad_currency_count > 0 THEN
      RAISE EXCEPTION 'journal line currency differs from entry currency' USING ERRCODE='23514';
    END IF;
    SELECT status::text AS status, starts_at, ends_at INTO period_row
    FROM fiscal_periods WHERE id=NEW.fiscal_period_id AND organization_id=NEW.organization_id FOR UPDATE;
    IF period_row.status <> 'OPEN' OR NEW.entry_date < period_row.starts_at OR NEW.entry_date > period_row.ends_at THEN
      RAISE EXCEPTION 'journal entry date must be inside an open fiscal period' USING ERRCODE='23514';
    END IF;
    NEW.posted_at := COALESCE(NEW.posted_at, clock_timestamp());
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'illegal journal entry transition' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER journal_entries_posting_guard
BEFORE INSERT OR UPDATE OR DELETE ON journal_entries
FOR EACH ROW EXECUTE FUNCTION ticketty_journal_entry_guard();

CREATE OR REPLACE FUNCTION ticketty_has_posted_journal(p_org uuid, p_entry uuid, p_type text, p_source uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS(
    SELECT 1 FROM journal_entries
    WHERE organization_id=p_org AND id=p_entry AND status::text='POSTED'
      AND source_type=p_type AND source_id=p_source
  )
$$;

-- Completed provider facts are immutable. State changes must use a new attempt,
-- refund, reversal, or compensating accounting entry.
CREATE OR REPLACE FUNCTION ticketty_payment_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='INSERT' AND NEW.status::text <> 'PENDING' THEN
    RAISE EXCEPTION 'payment must be inserted as PENDING' USING ERRCODE='23514';
  END IF;
  IF TG_OP='DELETE' THEN
    IF OLD.status::text IN ('COMPLETED','PARTIALLY_REFUNDED','REFUNDED') THEN
      RAISE EXCEPTION 'completed payment cannot be deleted' USING ERRCODE='55000';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP='UPDATE' THEN
    IF OLD.status::text IN ('COMPLETED','PARTIALLY_REFUNDED','REFUNDED')
       AND (NEW.amount <> OLD.amount OR NEW.currency_id <> OLD.currency_id
            OR NEW.provider IS DISTINCT FROM OLD.provider
            OR NEW.external_reference IS DISTINCT FROM OLD.external_reference) THEN
      RAISE EXCEPTION 'completed payment facts are immutable' USING ERRCODE='55000';
    END IF;
    IF OLD.status IS DISTINCT FROM NEW.status AND NOT (
      (OLD.status::text='PENDING' AND NEW.status::text IN ('AUTHORIZED','COMPLETED','FAILED','CANCELLED')) OR
      (OLD.status::text='AUTHORIZED' AND NEW.status::text IN ('COMPLETED','FAILED','CANCELLED')) OR
      (OLD.status::text='COMPLETED' AND NEW.status::text IN ('PARTIALLY_REFUNDED','REFUNDED')) OR
      (OLD.status::text='PARTIALLY_REFUNDED' AND NEW.status::text IN ('PARTIALLY_REFUNDED','REFUNDED'))
    ) THEN RAISE EXCEPTION 'illegal payment transition: % -> %',OLD.status,NEW.status USING ERRCODE='23514'; END IF;
    IF NEW.status::text IN ('COMPLETED','PARTIALLY_REFUNDED','REFUNDED')
       AND NOT ticketty_has_posted_journal(NEW.organization_id,NEW.journal_entry_id,'PAYMENT',NEW.id) THEN
      RAISE EXCEPTION 'completed payment requires its posted PAYMENT journal entry' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER payments_guard
BEFORE INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION ticketty_payment_guard();

CREATE OR REPLACE FUNCTION ticketty_payment_allocation_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE payment_status text;
BEGIN
  SELECT status::text INTO payment_status FROM payments
    WHERE id=COALESCE(NEW.payment_id,OLD.payment_id) FOR UPDATE;
  IF payment_status IN ('COMPLETED','PARTIALLY_REFUNDED','REFUNDED') THEN
    RAISE EXCEPTION 'allocations of a completed payment are immutable' USING ERRCODE='55000';
  END IF;
  RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END;
$$;
CREATE TRIGGER payment_allocations_mutation_guard
BEFORE INSERT OR UPDATE OR DELETE ON payment_allocations
FOR EACH ROW EXECUTE FUNCTION ticketty_payment_allocation_guard();

CREATE OR REPLACE FUNCTION ticketty_refund_ceiling_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE captured numeric(19,4); refunded numeric(19,4);
BEGIN
  IF NEW.status::text = 'COMPLETED' AND (TG_OP = 'INSERT' OR OLD.status::text <> 'COMPLETED') THEN
    SELECT amount INTO captured FROM payments
      WHERE id = NEW.payment_id AND organization_id = NEW.organization_id FOR UPDATE;
    SELECT COALESCE(sum(amount),0) INTO refunded FROM refunds
      WHERE payment_id = NEW.payment_id AND status::text = 'COMPLETED' AND id <> NEW.id;
    IF captured IS NULL OR refunded + NEW.amount > captured THEN
      RAISE EXCEPTION 'completed refunds exceed captured payment' USING ERRCODE = '23514';
    END IF;
    IF NOT ticketty_has_posted_journal(NEW.organization_id,NEW.journal_entry_id,'REFUND',NEW.id) THEN
      RAISE EXCEPTION 'completed refund requires its posted REFUND journal entry' USING ERRCODE='23514';
    END IF;
  END IF;
  IF TG_OP <> 'INSERT' AND OLD.status::text = 'COMPLETED' THEN
    RAISE EXCEPTION 'completed refund is immutable' USING ERRCODE = '55000';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER refunds_ceiling_and_immutable
BEFORE INSERT OR UPDATE OR DELETE ON refunds
FOR EACH ROW EXECUTE FUNCTION ticketty_refund_ceiling_guard();

-- Deferred aggregate totals are checked after all rows in the transaction settle.
CREATE OR REPLACE FUNCTION ticketty_check_booking_totals()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_booking_id uuid; header record; item_totals record;
BEGIN
  IF TG_TABLE_NAME='bookings' THEN
    v_booking_id := COALESCE(NEW.id,OLD.id);
  ELSE
    v_booking_id := COALESCE(NEW.booking_id,OLD.booking_id);
  END IF;
  SELECT status::text, subtotal, discount, commission, tax, total INTO header FROM bookings WHERE id=v_booking_id;
  IF NOT FOUND THEN RETURN COALESCE(NEW,OLD); END IF;
  SELECT COALESCE(sum(fare),0) subtotal, COALESCE(sum(discount),0) discount,
         COALESCE(sum(commission),0) commission, COALESCE(sum(tax),0) tax, COALESCE(sum(total),0) total
    INTO item_totals FROM booking_items bi WHERE bi.booking_id=v_booking_id AND bi.status::text NOT IN ('CANCELLED','REFUNDED');
  IF header.status <> 'PENDING' AND (header.subtotal<>item_totals.subtotal OR header.discount<>item_totals.discount
     OR header.commission<>item_totals.commission OR header.tax<>item_totals.tax OR header.total<>item_totals.total) THEN
    RAISE EXCEPTION 'Booking header totals differ from active BookingItems' USING ERRCODE='23514';
  END IF;
  RETURN COALESCE(NEW,OLD);
END;
$$;
CREATE CONSTRAINT TRIGGER bookings_totals_guard AFTER INSERT OR UPDATE ON bookings
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ticketty_check_booking_totals();
CREATE CONSTRAINT TRIGGER booking_items_totals_guard AFTER INSERT OR UPDATE OR DELETE ON booking_items
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ticketty_check_booking_totals();

CREATE OR REPLACE FUNCTION ticketty_check_payment_allocation_totals()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE payment_id uuid; paid numeric(19,4); allocated numeric(19,4); target_total numeric(19,4); target_allocated numeric(19,4);
BEGIN
  payment_id := COALESCE(NEW.payment_id,OLD.payment_id);
  SELECT amount INTO paid FROM payments WHERE id=payment_id;
  SELECT COALESCE(sum(amount),0) INTO allocated FROM payment_allocations WHERE payment_id=payment_id;
  IF allocated>paid THEN RAISE EXCEPTION 'Payment allocations exceed payment amount' USING ERRCODE='23514'; END IF;
  IF COALESCE(NEW.booking_id,OLD.booking_id) IS NOT NULL THEN
    SELECT total INTO target_total FROM bookings WHERE id=COALESCE(NEW.booking_id,OLD.booking_id);
    SELECT COALESCE(sum(pa.amount),0) INTO target_allocated FROM payment_allocations pa JOIN payments p ON p.id=pa.payment_id
      WHERE pa.booking_id=COALESCE(NEW.booking_id,OLD.booking_id) AND p.status::text IN ('COMPLETED','PARTIALLY_REFUNDED','REFUNDED');
  ELSIF COALESCE(NEW.agent_settlement_id,OLD.agent_settlement_id) IS NOT NULL THEN
    SELECT net_amount INTO target_total FROM agent_settlements WHERE id=COALESCE(NEW.agent_settlement_id,OLD.agent_settlement_id);
    SELECT COALESCE(sum(pa.amount),0) INTO target_allocated FROM payment_allocations pa JOIN payments p ON p.id=pa.payment_id
      WHERE pa.agent_settlement_id=COALESCE(NEW.agent_settlement_id,OLD.agent_settlement_id) AND p.status::text IN ('COMPLETED','PARTIALLY_REFUNDED','REFUNDED');
  ELSIF COALESCE(NEW.expense_id,OLD.expense_id) IS NOT NULL THEN
    SELECT total INTO target_total FROM expenses WHERE id=COALESCE(NEW.expense_id,OLD.expense_id);
    SELECT COALESCE(sum(pa.amount),0) INTO target_allocated FROM payment_allocations pa JOIN payments p ON p.id=pa.payment_id
      WHERE pa.expense_id=COALESCE(NEW.expense_id,OLD.expense_id) AND p.status::text IN ('COMPLETED','PARTIALLY_REFUNDED','REFUNDED');
  END IF;
  IF target_total IS NOT NULL AND target_allocated>target_total THEN
    RAISE EXCEPTION 'Completed allocations exceed target total' USING ERRCODE='23514';
  END IF;
  RETURN COALESCE(NEW,OLD);
END;
$$;
CREATE CONSTRAINT TRIGGER payment_allocations_totals_guard AFTER INSERT OR UPDATE OR DELETE ON payment_allocations
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ticketty_check_payment_allocation_totals();

CREATE OR REPLACE FUNCTION ticketty_workflow_state_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' AND OLD.status::text IN ('POSTED','CLOSED') THEN
    RAISE EXCEPTION '% final record is immutable',TG_TABLE_NAME USING ERRCODE='55000';
  ELSIF TG_OP='DELETE' THEN RETURN OLD; END IF;
  IF OLD.status=NEW.status THEN
    IF OLD.status::text IN ('POSTED','CLOSED') THEN RAISE EXCEPTION '% final record is immutable',TG_TABLE_NAME USING ERRCODE='55000'; END IF;
    RETURN NEW;
  END IF;
  IF TG_TABLE_NAME='agent_settlements' AND NOT (
    (OLD.status::text='DRAFT' AND NEW.status::text IN ('APPROVED','CANCELLED')) OR
    (OLD.status::text='APPROVED' AND NEW.status::text IN ('POSTED','CANCELLED'))
  ) THEN RAISE EXCEPTION 'illegal settlement transition' USING ERRCODE='23514';
  ELSIF TG_TABLE_NAME='expenses' AND NOT (
    (OLD.status::text='DRAFT' AND NEW.status::text IN ('SUBMITTED','CANCELLED')) OR
    (OLD.status::text='SUBMITTED' AND NEW.status::text IN ('APPROVED','REJECTED','CANCELLED')) OR
    (OLD.status::text='REJECTED' AND NEW.status::text IN ('DRAFT','CANCELLED')) OR
    (OLD.status::text='APPROVED' AND NEW.status::text IN ('POSTED','CANCELLED'))
  ) THEN RAISE EXCEPTION 'illegal expense transition' USING ERRCODE='23514';
  ELSIF TG_TABLE_NAME='fiscal_periods' AND NOT (
    (OLD.status::text='OPEN' AND NEW.status::text='CLOSING') OR
    (OLD.status::text='CLOSING' AND NEW.status::text IN ('OPEN','CLOSED'))
  ) THEN RAISE EXCEPTION 'illegal fiscal period transition' USING ERRCODE='23514';
  ELSIF TG_TABLE_NAME='adjustments' AND NOT (
    (OLD.status::text='DRAFT' AND NEW.status::text IN ('APPROVED','REJECTED','CANCELLED')) OR
    (OLD.status::text='APPROVED' AND NEW.status::text IN ('POSTED','CANCELLED'))
  ) THEN RAISE EXCEPTION 'illegal adjustment transition' USING ERRCODE='23514';
  END IF;
  IF TG_TABLE_NAME='agent_settlements' AND NEW.status::text='CANCELLED'
     AND EXISTS (SELECT 1 FROM agent_settlement_lines WHERE settlement_id=NEW.id) THEN
    RAISE EXCEPTION 'cancelled draft settlement must release/delete its lines first' USING ERRCODE='23514';
  END IF;
  IF NEW.status::text='POSTED' THEN
    IF TG_TABLE_NAME='agent_settlements' AND (
      NOT ticketty_has_posted_journal(NEW.organization_id,NEW.journal_entry_id,'AGENT_SETTLEMENT',NEW.id)
      OR NEW.net_amount IS DISTINCT FROM (SELECT COALESCE(sum(amount),0) FROM agent_settlement_lines WHERE settlement_id=NEW.id)
    ) THEN
      RAISE EXCEPTION 'posted settlement requires matching lines and its posted journal entry' USING ERRCODE='23514';
    ELSIF TG_TABLE_NAME='expenses' AND NOT ticketty_has_posted_journal(NEW.organization_id,NEW.journal_entry_id,'EXPENSE',NEW.id) THEN
      RAISE EXCEPTION 'posted expense requires its posted journal entry' USING ERRCODE='23514';
    ELSIF TG_TABLE_NAME='adjustments' AND NOT ticketty_has_posted_journal(NEW.organization_id,NEW.journal_entry_id,'ADJUSTMENT',NEW.id) THEN
      RAISE EXCEPTION 'posted adjustment requires its posted journal entry' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER agent_settlements_state_guard BEFORE UPDATE OR DELETE ON agent_settlements FOR EACH ROW EXECUTE FUNCTION ticketty_workflow_state_guard();
CREATE TRIGGER expenses_state_guard BEFORE UPDATE OR DELETE ON expenses FOR EACH ROW EXECUTE FUNCTION ticketty_workflow_state_guard();
CREATE TRIGGER fiscal_periods_state_guard BEFORE UPDATE OR DELETE ON fiscal_periods FOR EACH ROW EXECUTE FUNCTION ticketty_workflow_state_guard();
CREATE TRIGGER adjustments_state_guard BEFORE UPDATE OR DELETE ON adjustments FOR EACH ROW EXECUTE FUNCTION ticketty_workflow_state_guard();

-- State transitions are intentionally enforced twice: domain services and DB.
CREATE OR REPLACE FUNCTION ticketty_trip_transition_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NOT (
    (OLD.status::text = 'DRAFT' AND NEW.status::text IN ('SCHEDULED','CANCELLED')) OR
    (OLD.status::text = 'SCHEDULED' AND NEW.status::text IN ('BOARDING','CANCELLED')) OR
    (OLD.status::text = 'BOARDING' AND NEW.status::text IN ('DEPARTED','CANCELLED')) OR
    (OLD.status::text = 'DEPARTED' AND NEW.status::text = 'COMPLETED')
  ) THEN RAISE EXCEPTION 'illegal trip transition: % -> %', OLD.status, NEW.status USING ERRCODE='23514'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trips_transition_guard BEFORE UPDATE OF status ON trips
FOR EACH ROW EXECUTE FUNCTION ticketty_trip_transition_guard();

CREATE OR REPLACE FUNCTION ticketty_inventory_transition_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status=NEW.status THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME='trip_seats' AND NOT (
    (OLD.status::text='AVAILABLE' AND NEW.status::text IN ('HELD','BLOCKED')) OR
    (OLD.status::text='HELD' AND NEW.status::text IN ('AVAILABLE','SOLD')) OR
    (OLD.status::text='SOLD' AND NEW.status::text='AVAILABLE') OR
    (OLD.status::text='BLOCKED' AND NEW.status::text='AVAILABLE' AND OLD.seat_type::text NOT IN ('CREW','BLOCKED'))
  ) THEN RAISE EXCEPTION 'illegal TripSeat transition' USING ERRCODE='23514';
  ELSIF TG_TABLE_NAME='seat_holds' AND NOT (
    OLD.status::text='ACTIVE' AND NEW.status::text IN ('CONVERTED','EXPIRED','RELEASED')
  ) THEN RAISE EXCEPTION 'illegal SeatHold transition' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trip_seats_transition_guard BEFORE UPDATE OF status ON trip_seats
FOR EACH ROW EXECUTE FUNCTION ticketty_inventory_transition_guard();
CREATE TRIGGER seat_holds_transition_guard BEFORE UPDATE OF status ON seat_holds
FOR EACH ROW EXECUTE FUNCTION ticketty_inventory_transition_guard();

CREATE OR REPLACE FUNCTION ticketty_ticket_transition_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.booking_item_id IS DISTINCT FROM OLD.booking_item_id
     OR NEW.ticket_number IS DISTINCT FROM OLD.ticket_number
     OR NEW.qr_identifier IS DISTINCT FROM OLD.qr_identifier
     OR NEW.qr_version IS DISTINCT FROM OLD.qr_version
     OR NEW.document_version IS DISTINCT FROM OLD.document_version
     OR NEW.supersedes_ticket_id IS DISTINCT FROM OLD.supersedes_ticket_id
     OR NEW.passenger_name IS DISTINCT FROM OLD.passenger_name
     OR NEW.passenger_phone IS DISTINCT FROM OLD.passenger_phone
     OR NEW.seat_code IS DISTINCT FROM OLD.seat_code
     OR NEW.route_display IS DISTINCT FROM OLD.route_display
     OR NEW.scheduled_departure_at IS DISTINCT FROM OLD.scheduled_departure_at
     OR NEW.fare IS DISTINCT FROM OLD.fare
     OR NEW.currency_id IS DISTINCT FROM OLD.currency_id THEN
    RAISE EXCEPTION 'issued ticket document snapshot is immutable' USING ERRCODE='55000';
  END IF;
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NOT (
    (OLD.status::text = 'ISSUED' AND NEW.status::text IN ('CHECKED_IN','CANCELLED','REFUNDED','EXPIRED')) OR
    (OLD.status::text = 'CHECKED_IN' AND NEW.status::text IN ('USED','CANCELLED'))
  ) THEN RAISE EXCEPTION 'illegal ticket transition: % -> %', OLD.status, NEW.status USING ERRCODE='23514'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER tickets_transition_guard BEFORE UPDATE OF status ON tickets
FOR EACH ROW EXECUTE FUNCTION ticketty_ticket_transition_guard();

CREATE OR REPLACE FUNCTION ticketty_ticket_event_required()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NOT EXISTS (
    SELECT 1 FROM ticket_events e WHERE e.ticket_id=NEW.id AND e.organization_id=NEW.organization_id
      AND e.from_status=OLD.status AND e.to_status=NEW.status
  ) THEN RAISE EXCEPTION 'Ticket transition requires matching TicketEvent' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END;
$$;
CREATE CONSTRAINT TRIGGER tickets_event_guard AFTER UPDATE OF status ON tickets
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ticketty_ticket_event_required();

CREATE OR REPLACE FUNCTION ticketty_booking_transition_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NOT (
    (OLD.status::text = 'PENDING' AND NEW.status::text IN ('CONFIRMED','CANCELLED','EXPIRED')) OR
    (OLD.status::text = 'CONFIRMED' AND NEW.status::text IN ('PARTIALLY_CANCELLED','CANCELLED','COMPLETED')) OR
    (OLD.status::text = 'PARTIALLY_CANCELLED' AND NEW.status::text IN ('CANCELLED','COMPLETED'))
  ) THEN RAISE EXCEPTION 'illegal booking transition: % -> %', OLD.status, NEW.status USING ERRCODE='23514'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER bookings_transition_guard BEFORE UPDATE OF status ON bookings
FOR EACH ROW EXECUTE FUNCTION ticketty_booking_transition_guard();
