# LeaseMate Canonical Integration Register

Last updated: 2026-07-01

This file is the canonical source of truth for external integrations in LeaseMate.

Use it to answer four questions before touching infrastructure:

1. Which external services are actually connected to the project?
2. Where do they connect in code?
3. Which environment variables drive them?
4. What was verified versus only inferred from config?

If an integration is changed, added, removed, or duplicated, update this file in the same change.

## Terminology

In LeaseMate, `remote` means any dependency that lives outside the local machine.

That includes:

- GitHub for the source-of-truth repo
- Vercel for deployment hosting
- TiDB Cloud Starter for the canonical database
- Cloudflare R2 for the canonical object storage
- Stripe for payments
- Resend for email delivery
- Upstash QStash for durable delayed jobs

`Local` means the developer machine:

- the checked-out repo
- the dev server on `localhost`
- local auth/session state
- local timer fallbacks
- local disk uploads only when remote storage is not configured

## Canonical rules

- Treat this file as the integration registry for both local development and Vercel production.
- Do not assume an integration is active just because keys exist in `.env` or Vercel.
- When one platform connects in more than one way, document each connection separately here.
- Do not use the untracked duplicate folder as a source of truth. The git-tracked working copy is the canonical repo.

## Core tech stack and tooling

These are the non-negotiable tools and techs that make the website run and ship.

| Layer | Tool / tech | Purpose | Status | Verification |
|---|---|---|---|---|
| Source control | GitHub | Canonical repo hosting and PR workflow | Active | Repo is tracked as `carlsuburbmates/leasemate` |
| Package manager | pnpm 10.4.1 | Dependency management and scripts | Active | `packageManager` in `package.json`, `pnpm` dev dependency pinned |
| Language | TypeScript 5.9.3 | Type safety across client/server/shared code | Active | `tsconfig.json`, `check` script, repo compiles with `tsc --noEmit` |
| Frontend build | Vite 7.3.5 | Client build pipeline and dev server | Active | `package.json` scripts, `client/index.html` entrypoint |
| UI runtime | React 19.2.1 | Browser UI rendering | Active | `client/src` application tree |
| Server runtime | Express 4.21.2 | HTTP API and Vercel serverless entrypoint | Active | `server/_core/index.ts`, `api/index.ts` |
| Typed RPC | tRPC 11.x | End-to-end typed client/server calls | Active | Router wiring in `server/routers/*` and client RPC setup |
| ORM / query layer | Drizzle ORM + mysql2 | Database access and migrations | Active | `server/db.ts`, `drizzle.config.ts`, `drizzle/schema.ts` |
| Authentication | JWT + cookie session | Local database-backed login | Active | `server/_core/sdk.ts`, `/login`, `JWT_SECRET` |
| Payments | Stripe | Provider introduction-fee checkout + webhook flow | Active | `server/lib/stripe.ts`, `server/stripeWebhook.ts` |
| Email | Resend | Transactional mail and owner alerts | Active | `server/lib/resend.ts`, `server/_core/notification.ts` |
| Storage | AWS SDK S3 + Cloudflare R2 | Remote object storage with local fallback | Active | `server/storage.ts`, `server/_core/storageProxy.ts` |
| Delayed jobs | Upstash QStash | Durable delayed execution and callback signing | Active | `server/lib/qstash.ts`, `vercel.json`, `CRON_SECRET` |
| Deployment | Vercel | Frontend hosting, API runtime, and cron | Active | `vercel.json`, `api/index.ts` |
| Testing | Vitest | Automated test suite | Active | `package.json` `test` script, existing server tests |
| Build tooling | esbuild | Server bundling for production | Active | `package.json` `build` script |
| Formatting | Prettier | Repository formatting | Active | `package.json` `format` script |
| Dev runtime | tsx | Local watch-mode server process | Active | `package.json` `dev` script |
| Optional analytics | Umami-style script | Client analytics when env vars are present | Optional | `client/index.html` only injects when both analytics env vars exist |
| Typography asset | Google Fonts | UI font loading | Active but non-critical | `client/index.html` preconnects and loads Inter |

## Verified active integrations

| Platform | Status | How it connects | Code touchpoints | Env vars | Verification |
|---|---|---|---|---|---|
| Vercel | Active | Hosts the frontend build, runs the `api/index.ts` serverless entrypoint, stores production env vars, and triggers daily cron cleanup | `vercel.json`, `api/index.ts`, `server/_core/jobs.ts` | `APP_URL`, production env store | Verified via linked project, deployment list, production env list, and live project metadata on 2026-06-16 |
| TiDB Cloud Starter | Active | Canonical remote MySQL-compatible database for runtime state, migrations, and seed scripts | `server/db.ts`, `drizzle.config.ts`, `drizzle/schema.ts`, `scripts/seed*.mjs` | `DATABASE_URL` | Re-verified on 2026-07-01: the canonical runtime path connected successfully and returned `select 1`; the earlier shell-level failure came from a stale exported `DATABASE_URL` pointing at a legacy Postgres host rather than the repo's `.env` |
| Cloudflare R2 | Active | S3-compatible object storage backend for `/storage/*` redirects and any future object writes | `server/_core/storageProxy.ts`, `server/storage.ts`, `server/_core/env.ts` | `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, optional `S3_PUBLIC_BASE_URL`, optional `S3_FORCE_PATH_STYLE` | Verified by successful write/delete health check against the configured bucket on 2026-06-16 |
| Stripe | Active | Provider introduction-fee checkout, webhook verification, payment persistence, and payment-triggered release flow | `server/lib/stripe.ts`, `server/stripeWebhook.ts`, `server/routers.ts`, `drizzle/schema.ts` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY` | Verified on 2026-06-19: live Checkout Session creation succeeded against the LeaseMate sandbox account, signed `checkout.session.completed` webhook processing succeeded through the running local app, payment persistence/release/audit completed, and duplicate delivery stayed idempotent |
| Resend | Active | Transactional emails to customers/providers and owner alerts | `server/lib/resend.ts`, `server/_core/notification.ts`, `server/routers.ts`, `server/stripeWebhook.ts`, `server/lib/qstash.ts` | `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`, `RESEND_REPLY_TO`, `OWNER_EMAIL` | Re-verified on 2026-07-01: the canonical runtime path authenticated successfully; the earlier invalid-key result came from a stale shell-exported `RESEND_API_KEY`, not the repo's `.env` |
| Upstash QStash | Active | Delayed jobs for provider timeout, payment deadline, and cleanup calls; signature verification for queued callbacks | `server/lib/qstash.ts`, `server/_core/jobs.ts`, `server/routers.ts`, `vercel.json` | `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, `CRON_SECRET`, optional `INTERNAL_JOB_SECRET`, `APP_URL` | Re-verified on 2026-07-01: authenticated queue listing succeeded through the canonical runtime path; local fallback behavior still exists when remote publish is unavailable |

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
- A fresh recheck through the canonical runtime path succeeded on 2026-07-01.
- The failing shell-level check in this thread was traced to a stale exported `DATABASE_URL` pointing at a legacy Supabase/Postgres host, not to the repo's `.env`.

Interpretation:

- The app is built to use TiDB as its canonical remote database.
- The database is currently healthy through the canonical local runtime path.
- Ad-hoc shell commands that do not load `.env` with override can produce false negatives if the shell still has stale exports from older projects.

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

Current verified state:

- Checkout Session creation works against the LeaseMate Stripe sandbox account
- The local webhook route now correctly parses raw request bodies before signature verification
- A signed `checkout.session.completed` event persists the introduction fee, releases customer details, and writes the expected audit records
- Duplicate delivery for the same invitation now leaves fee and audit counts stable

### Resend

Connection modes:

- Marketplace transaction emails in `server/lib/resend.ts`
- Owner/operator alert emails in `server/_core/notification.ts`

Current verified state:

- Resend API key is valid through the canonical runtime path
- Resend account currently has zero verified domains
- The app now supports two explicit sender modes:
- shared onboarding sender for immediate working delivery
- custom branded sender after domain verification
- The earlier invalid-key result in this thread came from a stale shell-exported `RESEND_API_KEY`, not from the repo's `.env`

Operational rule:

- If `RESEND_FROM_ADDRESS` uses your own domain, verify that domain in Resend first.
- If the domain is not yet verified, keep `RESEND_FROM_ADDRESS` on `onboarding@resend.dev`.

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
- The authenticated queue API is currently reachable through the canonical runtime path.

## Optional production-only integrations

| Platform | Current state | Why it is not canonical as an active runtime integration |
|---|---|---|
| Umami-style analytics | Production Vercel env vars exist; local values are empty | `client/index.html` loads analytics only when both `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` exist; analytics is optional and currently production-only |

## Removed or non-canonical integrations

| Integration | State | Evidence |
|---|---|---|
| Legacy platform API layer | Removed from production env and not part of the intended runtime | Legacy platform env vars were removed from Vercel production; no canonical app flow should depend on them |
| Legacy sandbox OAuth flow | Not canonical | Authentication is now local JWT + database backed through `/login` and `server/_core/sdk.ts` |
| Upstash Redis | Not canonical | No runtime code reads `REDIS_URL`, `UPSTASH_REDIS_REST_URL`, or `UPSTASH_REDIS_REST_TOKEN`; these were removed from canonical env management |
| Gmail API | Not connected to the application runtime | Gmail may be used operationally as the owner inbox, but the app does not call Gmail APIs |

Important note:

- The Vercel entrypoint no longer registers OAuth routes. Local/database-backed auth is the only canonical path.

## Connection map by project aspect

### Hosting and delivery

- Vercel serves the built frontend from `dist/public`
- Vercel runs the API layer from `api/index.ts`
- Vercel cron hits `/api/jobs/stale-request-cleanup`
- Google Fonts loads Inter from the browser at runtime

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
- For LeaseMate local runtime checks, remember that `server/_core/index.ts` calls `dotenv.config({ override: true })`. Shell-exported secrets can mislead ad-hoc diagnostics if they are not loaded the same way.

## Immediate follow-up items

- Decide when to switch Resend from the onboarding sender to a verified branded sender.
- Keep preview secretless until a dedicated preview stack exists.
- Clear stale exported legacy env vars from any developer shell profile before using ad-hoc integration diagnostics.
- Remove any remaining Redis env vars from local secret files if they are still present from earlier experiments.
