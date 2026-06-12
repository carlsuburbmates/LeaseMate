# LeaseMate Developer Automation & Day-to-Day Workflow

This document outlines the standard operating procedures, automation scripts, and daily workflows for developers working on the LeaseMate codebase. It is designed to complement the `LOCAL_SETUP.md` guide by focusing on *how* to work efficiently rather than just how to start.

## 1. Daily Development Loop

The LeaseMate project is a Vite + React + Express monolith managed by `pnpm`. The daily workflow relies on a few core commands defined in `package.json`.

| Command | Purpose | When to Use |
|---|---|---|
| `pnpm run dev` | Starts the Vite frontend dev server and the Node.js backend using `tsx watch`. | Daily active development. Hot-reloads on both client and server file changes. |
| `pnpm run check` | Runs the TypeScript compiler (`tsc --noEmit`) to verify types across the entire project. | Before committing code or opening a PR. |
| `pnpm run format` | Runs Prettier over the codebase to enforce the standard style (`.prettierrc`). | Before committing code, or configure your editor to format on save. |
| `pnpm run test` | Runs the Vitest test suite (`server/**/*.test.ts`). | When modifying backend routers or core business logic. |

**Recommended Git Workflow:**
1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Run `pnpm run dev` and make your changes.
3. Run `pnpm run format` and `pnpm run check` to ensure code quality.
4. Run `pnpm run test` to verify no regressions.
5. Commit and push: `git commit -m "feat: your feature description" && git push origin HEAD`

## 2. Database Management & Migrations

LeaseMate uses Drizzle ORM (`drizzle-orm`) with MySQL. The schema is defined in `drizzle/schema.ts`.

### Modifying the Schema
When you need to add a new table or modify an existing column:
1. Update `drizzle/schema.ts` with the new definitions.
2. Ensure your local MySQL instance is running and `DATABASE_URL` is set in `.env`.
3. Run the automated push command:
   ```bash
   pnpm run db:push
   ```
   *Note: This command runs `drizzle-kit generate` followed by `drizzle-kit migrate`. It automatically calculates the diff, generates the SQL migration files in `./drizzle/`, and applies them to your local database.*

### Seeding Data
The repository includes several automation scripts in the `./scripts/` directory to manage database state.

- **`node scripts/seed.mjs`**: Seeds foundational reference data (e.g., the Greater Melbourne suburbs list). Run this once on a fresh database.
- **`node scripts/seed-test-data.mjs`**: Creates 3 test user accounts (a customer, a provider, and an operator) and populates initial dummy requests for UAT testing.
- **`node scripts/setup-stripe.mjs`**: Creates the 6 required Stripe products and prices (e.g., "Removalist Introduction Fee"). Requires `STRIPE_SECRET_KEY` in `.env`.

## 3. Environment & Configuration Automation

The project relies on environment variables for all external integrations. 

### Local Environment
Always maintain `.env.example` as the source of truth. If you add a new environment variable requirement to the codebase:
1. Add it to `.env.example` with a dummy value and an explanatory comment.
2. Update `server/_core/env.ts` to parse and export the variable safely.
3. If the variable is required for the app to boot, add a validation check in `env.ts` or the relevant module.

### Vercel Deployment Automation
The repository includes a bash script to automate the synchronization of environment variables to Vercel (both Production and Preview environments).

```bash
# Ensure you are logged in via Vercel CLI: `vercel login`
# Ensure the project is linked: `vercel link`
./scripts/set-vercel-env.sh
```
*Note: You must modify this script locally to include any new environment variables you add to the project before running it.*

## 4. Testing Automation

LeaseMate uses Vitest for backend integration testing. The configuration is defined in `vitest.config.ts`.

- **Test Location**: Tests must be placed in the `server/` directory and end with `.test.ts` or `.spec.ts`.
- **Database Dependency**: The current test suite (`leasemate.test.ts`) requires a running database. Ensure your local database is seeded before running tests.
- **External APIs**: Tests interacting with external APIs (like `resend.test.ts`) expect the relevant API keys to be present in `.env`. If you are running tests offline or in CI, ensure these tests are configured to skip gracefully when keys are absent.

## 5. Build and Deployment Pipeline

The production build process is fully automated via `pnpm run build`.

1. **Frontend**: Vite compiles the React application into static assets in `dist/public/`.
2. **Backend**: `esbuild` bundles the Node.js Express server (`server/_core/index.ts`) into a single file at `dist/index.js`, externalizing Node built-ins and dependencies.

**To test the production build locally:**
```bash
pnpm run build
pnpm run start
```

**Vercel Deployment:**
The project is configured for Vercel deployment. The `package.json` includes a `build:vercel` script which simply runs `vite build`. Vercel automatically detects the Vite frontend and handles the serverless deployment of the `/api` routes via the configuration in `vercel.json`.
