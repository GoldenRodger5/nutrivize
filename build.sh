#!/bin/bash

# Render build script for Nutrivize backend

set -e

echo "🚀 Starting Nutrivize backend build..."

# Navigate to backend directory
cd backend

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install --no-cache-dir -r requirements.txt

echo "✅ Build completed successfully!"
