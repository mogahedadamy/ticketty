#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$ROOT_DIR"

for command in node pnpm psql; do
  command -v "$command" >/dev/null || { echo "Missing required command: $command" >&2; exit 1; }
done

pnpm exec prisma validate --schema prisma/v1/schema.prisma

BASE_SQL=$(mktemp /tmp/ticketty-v1-base.XXXXXX.sql)
DB_NAME="ticketty_contract_v1_${$}"
RLS_ROLE="ticketty_contract_rls_${$}"
DB_URL=$(node -e "require('dotenv').config({quiet:true}); process.stdout.write(process.env.DATABASE_URL || '')")
if [[ -z "$DB_URL" ]]; then
  echo "DATABASE_URL is required in backend/.env" >&2
  exit 1
fi

ADMIN_URL=$(DATABASE_URL="$DB_URL" node -e "const u=new URL(process.env.DATABASE_URL); u.pathname='/postgres'; u.searchParams.delete('schema'); process.stdout.write(u.toString())")
TEST_URL=$(DATABASE_URL="$DB_URL" DB_NAME="$DB_NAME" node -e "const u=new URL(process.env.DATABASE_URL); u.pathname='/' + process.env.DB_NAME; u.searchParams.delete('schema'); process.stdout.write(u.toString())")

cleanup() {
  psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${DB_NAME}" >/dev/null 2>&1 || true
  psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "DROP ROLE IF EXISTS ${RLS_ROLE}" >/dev/null 2>&1 || true
  rm -f "$BASE_SQL"
}
trap cleanup EXIT

pnpm exec prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/v1/schema.prisma \
  --script > "$BASE_SQL"

psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "CREATE ROLE ${RLS_ROLE} NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS" >/dev/null
psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${DB_NAME}" >/dev/null
psql "$TEST_URL" -v ON_ERROR_STOP=1 \
  -f "$BASE_SQL" \
  -f prisma/v1/sql/001_contract_constraints.sql \
  -f prisma/v1/sql/002_row_level_security.sql \
  -f prisma/v1/tests/contract-smoke.sql
psql "$TEST_URL" -v ON_ERROR_STOP=1 -v runtime_role="$RLS_ROLE" \
  -f prisma/v1/tests/rls-smoke.sql

echo "Ticketty Database Contract v1.0 validation passed."
