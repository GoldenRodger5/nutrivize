#!/bin/bash

# Render start script for Nutrivize backend

set -e

echo "🚀 Starting Nutrivize backend server..."

# Navigate to backend directory
cd backend

# Start the application with gunicorn
exec gunicorn app.main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers 4 \
    --bind 0.0.0.0:$PORT \
    --timeout 120 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --preload
