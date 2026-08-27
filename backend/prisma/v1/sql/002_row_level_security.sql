-- Ticketty Database Contract v1.0 — PostgreSQL Row-Level Security
-- Runtime rule: every request/worker transaction must execute:
--   SELECT set_config('app.organization_id', '<tenant-uuid>', true);
-- The third argument MUST be true (transaction-local). Use a non-owner,
-- non-superuser runtime role. Platform operations use a separate audited role.

CREATE SCHEMA IF NOT EXISTS ticketty_security;

CREATE OR REPLACE FUNCTION ticketty_security.current_organization_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
AS $$
BEGIN
  RETURN NULLIF(current_setting('app.organization_id', true), '')::uuid;
EXCEPTION WHEN invalid_text_representation THEN
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION ticketty_security.current_organization_id() FROM PUBLIC;

-- Organization itself is scoped by its primary key.
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
CREATE POLICY organizations_tenant_isolation ON organizations
  USING (id = ticketty_security.current_organization_id())
  WITH CHECK (id = ticketty_security.current_organization_id());

-- Every listed table owns or snapshots organization_id. RLS is deliberately
-- deny-by-default when app.organization_id is absent or invalid.
DO $$
DECLARE
  table_name text;
  tenant_tables text[] := ARRAY[
    'branches',
    'organization_memberships',
    'membership_branches',
    'roles',
    'role_permissions',
    'membership_roles',
    'stations',
    'routes',
    'route_stops',
    'seat_layouts',
    'seat_definitions',
    'bus_models',
    'buses',
    'drivers',
    'file_assets',
    'driver_documents',
    'trips',
    'trip_seats',
    'seat_holds',
    'customers',
    'passengers',
    'bookings',
    'booking_items',
    'tickets',
    'ticket_events',
    'devices',
    'boarding_events',
    'manifests',
    'manifest_passengers',
    'agents',
    'commission_rules',
    'agent_transactions',
    'agent_settlements',
    'agent_settlement_lines',
    'payments',
    'payment_allocations',
    'refunds',
    'payment_provider_events',
    'vendors',
    'expenses',
    'accounts',
    'fiscal_periods',
    'journals',
    'journal_entries',
    'journal_entry_lines',
    'adjustments',
    'audit_logs',
    'idempotency_keys',
    'outbox_events',
    'number_sequences'
  ];
BEGIN
  FOREACH table_name IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (organization_id = ticketty_security.current_organization_id()) WITH CHECK (organization_id = ticketty_security.current_organization_id())',
      table_name || '_tenant_isolation', table_name
    );
  END LOOP;
END $$;

-- Global catalogs intentionally excluded from tenant RLS:
--   currencies, users, permissions
-- Access to these tables must be narrowly granted. User lookup is needed only
-- for authentication; tenant business queries must start from Membership.

-- Optional grants are deployment-specific. Example only:
--   GRANT USAGE ON SCHEMA public, ticketty_security TO ticketty_app;
--   GRANT EXECUTE ON FUNCTION ticketty_security.current_organization_id() TO ticketty_app;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ticketty_app;
-- Never grant BYPASSRLS, SUPERUSER, or table ownership to ticketty_app.
