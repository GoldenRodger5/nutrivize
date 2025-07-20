#!/bin/bash

# Nutrivize Deployment Fixes Script
# This script fixes common deployment issues on Render.com

echo "🔧 Running deployment fixes for Nutrivize v2..."

# 1. Fix CORS issues by updating the backend environment
echo "📝 Setting CORS_ALLOW_ORIGINS environment variable on backend..."
curl -X PATCH \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key":"CORS_ALLOW_ORIGINS", "value":"https://nutrivize-frontend.onrender.com"}' \
  "https://api.render.com/v1/services/$BACKEND_SERVICE_ID/env-vars"

# 2. Set FRONTEND_URL properly
echo "📝 Setting FRONTEND_URL environment variable on backend..."
curl -X PATCH \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key":"FRONTEND_URL", "value":"https://nutrivize-frontend.onrender.com"}' \
  "https://api.render.com/v1/services/$BACKEND_SERVICE_ID/env-vars"

# 3. Set BACKEND_URL properly on frontend
echo "📝 Setting VITE_API_BASE_URL environment variable on frontend..."
curl -X PATCH \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key":"VITE_API_BASE_URL", "value":"https://nutrivize.onrender.com"}' \
  "https://api.render.com/v1/services/$FRONTEND_SERVICE_ID/env-vars"

echo "✅ Environment variables updated! The services will rebuild automatically."
echo "⏱️  Please wait 5-10 minutes for the changes to take effect."
echo ""
echo "To use this script, first set these environment variables:"
echo "export RENDER_API_KEY=your_render_api_key"
echo "export BACKEND_SERVICE_ID=your_backend_service_id"
echo "export FRONTEND_SERVICE_ID=your_frontend_service_id"
echo ""
echo "You can find your service IDs in the Render dashboard URL when viewing a service."
