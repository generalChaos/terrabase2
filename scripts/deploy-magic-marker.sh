#!/bin/bash

# Deploy Magic Marker to Vercel
# This script handles conditional deployment based on file changes

set -e

echo "🚀 Deploying Magic Marker..."

# Check if we're in the right directory
if [ ! -f "turbo.json" ]; then
    echo "❌ Error: Please run this script from the project root"
    exit 1
fi

# Check if magic-marker app exists
if [ ! -d "apps/magic-marker" ]; then
    echo "❌ Error: Magic Marker app not found"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Error: Vercel CLI not found. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

# Check for required environment variables
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Error: VERCEL_TOKEN environment variable not set"
    exit 1
fi

if [ -z "$VERCEL_ORG_ID" ]; then
    echo "❌ Error: VERCEL_ORG_ID environment variable not set"
    exit 1
fi

if [ -z "$VERCEL_PROJECT_ID" ]; then
    echo "❌ Error: VERCEL_PROJECT_ID environment variable not set"
    exit 1
fi

echo "📦 Building Magic Marker..."
npx turbo build --filter=@tb2/magic-marker-web

echo "🚀 Deploying to Vercel..."
cd apps/magic-marker/web

# Deploy to Vercel
vercel --token $VERCEL_TOKEN --prod --yes

echo "✅ Magic Marker deployed successfully!"
echo "🌐 Check your Vercel dashboard for the deployment URL"
