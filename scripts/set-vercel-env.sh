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

# Database
add_env "DATABASE_URL" "$DATABASE_URL"

# Auth
add_env "JWT_SECRET" "$JWT_SECRET"
add_env "OAUTH_SERVER_URL" "$OAUTH_SERVER_URL"
add_env "VITE_OAUTH_PORTAL_URL" "$VITE_OAUTH_PORTAL_URL"
add_env "OWNER_OPEN_ID" "$OWNER_OPEN_ID"
add_env "OWNER_NAME" "$OWNER_NAME"

# App identity
add_env "VITE_APP_ID" "$VITE_APP_ID"
add_env "VITE_APP_TITLE" "$VITE_APP_TITLE"
add_env "VITE_APP_LOGO" "$VITE_APP_LOGO"

# Manus Forge API
add_env "BUILT_IN_FORGE_API_URL" "$BUILT_IN_FORGE_API_URL"
add_env "BUILT_IN_FORGE_API_KEY" "$BUILT_IN_FORGE_API_KEY"
add_env "VITE_FRONTEND_FORGE_API_KEY" "$VITE_FRONTEND_FORGE_API_KEY"
add_env "VITE_FRONTEND_FORGE_API_URL" "$VITE_FRONTEND_FORGE_API_URL"

# Analytics
add_env "VITE_ANALYTICS_ENDPOINT" "$VITE_ANALYTICS_ENDPOINT"
add_env "VITE_ANALYTICS_WEBSITE_ID" "$VITE_ANALYTICS_WEBSITE_ID"

# Stripe
add_env "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
add_env "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET"
add_env "VITE_STRIPE_PUBLISHABLE_KEY" "$VITE_STRIPE_PUBLISHABLE_KEY"

# Resend
add_env "RESEND_API_KEY" "$RESEND_API_KEY"

echo ""
echo "Done! Listing all env vars:"
vercel env ls
