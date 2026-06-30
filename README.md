# LeaseMate

LeaseMate is a three-sided marketplace platform designed to orchestrate and automate the end-of-lease moving process. It connects tenants (Customers) with vetted local service businesses (Providers) under the supervision of a platform administrator (Operator).

Terminology used in this repo:

- `local` means the app is running from your machine
- `remote` means the backing services outside your machine that the app connects to

In the canonical LeaseMate setup, `remote` includes GitHub, Vercel, TiDB Cloud Starter, Cloudflare R2, Stripe, Resend, and QStash.

## 1. Local Development Setup

The project is a Vite + React + Express monolith managed by `pnpm`, with local
database-backed login, S3-compatible storage, and optional QStash-backed jobs
that mirror the Vercel deployment path.

### Prerequisites
- Node.js (v20+)
- `pnpm` (v10+)
- A remote MySQL-compatible database. TiDB Cloud Starter is the canonical recommended setup.
- Local MySQL/MariaDB is optional, but not the canonical target.
- For launch-like file handling, a remote S3-compatible object store such as Cloudflare R2 or AWS S3

### Installation
1. Clone the repository and install dependencies:
   ```bash
   pnpm install
   ```
2. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```
   *Note: Fill in the required keys in `.env`, especially `DATABASE_URL`. For launch-like behavior, also configure `S3_*`, Stripe, and Resend values. Use `RESEND_FROM_ADDRESS=LeaseMate <onboarding@resend.dev>` until a custom sending domain is verified in Resend.*

3. Push the database schema:
   ```bash
   pnpm run db:push
   ```

4. Seed the database with required reference data (suburbs, service categories):
   ```bash
   node scripts/seed.mjs
   ```

5. (Optional) Seed test data for UAT:
   ```bash
   node scripts/seed-test-data.mjs
   ```

6. Start the development server:
   ```bash
   pnpm run dev
   ```
   The app will be available at `http://localhost:3000`.

## 2. Daily Development Loop

| Command | Purpose | When to Use |
|---|---|---|
| `pnpm run dev` | Starts Vite frontend and Node.js backend (`tsx watch`). | Daily active development. Hot-reloads on file changes. |
| `pnpm run check` | Runs TypeScript compiler (`tsc --noEmit`). | Before committing code or opening a PR. |
| `pnpm run format` | Runs Prettier to enforce standard style. | Before committing code. |
| `pnpm run test` | Runs the Vitest test suite. | When modifying backend routers or core business logic. |
| `pnpm run db:push` | Applies schema changes to the configured database connection. | After modifying `drizzle/schema.ts`. |

## 3. Architecture & Key Documentation

The platform is designed around an automation-heavy workflow, but the canonical source of truth is the current implementation in the repo rather than an aspirational future state.

For deep-dives into specific areas of the platform, refer to the following canonical documents:

- **[LAUNCH_GATE.md](./LAUNCH_GATE.md)**: The single canonical pass/fail gate for deciding whether a change is actually complete enough to treat as done.
- **[LOCAL_BUILD_STRATEGY.md](./LOCAL_BUILD_STRATEGY.md)**: The canonical local runbook for the full app, including ops.
- **[DDD_CONTEXT_MAP.md](./DDD_CONTEXT_MAP.md)**: The canonical bounded-context map, contract ownership matrix, and anti-corruption rules.
- **[INTEGRATIONS.md](./INTEGRATIONS.md)**: The canonical register of verified integrations, core tools/techs, connection points, and non-canonical leftovers.
- **[UAT-GUIDE.md](./UAT-GUIDE.md)**: Step-by-step user acceptance testing flows for all three user roles (Customer, Provider, Operator).
- **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)**: The current runtime status, external dependency checklist, and local development notes.
- **Code paths**: `server/lib/qstash.ts`, `server/stripeWebhook.ts`, and `server/routers/*` are the canonical automation and workflow implementation.

Verification responsibility split:

- use `LOCAL_BUILD_STRATEGY.md` to run the product locally
- use `UAT-GUIDE.md` to execute role-based flows
- use `INTEGRATIONS.md` to confirm integration truth
- use `LAUNCH_GATE.md` for the final completion decision

Provider onboarding note:

- provider accounts now begin in `pending`
- approval is evaluated automatically from profile completeness plus at least one active product
- pending providers cannot act on opportunities until they become `active`

## 4. Build and Deployment

The production build process is fully automated.

1. **Frontend**: Vite compiles the React application into static assets in `dist/public/`.
2. **Backend**: `esbuild` bundles the Node.js Express server into `dist/index.js`.

**To test the production build locally:**
```bash
pnpm run build
pnpm run start
```

**Vercel Deployment:**
The project is configured for Vercel deployment. Ensure your Vercel project is
linked (`vercel link`) and push to the `main` branch to trigger a deployment.
The deploy entrypoint is `api/index.ts`, and environment variables must be
configured in the Vercel dashboard.

Canonical environment policy:

- Production is the only environment that should receive live integration secrets by default.
- Preview deployments are intentionally left without integration secrets until a separate preview database, storage bucket, payment sandbox path, and job callback base URL are provisioned.
- Use [INTEGRATIONS.md](./INTEGRATIONS.md) as the source of truth before adding or removing any platform credential.

## 5. Launch-Like Integrations

For a production-like environment, the intended runtime mix is:

- **Database**: remote MySQL-compatible service, with TiDB Cloud Starter as the canonical recommended setup
- **File storage**: remote S3-compatible object storage via the `S3_*` env vars
- **Payments**: Stripe
- **Email**: Resend, with `RESEND_FROM_ADDRESS` explicit in env management
- **Delayed jobs**: QStash
- **Daily cleanup**: Vercel Cron

Storage now prefers remote S3-compatible object storage first and only uses local `./uploads` when remote object storage is not configured.
