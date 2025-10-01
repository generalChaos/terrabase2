#!/bin/bash

# Deploy Image Processor to Railway
# This script checks if changes were made to the image-processor app
# and only triggers deployment if necessary

set -e

echo "🚀 Checking if image-processor needs deployment..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Not in a git repository"
  exit 1
fi

# Get the last commit hash
LAST_COMMIT=$(git rev-parse HEAD)
echo "📝 Current commit: $LAST_COMMIT"

# Check if any files in apps/image-processor/ have changed
if git diff --quiet HEAD~1 HEAD -- apps/image-processor/; then
  echo "✅ No changes detected in apps/image-processor/"
  echo "⏭️  Skipping deployment"
  exit 0
else
  echo "🔄 Changes detected in apps/image-processor/"
  echo "🚀 Proceeding with deployment..."
  
  # List the changed files
  echo "📋 Changed files:"
  git diff --name-only HEAD~1 HEAD -- apps/image-processor/
  
  # Push to trigger Railway deployment
  echo "📤 Pushing changes to trigger Railway deployment..."
  git push origin HEAD
fi
