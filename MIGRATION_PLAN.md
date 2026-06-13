# LeaseMate Local-First Status Plan

## Current Status

As of 2026-06-14, LeaseMate runs without Manus OAuth or Manus Forge in the active runtime.

The project now supports a practical local workflow:

- The app builds and typechecks locally.
- Authentication uses `/login` and database-backed users only.
- Owner notifications use Resend when configured and otherwise fail soft.
- Background jobs in `server/lib/qstash.ts` now have a local in-process implementation, optional QStash-backed delayed delivery, and write to `automation_tasks`.
- Storage supports a proper S3-compatible remote backend for launch-like deployments and falls back to local `./uploads`.

## What Works Locally Now

### Core development
- `pnpm install`
- `pnpm check`
- `pnpm build`
- `pnpm test`

### Authentication
- Start the app
- Sign in at `/login`
- Create or reuse users directly from the local database

### Background automation
- Payment deadline checks
- Provider timeout checks
- Critical exception notifications
- Customer detail release tasks
- Stale draft cleanup

These run locally while the server process is alive. In production, delayed invitation jobs can publish through QStash and stale-request cleanup is exposed for Vercel Cron.

## Remaining Real Dependencies

These are the only meaningful external requirements left:

1. **Database**
   - Required for almost all non-trivial app flows
   - Env var: `DATABASE_URL`

2. **Stripe**
   - Optional for general app startup
   - Required for live introduction-fee checkout and webhook flows
   - Env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

3. **Resend**
   - Optional
   - Enables transactional email and fallback owner alerts
   - Env vars: `RESEND_API_KEY`, `OWNER_EMAIL`

4. **Object Storage**
   - Recommended for launch-like file handling
   - Supports S3-compatible providers such as Cloudflare R2 or AWS S3
   - Env vars: `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`

5. **QStash**
   - Recommended for durable delayed jobs in production
   - Local development uses in-process timers instead
   - Env vars: `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, `CRON_SECRET`

## Remaining Cleanup Work

### High priority
1. Stand up a dedicated local or CI test database if you want DB-backed tests to run automatically instead of behind `RUN_DB_TESTS=1`.
2. Configure `QSTASH_TOKEN`, signing keys, and `CRON_SECRET` in the deployment environment if you want durable background execution in production.
3. Configure S3-compatible object storage in deployment if you want uploads to behave like launch.

### Medium priority
1. Add seed data and demo accounts that better match the intended operator, provider, and customer flows.
2. Keep one canonical working copy and archive stale exports to reduce docs drift.

## Recommended Local Workflow

1. Install dependencies, configure `.env`, and seed the database.
2. Start the app and sign in at `/login` with a seeded or newly created local user.
3. Treat live Resend, Stripe, and QStash checks as explicit integration tests, not default unit-test expectations.
4. Use S3-compatible storage in deployment if you want file behavior to match launch.
