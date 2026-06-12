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

### Optional Services

The application will start without these, but specific features will be disabled:

- **Stripe**: Add `STRIPE_SECRET_KEY` to enable introduction fee payments.
- **Resend**: Add `RESEND_API_KEY` to enable transactional emails.
- **Google Maps**: Add `VITE_GOOGLE_MAPS_API_KEY` to enable address autocomplete and map views.

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
The application relies on an external OAuth provider for authentication. Locally, `OAUTH_SERVER_URL` must point to a compatible OAuth server. If you do not have one, you can manually insert a session cookie that matches a user `openId` in your local database.

### Google Maps
In production, Google Maps is loaded through a secure Forge proxy to protect API keys. Locally, you must provide a direct `VITE_GOOGLE_MAPS_API_KEY` in your `.env` file.

### Manus UI Plugins
The Vite configuration includes plugins like `vite-plugin-manus-runtime` and `@builder.io/vite-plugin-jsx-loc`. These are harmless locally—they detect they are not running inside the Manus platform and remain inactive.

## Building for Production

To build the application for deployment:

```bash
pnpm run build
```

This compiles the React frontend into `dist/public/` and bundles the Node.js backend into `dist/index.js` using esbuild.
