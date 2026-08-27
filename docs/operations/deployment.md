# Deployment Runbook

## Scope

The included Compose stack is a reproducible single-host baseline, not a high-availability architecture. Terminate TLS at a trusted reverse proxy and expose only the web service publicly.

## Prerequisites

- Docker Engine with Compose v2.
- DNS/TLS and an external secret-management process.
- A reviewed release commit/tag.

## Prepare configuration

```bash
cp .env.production.example .env
openssl rand -base64 48
```

Put the generated value in `JWT_SECRET`, replace the database password, and set the canonical HTTPS `WEB_ORIGIN`. Never commit `.env`.

Changing JWT issuer, audience, or secret invalidates existing sessions and requires a coordinated forced login.

## Build and deploy

```bash
docker compose config
docker compose build --pull
docker compose run --rm migrate
docker compose up -d
docker compose ps
```

Migrations run as a one-shot release task. Never run demo seed commands in production and do not run migrations independently in every backend replica.

## Smoke checks

```bash
curl -fsS http://127.0.0.1:3001/api/health/liveness
curl -fsS http://127.0.0.1:3001/api/health/readiness
curl -fsS http://127.0.0.1:3000/api/health/live
curl -fsS http://127.0.0.1:3000/api/health/ready
```

Readiness must succeed before routing traffic. Monitor application logs during the first operational transaction.

## Rollback

1. Stop traffic to the affected release.
2. Preserve logs and take a database backup.
3. Redeploy the previous immutable image/tag.
4. Database migrations are forward-only by default. Do not attempt destructive rollback without a reviewed migration-specific recovery plan.
5. Run all smoke checks, then restore traffic gradually.

## Release gates

- CI is green, including PostgreSQL E2E and SQL integrity contracts.
- No unaccepted High/Critical dependency advisory.
- Backup and scratch restore have been tested for the release window.
- Migration impact and rollback strategy are reviewed.
- Metrics, alerts, and operator ownership are configured in the target environment.
