# LeaseMate Local-First Status Plan

## Current Status

As of 2026-06-13, LeaseMate is no longer in the earlier "Manus-coupled and largely unusable locally" state.

The project now supports a practical local workflow:

- The app builds and typechecks locally.
- Stripe no longer crashes server startup when keys are missing.
- Authentication has a local-first mode using `/login` and database-backed users.
- Owner notifications no longer hard-fail when Manus Forge is absent.
- The deleted Forge-only AI and maps scaffolding is no longer a migration blocker.
- Background jobs in `server/lib/qstash.ts` now have a local in-process implementation and write to `automation_tasks`.

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

These run locally while the server process is alive. They are suitable for development and audit work. They are not yet a durable production scheduler replacement.

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
1. Remove or refactor the remaining Manus-only OAuth callback path in [`server/_core/oauth.ts`](/Users/carlg/Documents/AI-Coding/Local-leasemate/server/_core/oauth.ts) if Manus auth is no longer needed.
2. Decide whether production scheduling should remain local/in-process or move to a durable service such as QStash.
3. Stand up a dedicated local or CI test database if you want DB-backed tests to run automatically instead of behind `RUN_DB_TESTS=1`.

### Medium priority
1. Review old deployment docs and remove any instructions that still assume Forge or Manus-only services.
2. Decide whether the non-git export folder should be retained as an archive or deleted to reduce workspace duplication.
3. Add seed data and demo accounts that better match the intended operator, provider, and customer flows.

## Recommended Local Workflow

1. Work in the git-backed repository: [`/Users/carlg/Documents/AI-Coding/Local-leasemate`](/Users/carlg/Documents/AI-Coding/Local-leasemate)
2. Use the export folder only as a reference snapshot from Manus:
   [`/Users/carlg/Documents/AI-Coding/leasemate`](/Users/carlg/Documents/AI-Coding/leasemate)
3. Keep `AUTH_MODE=local` unless there is a specific reason to test Manus auth.
4. Treat live Resend and DB-backed tests as explicit integration checks, not default unit-test expectations.
