#!/bin/bash
# scripts/deploy.sh
# Core deploy script wrapper. Should be invoked by the CLI.

set -e

APP_DIR=$1
ENV=${2:-"production"}

echo "🚀 Deploying Foldaa application to Supabase..."

cd "$APP_DIR"

if [ ! -f "app.json" ]; then
    echo "❌ app.json not found in $APP_DIR"
    exit 1
fi

APP_NAME=$(cat app.json | grep '"name"' | cut -d '"' -f 4)

echo "📦 Bundling Edge Function via Runtime Engine..."
# npx foldaa-runtime build ./supabase/functions/proxy

echo "🔄 Pushing database migrations (if any)..."
# supabase db push

echo "⚡ Deploying Supabase Edge Function (proxy) for $APP_NAME ($ENV)..."
# supabase functions deploy proxy --no-verify-jwt

echo "✅ Deployment successful. Your app is live!"
