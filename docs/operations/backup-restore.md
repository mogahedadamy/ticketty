# PostgreSQL Backup and Restore

## Backup

Use a PostgreSQL client compatible with the server major version:

```bash
DATABASE_URL='postgresql://...' ./ops/backup-postgres.sh
```

The script creates a custom-format dump atomically and writes a SHA-256 checksum under `backups/` (or `BACKUP_DIR`). Upload both files to encrypted off-site storage. A local Docker volume or local dump alone is not a disaster-recovery backup.

Recommended initial policy: daily backups, retention aligned with the data-retention policy, and monitored upload failures.

## Scratch restore drill

Create an empty, isolated database that is never the production database:

```bash
RESTORE_DATABASE_URL='postgresql://.../ticketty_restore' \
  ./ops/restore-postgres.sh backups/ticketty-YYYYMMDDTHHMMSSZ.dump
```

Then, from `backend/`, deliberately apply migrations if restoring into a newer application release:

```bash
DATABASE_URL="$RESTORE_DATABASE_URL" pnpm exec prisma migrate deploy
DATABASE_URL="$RESTORE_DATABASE_URL" pnpm test:db:refund-integrity
DATABASE_URL="$RESTORE_DATABASE_URL" pnpm test:db:tenant-consistency
DATABASE_URL="$RESTORE_DATABASE_URL" pnpm test:db:settlement-integrity
```

Record start/end time, backup timestamp, achieved RPO/RTO, row-count sanity checks, migration result, and operator approval. Run this drill at least quarterly.

## Safety

- The restore script refuses the current `DATABASE_URL` unless `ALLOW_IN_PLACE_RESTORE=yes` is explicitly set.
- Never use `--clean` against a live database.
- Pause writes and follow an incident-specific plan for any in-place disaster restore.
- Custom dumps do not include cluster roles/globals; provision the application role separately.
- A valid checksum is not proof of restorability; only a completed scratch restore is.
