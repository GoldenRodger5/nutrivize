#!/bin/bash

# CORS and AI Endpoints Fix Script for Nutrivize V2
# Created: July 3, 2025

echo "🚀 Deploying CORS and AI endpoint fixes to Nutrivize backend..."
echo

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git and try again."
    exit 1
fi

# Make sure we're in the project directory
cd "$(dirname "$0")" || exit 1

echo "📝 Applying fixes to main.py..."
git add backend/app/main.py

echo "📝 Applying fixes to AI routes..."
git add backend/app/routes/ai.py

echo "💾 Committing changes..."
git commit -m "Fix CORS for AI endpoints, especially meal-suggestions"

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
echo "✅ CORS and AI endpoint fix deployment complete!"
echo
echo "The CORS configuration has been updated to specifically handle AI endpoints."
echo "If you're using Render for deployment, the changes will be applied automatically"
echo "on the next deployment or you can trigger a manual deployment from the Render dashboard."

# Make the script executable
chmod +x "$(basename "$0")"
