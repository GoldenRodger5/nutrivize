#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$PROJECT_DIR/backend"

echo -e "${BLUE}Running backend server in debug mode${NC}"

# Kill any existing uvicorn processes
echo -e "${YELLOW}Killing any existing backend processes...${NC}"
pkill -f "uvicorn app.main:app" || true
sleep 2

# Set environment variables
export PYTHONPATH="$BACKEND_DIR"
export LOG_LEVEL="debug"
export PORT=5001

# Change to backend directory
cd "$BACKEND_DIR" || exit

echo -e "${YELLOW}Starting server in current terminal window with debug output...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server when done testing.${NC}"

# Run the server directly in this terminal for debug output
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port $PORT --log-level $LOG_LEVEL 