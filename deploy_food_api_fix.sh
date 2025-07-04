#!/bin/bash

# Deploy API fixes for Nutrivize
# This script addresses the 405 error with the /foods endpoint and ensures proper data separation

echo "🚀 Deploying API fixes for Nutrivize..."

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Verify git status
echo "📋 Checking git status..."
if ! git diff --quiet; then
    echo "⚠️  You have uncommitted changes. Consider committing before deployment."
    read -p "Continue anyway? (y/n): " confirm
    if [[ $confirm != "y" ]]; then
        echo "Deployment canceled."
        exit 1
    fi
fi

# Run backend tests to verify fixes
echo "🧪 Running food API test..."
python test_food_api.py http://localhost:8000

# Proceed with deployment
echo "📤 Pushing changes to Render deployment..."
git push origin main

echo "🔍 Checking deployment status..."
echo "Visit https://dashboard.render.com to monitor the deployment progress."

echo "✅ Deployment script completed."
echo "NOTE: The changes should be automatically deployed to Render."
echo "After deployment, verify the fix by visiting: https://nutrivize.onrender.com/food-index"
