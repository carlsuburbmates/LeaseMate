# LeaseMate Local-First Status Plan

## Current Status

As of 2026-06-13, LeaseMate is no longer in the earlier "Manus-coupled and largely unusable locally" state.

The project now supports a practical local workflow:

- The app builds and typechecks locally.
- Stripe no longer crashes server startup when keys are missing.
- Authentication has a local-first mode using `/login` and database-backed users.
- Owner notifications no longer hard-fail when Manus Forge is absent.
- The deleted Forge-only AI and maps scaffolding is no longer a migration blocker.
- Background jobs in `server/lib/qstash.ts` now have a local in-process implementation, optional QStash-backed delayed delivery, and write to `automation_tasks`.

## What Works Locally Now

### Core development
- `pnpm install`
- `pnpm check`
- `pnpm build`
- `pnpm test`

### Authentication
- Set `AUTH_MODE=local`
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

## Remaining Cleanup Work

### High priority
1. Stand up a dedicated local or CI test database if you want DB-backed tests to run automatically instead of behind `RUN_DB_TESTS=1`.
2. Configure `QSTASH_TOKEN`, signing keys, and `CRON_SECRET` in the deployment environment if you want durable background execution in production.
3. Remove the non-git export folder if you want one canonical working copy only.

### Medium priority
1. Add seed data and demo accounts that better match the intended operator, provider, and customer flows.
2. Decide whether to keep Manus auth support as a fallback mode long-term or delete it entirely once no longer needed.

## Recommended Local Workflow

1. Work in the git-backed repository: [`/Users/carlg/Documents/AI-Coding/Local-leasemate`](/Users/carlg/Documents/AI-Coding/Local-leasemate)
2. Use the export folder only as a reference snapshot from Manus:
   [`/Users/carlg/Documents/AI-Coding/leasemate`](/Users/carlg/Documents/AI-Coding/leasemate)
3. Keep `AUTH_MODE=local` unless there is a specific reason to test Manus auth.
4. Treat live Resend and DB-backed tests as explicit integration checks, not default unit-test expectations.
