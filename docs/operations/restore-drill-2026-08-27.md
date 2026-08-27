# Restore Drill — 2026-08-27

## Scope

A logical backup of the local migrated Ticketty PostgreSQL database was restored into a newly created isolated database named `ticketty_restore_drill`. No production system or external environment was involved.

## Environment

- PostgreSQL client: 16.15
- Source schema: 18 applied Prisma migrations
- Backup format: PostgreSQL custom format
- Integrity: SHA-256 sidecar verified before restore
- Restore mode: `--single-transaction --exit-on-error --no-owner --no-acl`

## Results

- Backup completed successfully.
- Checksum verification passed.
- Restore into the empty scratch database completed successfully.
- Prisma migration status reported all 18 migrations applied.
- Refund-integrity SQL contract passed.
- Tenant-consistency SQL contract passed.
- Settlement-integrity SQL contract passed.
- Sanity check found one organization and 18 completed migration records.
- Scratch database and temporary local backup were deleted after verification.
- End-to-end drill duration: approximately 8 seconds on the local development host.

## Interpretation

This proves that the checked-in scripts can create and restore a logical backup in the current development environment. It does not prove production RPO/RTO, off-site upload, encryption-at-rest, large-dataset performance, or infrastructure-level disaster recovery. Those must be measured in staging with production-like data volume and topology.
