-- Requires psql variable :runtime_role naming an ephemeral NOLOGIN role.
\set ON_ERROR_STOP on

INSERT INTO currencies(id, code, name, "minorUnits", active)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab', 'TST', 'Test Currency', 2, true);
SELECT set_config('app.organization_id', '51111111-1111-4111-8111-111111111111', false);
INSERT INTO organizations(id, code, legal_name, display_name, status, default_currency_id, timezone, updated_at)
VALUES ('51111111-1111-4111-8111-111111111111', 'RLS-A', 'RLS A', 'RLS A', 'ACTIVE',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab', 'Africa/Khartoum', now());
INSERT INTO branches(id, organization_id, code, name, timezone, updated_at)
VALUES ('5bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '51111111-1111-4111-8111-111111111111',
        'A', 'Tenant A Branch', 'Africa/Khartoum', now());

GRANT USAGE ON SCHEMA public, ticketty_security TO :"runtime_role";
GRANT EXECUTE ON FUNCTION ticketty_security.current_organization_id() TO :"runtime_role";
GRANT SELECT ON organizations TO :"runtime_role";
GRANT SELECT, INSERT ON branches TO :"runtime_role";

SET ROLE :"runtime_role";

BEGIN;
SELECT set_config('app.organization_id', '51111111-1111-4111-8111-111111111111', true);
DO $$ DECLARE n integer; BEGIN SELECT count(*) INTO n FROM branches; IF n<>1 THEN RAISE EXCEPTION 'tenant A expected 1 branch, saw %',n; END IF; END $$;
ROLLBACK;

BEGIN;
SELECT set_config('app.organization_id', '52222222-2222-4222-8222-222222222222', true);
DO $$ DECLARE n integer; BEGIN
  SELECT count(*) INTO n FROM branches;
  IF n<>0 THEN RAISE EXCEPTION 'tenant B escaped isolation, saw % rows',n; END IF;
  BEGIN
    INSERT INTO branches(id,organization_id,code,name,timezone,updated_at)
    VALUES ('5bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc','51111111-1111-4111-8111-111111111111','ESCAPE','Escape','UTC',now());
    RAISE EXCEPTION 'expected RLS write rejection';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
ROLLBACK;

BEGIN;
SELECT set_config('app.organization_id', 'malformed-tenant', true);
DO $$ DECLARE n integer; BEGIN SELECT count(*) INTO n FROM branches; IF n<>0 THEN RAISE EXCEPTION 'malformed context must deny all rows, saw %',n; END IF; END $$;
ROLLBACK;

RESET ROLE;
\echo 'Ticketty RLS smoke tests passed.'
