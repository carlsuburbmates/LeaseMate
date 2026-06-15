# LeaseMate

LeaseMate is a three-sided marketplace platform designed to orchestrate and automate the end-of-lease moving process. It connects tenants (Customers) with vetted local service businesses (Providers) under the supervision of a platform administrator (Operator).

## 1. Local Development Setup

The project is a Vite + React + Express monolith managed by `pnpm`.

### Prerequisites
- Node.js (v20+)
- `pnpm` (v9+)
- A running MySQL/MariaDB database (or cloud equivalent like TiDB/PlanetScale)
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
   *Note: Fill in the required keys in `.env`, specifically `DATABASE_URL`. For launch-like storage, also configure the `S3_*` variables.*

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
| `pnpm run db:push` | Applies schema changes to the local database. | After modifying `drizzle/schema.ts`. |

## 3. Architecture & Key Documentation

The platform is designed to run in a fully automated state. The state machine, background jobs, and exception handling logic are strictly defined.

For deep-dives into specific areas of the platform, refer to the following canonical documents:

- **[DDD_CONTEXT_MAP.md](./DDD_CONTEXT_MAP.md)**: The canonical bounded-context map, contract ownership matrix, and anti-corruption rules.
- **[INTEGRATIONS.md](./INTEGRATIONS.md)**: The canonical register of verified integrations, connection points, and non-canonical leftovers.
- **[UAT-GUIDE.md](./UAT-GUIDE.md)**: Step-by-step user acceptance testing flows for all three user roles (Customer, Provider, Operator).
- **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)**: The current runtime status, external dependency checklist, and local development notes.
- **Code paths**: `server/lib/qstash.ts`, `server/stripeWebhook.ts`, and `server/routers.ts` are the canonical automation and workflow implementation.

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
The project is configured for Vercel deployment. Ensure your Vercel project is linked (`vercel link`) and push to the `main` branch to trigger a deployment. Environment variables must be configured in the Vercel dashboard.

Canonical environment policy:

- Production is the only environment that should receive live integration secrets by default.
- Preview deployments are intentionally left without integration secrets until a separate preview database, storage bucket, payment sandbox path, and job callback base URL are provisioned.
- Use [INTEGRATIONS.md](./INTEGRATIONS.md) as the source of truth before adding or removing any platform credential.

## 5. Launch-Like Integrations

For a production-like environment, the intended runtime mix is:

- **Database**: remote MySQL-compatible service
- **File storage**: remote S3-compatible object storage via the `S3_*` env vars
- **Payments**: Stripe
- **Email**: Resend
- **Delayed jobs**: QStash
- **Daily cleanup**: Vercel Cron

Storage now prefers remote S3-compatible object storage first and only uses local `./uploads` when remote object storage is not configured.
