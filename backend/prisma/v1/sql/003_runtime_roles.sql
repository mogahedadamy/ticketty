-- Ticketty Database Contract v1.0 — database role separation
-- NOLOGIN group roles; deployment creates login roles and grants membership.
-- Run as migration owner after schema, constraints and RLS.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='ticketty_app') THEN
    CREATE ROLE ticketty_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='ticketty_auth') THEN
    CREATE ROLE ticketty_auth NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='ticketty_outbox_worker') THEN
    CREATE ROLE ticketty_outbox_worker NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT BYPASSRLS;
  END IF;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ticketty_app, ticketty_auth, ticketty_outbox_worker;
REVOKE ALL ON SCHEMA public FROM ticketty_app, ticketty_auth, ticketty_outbox_worker;

GRANT USAGE ON SCHEMA public, ticketty_security TO ticketty_app;
GRANT EXECUTE ON FUNCTION ticketty_security.current_organization_id() TO ticketty_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ticketty_app;
-- Password hashes remain inaccessible to the ordinary tenant application role.
REVOKE ALL ON users FROM ticketty_app;
GRANT SELECT (id, email, phone, status, last_login_at, created_at, updated_at) ON users TO ticketty_app;

-- Authentication role is intentionally narrow and does not have business-table access.
GRANT USAGE ON SCHEMA public TO ticketty_auth;
GRANT SELECT (id, email, phone, password_hash, status, last_login_at) ON users TO ticketty_auth;
GRANT UPDATE (last_login_at, updated_at) ON users TO ticketty_auth;

-- Global outbox worker is the only runtime BYPASSRLS role. It can touch only
-- outbox rows; consumers must establish a tenant-scoped ticketty_app transaction
-- before reading or mutating aggregate data.
GRANT USAGE ON SCHEMA public TO ticketty_outbox_worker;
GRANT SELECT, UPDATE ON outbox_events TO ticketty_outbox_worker;

-- Example deployment (do not hard-code passwords in migrations):
-- CREATE ROLE ticketty_api_login LOGIN PASSWORD 'from-secret-manager';
-- GRANT ticketty_app TO ticketty_api_login;
-- CREATE ROLE ticketty_outbox_login LOGIN PASSWORD 'from-secret-manager';
-- GRANT ticketty_outbox_worker TO ticketty_outbox_login;
