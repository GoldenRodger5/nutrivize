#!/bin/bash

# CORS Fix Deployment Script for Nutrivize V2
# Created: July 3, 2025

echo "🚀 Deploying CORS fixes to Nutrivize backend..."
echo

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git and try again."
    exit 1
fi

# Make sure we're in the project directory
cd "$(dirname "$0")" || exit 1

# Check if there are any uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 Committing CORS fixes..."
    git add backend/app/main.py
    git commit -m "Fix CORS configuration for Render deployment"
fi

# Push to remote repository if it exists
if git remote -v | grep -q origin; then
    echo "🔄 Pushing changes to remote repository..."
    git push origin "$(git rev-parse --abbrev-ref HEAD)" || {
        echo "⚠️ Warning: Could not push to remote repository."
        echo "   You may need to push manually: git push origin $(git rev-parse --abbrev-ref HEAD)"
    }
else
    echo "ℹ️ No remote repository found. Skipping push."
fi

echo
echo "✅ CORS fix deployment complete!"
echo
echo "The CORS configuration has been updated to allow requests from all Render domains."
echo "If you're using Render for deployment, the changes will be applied automatically"
echo "on the next deployment or you can trigger a manual deployment from the Render dashboard."
echo
echo "🌐 Make sure the environment variable CORS_ALLOW_ORIGINS includes your frontend URL:"
echo "   https://nutrivize-frontend.onrender.com"
echo
echo "🔄 To test the changes, try accessing the food log page again."

# Make the script executable
chmod +x "$(basename "$0")"
