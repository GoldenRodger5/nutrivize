#!/bin/bash

# Render start script for Nutrivize backend

set -e

echo "🚀 Starting Nutrivize backend server..."

# Start the application with gunicorn and uvicorn workers  
exec gunicorn app.main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers 4 \
    --bind 0.0.0.0:$PORT \
    --timeout 120 \
    --graceful-timeout 120 \
    --keep-alive 5 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --preload \
    --access-logfile - \
    --error-logfile -
