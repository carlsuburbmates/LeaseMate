# LeaseMate Local Development Guide

This guide explains how to run the LeaseMate project on your local machine, outside of the Manus sandbox environment.

The codebase has been decoupled from Manus-specific platform services so it can run anywhere. Where platform services were previously required (like file storage), local fallbacks have been implemented.

## Prerequisites

1. **Node.js** (v22+ recommended)
2. **pnpm** (v10+ recommended)
3. **MySQL or MariaDB** (Running locally or via Docker)

## 1. Initial Setup

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd LeaseMate
pnpm install
```

## 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and configure the essential variables:

- `DATABASE_URL`: Point this to your local MySQL database (e.g., `mysql://root:password@127.0.0.1:3306/leasemate`).
- `JWT_SECRET`: A random string for session cookies.
- `AUTH_MODE=local` and `VITE_AUTH_MODE=local`: Enables the built-in local login flow.

### Optional Services

The application will start without these, but specific features will be disabled:

- **Stripe**: Add `STRIPE_SECRET_KEY` to enable introduction fee payments.
- **Resend**: Add `RESEND_API_KEY` to enable transactional emails.
- **Owner alerts**: Add `OWNER_EMAIL` so fallback operator notifications go to email when Manus Forge is absent.
- **QStash**: Add `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, and `QSTASH_NEXT_SIGNING_KEY` if you want durable delayed job delivery in production. Local development already runs automation jobs in-process.
- **Vercel cron auth**: Add `CRON_SECRET` if you deploy to Vercel so the scheduled stale-cleanup endpoint is authenticated.

## 3. Database Setup

Push the Drizzle schema to your local database:

```bash
pnpm run db:push
```

Seed the database with the initial required data (suburbs, service categories, and test users):

```bash
node scripts/seed-test-data.mjs
```

## 4. Running the Development Server

Start the Vite development server and the backend API simultaneously:

```bash
pnpm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 5. Understanding Local Fallbacks

Because this project was originally built inside Manus, several cloud-native services have been replaced with local fallbacks when running on your machine:

### File Storage
In production, files are uploaded directly to S3 via the Manus Forge API. Locally, if `BUILT_IN_FORGE_API_URL` is not set in your `.env`, the backend will automatically write uploaded files to the `./uploads/` directory in the project root and serve them at `/local-uploads/`. **These files are not persisted across database resets or repository clones.**

### Authentication
The default local setup no longer requires Manus OAuth. With `AUTH_MODE=local`, open [http://localhost:3000/login](http://localhost:3000/login), choose a role, and create or reuse a database user. The server issues the same session cookie format used by the rest of the app, so authenticated routes work locally without any external identity provider.

If you specifically want to test the old Manus-style auth flow, switch `AUTH_MODE=manus` and provide `OAUTH_SERVER_URL` plus the related portal variables.

### Manus UI Plugins
The Vite configuration includes plugins like `vite-plugin-manus-runtime` and `@builder.io/vite-plugin-jsx-loc`. These are harmless locally—they detect they are not running inside the Manus platform and remain inactive.

### Background Jobs
Provider timeout checks, payment deadline checks, critical exception notifications, customer-detail release tasks, and stale-request cleanup now have a local in-process implementation. Those jobs are persisted to `automation_tasks` and executed with local timers while the server is running.

For durable production delivery:

- delayed invitation jobs publish to QStash when `QSTASH_TOKEN` is configured
- the receiving job endpoints verify either the forwarded internal job secret or the QStash signature keys
- stale-request cleanup is exposed at `/api/jobs/stale-request-cleanup` and scheduled via Vercel Cron in [`vercel.json`](/Users/carlg/Documents/AI-Coding/Local-leasemate/vercel.json)

## 6. Running Tests

The default test run is local-safe and skips live integration checks:

```bash
pnpm test
```

To opt into database-backed router tests:

```bash
RUN_DB_TESTS=1 pnpm test
```

To opt into the live Resend credential check:

```bash
RUN_LIVE_RESEND_TESTS=1 pnpm test
```

## Building for Production

To build the application for deployment:

```bash
pnpm run build
```

This compiles the React frontend into `dist/public/` and bundles the Node.js backend into `dist/index.js` using esbuild.
