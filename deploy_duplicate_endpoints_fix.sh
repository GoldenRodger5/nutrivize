#!/bin/bash

# Script to deploy the duplicate endpoints fix

echo "===== Deploying duplicate endpoints fix ====="

# Check if we're in the right directory
if [[ ! -d backend/app/routes ]]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Create backup of files before modifying
echo "Creating backups..."
cp backend/app/routes/ai_health.py backend/app/routes/ai_health.py.bak

# Deploy the changes
echo "Deploying changes to AI health endpoints..."
git add backend/app/routes/ai_health.py DUPLICATE_ENDPOINTS_FIX.md

echo "===== Fix deployed successfully ====="
echo "Changes made:"
echo "1. Renamed '/ai-health/health-score' endpoint to '/ai-health/health-score-analysis'"
echo "2. Created documentation file DUPLICATE_ENDPOINTS_FIX.md"
echo ""
echo "Next steps:"
echo "1. Commit and push these changes"
echo "2. Deploy to your hosting provider"
echo "3. Update any frontend code that might be using the renamed endpoint"
