# LeaseMate Local Build Strategy

Last updated: 2026-06-19

This is the canonical local runbook for building and operating the full LeaseMate app on one machine, including:

- customer experience
- provider experience
- ops experience
- local auth
- local automation behavior

## Terminology

For this project:

- `local` means the app is running from your machine
- `remote` means the backing services the local app talks to outside your machine

In the canonical local setup, the app runs locally while still using remote services for:

- GitHub as the source-of-truth repo
- TiDB Cloud Starter as the database
- Cloudflare R2 as object storage
- Stripe as payments
- Resend as email
- QStash as optional durable delayed-job infrastructure

## Objective

The local target is not a stripped demo.

The target is a launch-like single-app environment where:

- the web app runs end-to-end from one codebase
- customer, provider, and ops roles use the same running app
- the database is shared across all roles
- payments, email, storage, and delayed jobs are either connected or intentionally degraded with known fallback behavior

## Canonical local shape

LeaseMate is a monolith for local development:

- Vite frontend
- Express backend
- tRPC application API
- one shared database
- one shared session/auth model
- one shared ops surface

There is no separate ops service to run.

`/ops` is part of the same app instance as:

- `/login`
- `/move-out-cart`
- `/provider/*`
- `/requests/:id`

## Recommended local stack

For the most useful local build, use this stack:

| Layer | Recommended local choice | Why |
|---|---|---|
| App runtime | local repo + `pnpm` | Canonical development path |
| Database | remote TiDB Cloud Starter | Shared persistent state without local DB maintenance |
| Object storage | Cloudflare R2 | Matches launch-like file delivery path |
| Payments | Stripe test mode | Supports real provider payment flow |
| Email | Resend | Supports transactional notifications and owner alerts; use the onboarding sender until a custom domain is verified |
| Delayed jobs | local in-process timers first | Simplest full-app local behavior |
| Durable scheduler | QStash optional | Useful only when you specifically want remote delayed execution parity |

## Minimum viable local build

These are the only fields that must be set for a meaningful local run:

- `DATABASE_URL`
- `JWT_SECRET`
- `OWNER_EMAIL`

These are strongly recommended for launch-like behavior:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_ADDRESS`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

These are optional for local:

- `RESEND_REPLY_TO`
- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- `CRON_SECRET`
- `INTERNAL_JOB_SECRET`

## Build sequence

Run the local environment in this order.

### 1. Install dependencies

```bash
npx pnpm@10.28.2 install
```

### 2. Confirm environment file

Use:

- [.env.example](/Users/carlg/Documents/AI-Coding/Local-leasemate/.env.example) for variable shape
- [INTEGRATIONS.md](/Users/carlg/Documents/AI-Coding/Local-leasemate/INTEGRATIONS.md) for which services are actually canonical

### 3. Apply schema

```bash
npx pnpm@10.28.2 run db:push
```

### 4. Seed reference data

```bash
node scripts/seed.mjs
```

This gives you:

- suburbs
- service categories

### 5. Seed role-based test data

```bash
node scripts/seed-test-data.mjs
```

This is what makes the full app usable quickly across:

- customer
- provider
- operator

### 6. Start the app

```bash
npx pnpm@10.28.2 run dev
```

Expected local base URL:

- `http://localhost:3000`

If `3000` is unavailable, the app will choose the next free port.

## Local role entrypoints

Use these entrypoints once the app is running.

| Role | Entry path | Notes |
|---|---|---|
| All roles | `/login` | Local auth chooser and user creation |
| Customer | `/dashboard` | Customer request overview |
| Customer | `/move-out-cart` | Customer intake flow |
| Provider | `/provider/dashboard` | Provider home |
| Provider | `/provider/profile` | Provider business profile |
| Provider | `/provider/products` | Provider service catalog |
| Provider | `/provider/opportunities` | Invitation handling and payment path |
| Provider | `/provider/billing` | Provider billing history |
| Operator | `/ops` | Main ops dashboard |
| Operator | `/ops/requests` | Request review |
| Operator | `/ops/exceptions` | Exception queue |
| Operator | `/ops/providers` | Provider management |
| Operator | `/ops/health` | System and automation view |
| Operator | `/ops/audit` | Audit trail |

## Full local verification strategy

To verify the whole product locally, use this sequence.

### Phase A. Platform health

1. Load `/login`
2. Sign in successfully
3. Confirm role-based dashboard routing works
4. Confirm no startup crash

### Phase B. Customer path

1. Sign in as a customer
2. Open `/move-out-cart`
3. Create a move request
4. Submit the request
5. Verify the request appears in customer views

### Phase C. Provider path

1. Sign in as a provider
2. Open `/provider/opportunities`
3. Accept an invitation
4. If Stripe is configured, complete test checkout
5. Confirm billing history and release behavior update

### Phase D. Ops path

1. Sign in as an operator
2. Open `/ops`
3. Verify request counts, exception counts, and provider counts render
4. Open `/ops/requests`
5. Open `/ops/exceptions`
6. Open `/ops/providers`
7. Open `/ops/health`
8. Open `/ops/audit`

### Phase E. Integration checks

Only run these when the relevant service is configured.

- Stripe: provider checkout + webhook flow
- Resend: verify API key, sender mode, and notification delivery
- R2: verify storage access path
- QStash: verify remote delayed execution only if specifically needed

## Email sender policy

Use Resend in one of two explicit modes:

### Mode A. Immediate working mode

- `RESEND_FROM_ADDRESS="LeaseMate <onboarding@resend.dev>"`
- works without a verified custom domain
- best for local development and early remote verification

### Mode B. Branded production mode

- `RESEND_FROM_ADDRESS="LeaseMate <notifications@your-domain>"`
- requires that the sending domain is verified in Resend first
- should only be used after verification is complete

## Local automation strategy

For local work, treat automation in two layers.

### Default local mode

Use in-process timers only.

Why:

- simplest setup
- no extra scheduler dependency
- enough to test most business workflows

### Launch-like local mode

Use QStash only when you need to validate:

- signed callback flow
- remote delayed delivery
- cron authorization parity

Do not require QStash for everyday local app work.

## Ops-specific local guidance

Ops is not a separate deployment concern in local development.

It depends on:

- the same database as customer and provider paths
- the same auth system
- the same audit and exception records written by the rest of the app

That means ops validation is only meaningful after:

- seed data exists
- request and provider records exist
- at least some workflow events have happened

## Build targets

### Development target

Use this for daily work:

```bash
npx pnpm@10.28.2 run dev
```

### Production-like local target

Use this when validating deploy output:

```bash
npx pnpm@10.28.2 run build
npx pnpm@10.28.2 run start
```

## What “full app including ops” means in practice

A local build is considered complete when all of these are true:

- login works
- customer intake works
- provider profile and opportunities load
- ops pages render
- database-backed state persists across roles
- typecheck passes
- tests pass
- production build passes

Everything else is optional enhancement, not baseline completion.

## Canonical supporting documents

- [README.md](/Users/carlg/Documents/AI-Coding/Local-leasemate/README.md)
- [INTEGRATIONS.md](/Users/carlg/Documents/AI-Coding/Local-leasemate/INTEGRATIONS.md)
- [DDD_CONTEXT_MAP.md](/Users/carlg/Documents/AI-Coding/Local-leasemate/DDD_CONTEXT_MAP.md)
- [UAT-GUIDE.md](/Users/carlg/Documents/AI-Coding/Local-leasemate/UAT-GUIDE.md)
- [MIGRATION_PLAN.md](/Users/carlg/Documents/AI-Coding/Local-leasemate/MIGRATION_PLAN.md)

## Current recommendation

Use this exact local strategy:

1. keep one canonical repo only
2. keep preview secretless
3. use local auth
4. use TiDB as shared persistent state
5. use R2 for launch-like storage
6. use Stripe test mode for payment verification
7. use Resend for notification verification
8. use local timers by default for automation
9. use ops validation as part of the same app run, not as a separate setup
