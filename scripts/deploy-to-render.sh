#!/bin/bash

# Deploy to Render script
echo "🚀 Preparing to deploy Nutrivize V2 to Render..."

# Check if we have git
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "❌ Not in a git repository. Please run this script from the root of your git repository."
    exit 1
fi

# Get the current branch
current_branch=$(git branch --show-current)
echo "📝 Current branch: $current_branch"

# Prompt for confirmation
echo ""
echo "⚠️  This script will commit all changes and push to the current branch ($current_branch)."
echo "⚠️  This will trigger a deployment to Render."
echo ""
read -p "Do you want to continue? (y/n): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "📝 Uncommitted changes detected. Adding all changes..."
    git add .
    
    # Prompt for commit message
    echo ""
    read -p "Enter commit message: " commit_message
    
    if [[ -z "$commit_message" ]]; then
        commit_message="Deploy to Render $(date +'%Y-%m-%d %H:%M:%S')"
    fi
    
    # Commit changes
    echo "📝 Committing changes with message: $commit_message"
    git commit -m "$commit_message"
else
    echo "✅ No changes to commit."
fi

# Push to remote
echo "🚀 Pushing to remote origin/$current_branch..."
git push origin $current_branch

if [[ $? -eq 0 ]]; then
    echo "✅ Push successful!"
    echo ""
    echo "🔄 Render deployment triggered automatically."
    echo "🌐 Monitor your deployment at: https://dashboard.render.com/"
else
    echo "❌ Push failed. Please check your git configuration and try again."
    exit 1
fi

echo ""
echo "🎉 Deployment process completed!"
echo "⏳ Your changes will be live in a few minutes."
