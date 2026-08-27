#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 2
fi

backup_dir="${BACKUP_DIR:-$(pwd)/backups}"
mkdir -p "$backup_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
final_file="$backup_dir/ticketty-$timestamp.dump"
tmp_file="$final_file.tmp"

cleanup() {
  rm -f "$tmp_file"
}
trap cleanup EXIT

pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file "$tmp_file"

mv "$tmp_file" "$final_file"
sha256sum "$final_file" > "$final_file.sha256"
trap - EXIT

printf 'Backup created: %s\nChecksum: %s\n' "$final_file" "$final_file.sha256"
