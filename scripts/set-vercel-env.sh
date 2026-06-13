#!/bin/bash
# Script to set all required env vars in Vercel for the lease-mate project
# Run from the project root after `vercel link`

set -e
export PATH="$HOME/.local/share/pnpm:$PATH"

echo "Setting Vercel environment variables for lease-mate..."

# Function to add env var to both Production and Preview
add_env() {
  local key="$1"
  local value="$2"
  echo "Adding $key..."
  # Add to Production
  echo "$value" | vercel env add "$key" production --yes 2>&1 | tail -1
  # Add to Preview
  echo "$value" | vercel env add "$key" preview --yes 2>&1 | tail -1
}

# Core app
add_env "APP_URL" "$APP_URL"
add_env "DATABASE_URL" "$DATABASE_URL"
add_env "JWT_SECRET" "$JWT_SECRET"
add_env "OWNER_EMAIL" "$OWNER_EMAIL"

# Analytics
add_env "VITE_ANALYTICS_ENDPOINT" "$VITE_ANALYTICS_ENDPOINT"
add_env "VITE_ANALYTICS_WEBSITE_ID" "$VITE_ANALYTICS_WEBSITE_ID"

# Stripe
add_env "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
add_env "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET"
add_env "VITE_STRIPE_PUBLISHABLE_KEY" "$VITE_STRIPE_PUBLISHABLE_KEY"

# Resend
add_env "RESEND_API_KEY" "$RESEND_API_KEY"

# Background automation
add_env "QSTASH_TOKEN" "$QSTASH_TOKEN"
add_env "QSTASH_CURRENT_SIGNING_KEY" "$QSTASH_CURRENT_SIGNING_KEY"
add_env "QSTASH_NEXT_SIGNING_KEY" "$QSTASH_NEXT_SIGNING_KEY"
add_env "CRON_SECRET" "$CRON_SECRET"
add_env "INTERNAL_JOB_SECRET" "$INTERNAL_JOB_SECRET"

# Optional Redis
add_env "REDIS_URL" "$REDIS_URL"
add_env "UPSTASH_REDIS_REST_URL" "$UPSTASH_REDIS_REST_URL"
add_env "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN"

# Object storage
add_env "S3_BUCKET" "$S3_BUCKET"
add_env "S3_REGION" "$S3_REGION"
add_env "S3_ENDPOINT" "$S3_ENDPOINT"
add_env "S3_ACCESS_KEY_ID" "$S3_ACCESS_KEY_ID"
add_env "S3_SECRET_ACCESS_KEY" "$S3_SECRET_ACCESS_KEY"
add_env "S3_PUBLIC_BASE_URL" "$S3_PUBLIC_BASE_URL"
add_env "S3_FORCE_PATH_STYLE" "$S3_FORCE_PATH_STYLE"

echo ""
echo "Done! Listing all env vars:"
vercel env ls
