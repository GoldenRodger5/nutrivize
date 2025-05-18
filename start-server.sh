#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Nutrivize Backend Server...${NC}"

# Kill any existing uvicorn processes
echo -e "${BLUE}Checking for existing servers...${NC}"
pkill -f "uvicorn app.main:app" || true
echo -e "${GREEN}Cleared any existing backend servers${NC}"

# Set port to 5001
echo -e "${BLUE}Setting port...${NC}"
mkdir -p backend
echo "5001" > "backend/port.txt"
echo -e "${GREEN}Port set to 5001${NC}"

# Start the FastAPI application directly with uvicorn
echo -e "${BLUE}Starting backend server with direct uvicorn command...${NC}"

# Change to the backend directory
cd backend || exit

# Start uvicorn with the specified options
echo -e "${YELLOW}Running uvicorn main:app --host 0.0.0.0 --port 5001${NC}"
export PYTHONPATH=$(pwd)
uvicorn app.main:app --host 0.0.0.0 --port 5001

echo -e "${GREEN}Server stopped.${NC}" 