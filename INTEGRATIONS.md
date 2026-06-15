# LeaseMate Canonical Integration Register

Last updated: 2026-06-16

This file is the canonical source of truth for external integrations in LeaseMate.

Use it to answer four questions before touching infrastructure:

1. Which external services are actually connected to the project?
2. Where do they connect in code?
3. Which environment variables drive them?
4. What was verified versus only inferred from config?

If an integration is changed, added, removed, or duplicated, update this file in the same change.

## Canonical rules

- Treat this file as the integration registry for both local development and Vercel production.
- Do not assume an integration is active just because keys exist in `.env` or Vercel.
- When one platform connects in more than one way, document each connection separately here.
- Do not use the untracked duplicate folder as a source of truth. The git-tracked working copy is the canonical repo.

## Verified active integrations

| Platform | Status | How it connects | Code touchpoints | Env vars | Verification |
|---|---|---|---|---|---|
| Vercel | Active | Hosts the frontend build, runs the `api/index.ts` serverless entrypoint, stores production env vars, and triggers daily cron cleanup | `vercel.json`, `api/index.ts`, `server/_core/jobs.ts` | `APP_URL`, production env store | Verified via linked project, deployment list, production env list, and live project metadata on 2026-06-16 |
| Cloudflare R2 | Active | S3-compatible object storage backend for `/storage/*` redirects and any future object writes | `server/_core/storageProxy.ts`, `server/storage.ts`, `server/_core/env.ts` | `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, optional `S3_PUBLIC_BASE_URL`, optional `S3_FORCE_PATH_STYLE` | Verified by successful write/delete health check against the configured bucket on 2026-06-16 |
| Stripe | Active in configuration | Provider introduction-fee checkout, webhook verification, payment persistence, and payment-triggered release flow | `server/lib/stripe.ts`, `server/stripeWebhook.ts`, `server/routers.ts`, `drizzle/schema.ts` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY` | Verified as configured locally and in Vercel production; code paths confirmed; not live-charged in this audit step |
| Resend | Active in configuration | Transactional emails to customers/providers and owner alerts | `server/lib/resend.ts`, `server/_core/notification.ts`, `server/routers.ts`, `server/stripeWebhook.ts`, `server/lib/qstash.ts` | `RESEND_API_KEY`, `OWNER_EMAIL` | Verified as configured locally and in Vercel production; code paths confirmed; no live send executed in this audit step |
| Upstash QStash | Active in configuration | Delayed jobs for provider timeout, payment deadline, and cleanup calls; signature verification for queued callbacks | `server/lib/qstash.ts`, `server/_core/jobs.ts`, `server/routers.ts`, `vercel.json` | `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, `CRON_SECRET`, optional `INTERNAL_JOB_SECRET`, `APP_URL` | Verified as configured locally and in Vercel production; publish/verify code paths confirmed; no live publish executed in this audit step |

## Verified platform state

### Vercel

- Project name: `lease-mate`
- Project link exists in `.vercel/project.json`
- Production environment variables are present
- Preview environment variables are intentionally not configured
- Daily cron route is `/api/jobs/stale-request-cleanup`
- Frontend output directory is `dist/public`
- API runtime entry is `api/index.ts`

Important note:

- Vercel production still uses Vercel-managed domains only. A custom production domain was not verified in this audit step.
- Preview is not a canonical integration environment. It should remain secretless until a dedicated preview stack exists.

### Database

Canonical database platform:

- TiDB Cloud Starter over MySQL-compatible connection semantics

Code connection:

- Runtime database access uses Drizzle + `mysql2` in `server/db.ts`
- Drizzle CLI reads `DATABASE_URL` in `drizzle.config.ts`
- Schema is defined in `drizzle/schema.ts`
- Seed and maintenance scripts also use the same `DATABASE_URL`

Current verification state:

- This database path is canonical in code and config.
- A previous migration and table verification succeeded on 2026-06-14.
- A fresh connectivity recheck from this machine on 2026-06-16 timed out.

Interpretation:

- The app is built to use TiDB as its canonical remote database.
- The database should not be treated as newly unknown.
- The current live network path should be rechecked before calling the database fully healthy again.

### Cloudflare R2

Connection modes:

- Read path via `GET /storage/*` in `server/_core/storageProxy.ts`
- Write/read helper layer in `server/storage.ts`
- Fallback to local `./uploads` only when S3-compatible env vars are missing

Current verified state:

- Bucket-backed object operations succeeded with the configured endpoint
- `S3_FORCE_PATH_STYLE` is currently `false`
- `S3_PUBLIC_BASE_URL` is currently unset, so the app uses signed redirects rather than a fixed public bucket URL

### Stripe

Connection modes:

- Backend checkout session creation for provider payments
- Webhook signature verification on `/api/stripe/webhook`
- Database persistence of payment metadata in `introduction_fees`
- Post-payment automation handoff into the customer-details release flow

Important note:

- Stripe is not a single connection. It is four separate project surfaces:
- checkout creation
- frontend redirect to the checkout URL returned by the backend
- webhook verification
- payment data persistence and business workflow continuation

### Resend

Connection modes:

- Marketplace transaction emails in `server/lib/resend.ts`
- Owner/operator alert emails in `server/_core/notification.ts`

Important note:

- `OWNER_EMAIL` is the destination inbox, not a second email provider integration.
- If `OWNER_EMAIL` is a Gmail address, Gmail is only the mailbox receiving mail. The app is still integrated with Resend, not the Gmail API.

### Upstash QStash

Connection modes:

- Remote delayed job publishing through `Client.publishJSON`
- Signed callback verification through `Receiver.verify`
- Vercel cron authorization through `CRON_SECRET`
- Local fallback timers when QStash cannot be used

Important note:

- QStash is optional for local development.
- It becomes the durable delayed-job path in deployment.
- The app can still run without it because `server/lib/qstash.ts` falls back to local timers.

## Optional production-only integrations

| Platform | Current state | Why it is not canonical as an active runtime integration |
|---|---|---|
| Umami-style analytics | Production Vercel env vars exist; local values are empty | `client/index.html` loads analytics only when both `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` exist; analytics is optional and currently production-only |

## Removed or non-canonical integrations

| Integration | State | Evidence |
|---|---|---|
| Manus Forge | Removed from production env and not part of the intended runtime | Legacy Forge env vars were removed from Vercel production; no canonical app flow should depend on them |
| Manus OAuth | Not canonical | Authentication is now local JWT + database backed through `/login` and `server/_core/sdk.ts` |
| Upstash Redis | Not canonical | No runtime code reads `REDIS_URL`, `UPSTASH_REDIS_REST_URL`, or `UPSTASH_REDIS_REST_TOKEN`; these were removed from canonical env management |
| Gmail API | Not connected to the application runtime | Gmail may be used operationally as the owner inbox, but the app does not call Gmail APIs |

Important note:

- The Vercel entrypoint no longer registers OAuth routes. Local/database-backed auth is the only canonical path.

## Connection map by project aspect

### Hosting and delivery

- Vercel serves the built frontend from `dist/public`
- Vercel runs the API layer from `api/index.ts`
- Vercel cron hits `/api/jobs/stale-request-cleanup`

### Authentication

- No third-party OAuth provider is canonical
- Session signing is internal via JWT in `server/_core/sdk.ts`
- User identity is stored in the project database

### Database and state

- TiDB Cloud is the intended remote database
- Drizzle + `mysql2` is the connection stack
- The same `DATABASE_URL` drives runtime, migrations, and seed scripts

### Payments

- Stripe Checkout is used when a provider accepts and pays an introduction fee
- Stripe webhooks confirm payment and trigger business state changes

### Emails and alerts

- Resend sends customer/provider transactional emails
- Resend also sends owner alert notifications

### Delayed automation

- QStash is the remote durable scheduler
- Local timers are the development fallback
- Vercel cron is used for daily cleanup

### File storage

- Cloudflare R2 is the canonical remote storage backend
- The app talks to it through S3-compatible credentials and endpoint settings
- When not configured, the fallback is local disk storage under `./uploads`

### Analytics

- Optional client-side analytics script injection is supported
- It is not required for app operation

## Operational guidance

- Before reconnecting or replacing any service, check this file first.
- If a service appears only in env vars but not in runtime code, treat it as non-canonical until wired into the app.
- If a service appears in code but has not been live-tested recently, record the last successful verification date here.
- If a platform has more than one connection surface, document every surface separately.

## Immediate follow-up items

- Re-verify live TiDB connectivity from the current machine before treating the database as healthy.
- Fix or remove the stale OAuth import in `api/index.ts`.
- Keep preview secretless until a dedicated preview stack exists.
- Remove any remaining Redis env vars from local secret files if they are still present from earlier experiments.
