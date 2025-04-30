#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if the --seed flag is provided
SEED_DB=false
for arg in "$@"; do
  if [ "$arg" == "--seed" ]; then
    SEED_DB=true
  fi
done

echo -e "${GREEN}Starting Nutrivize Application...${NC}"

# Project root directory
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Kill any existing uvicorn processes
echo -e "${BLUE}Checking for existing servers...${NC}"
pkill -f "uvicorn app.main:app" || true
echo -e "${GREEN}Cleared any existing backend servers${NC}"

# Set port to 5001 to match frontend .env configuration
echo -e "${BLUE}Setting backend port...${NC}"
echo "5001" > "$BACKEND_DIR/port.txt"
echo -e "${GREEN}Backend port set to 5001${NC}"

# Test MongoDB connection
echo -e "${BLUE}Testing MongoDB connection...${NC}"
cd "$BACKEND_DIR" || exit
PYTHONPATH=$BACKEND_DIR python test_mongodb.py
if [ $? -ne 0 ]; then
    echo -e "${RED}MongoDB connection failed. Please check your credentials and try again.${NC}"
    exit 1
fi

# Seed the database with mock data only if --seed flag was provided
if [ "$SEED_DB" = true ]; then
    echo -e "${BLUE}Seeding database with mock data...${NC}"
    PYTHONPATH=$BACKEND_DIR python -m app.seed_mock_data
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}Warning: Could not seed database. Application may not have sample data.${NC}"
    fi
else
    echo -e "${BLUE}Initializing MongoDB connection...${NC}"
    # Use the new initialization script that doesn't reset data
    PYTHONPATH=$BACKEND_DIR python init_nutrivize.py
    echo -e "${YELLOW}Skipping database seeding. Use --seed flag to reset with sample data.${NC}"
fi

# Start the backend server
echo -e "${BLUE}Starting backend server...${NC}"
osascript -e "tell application \"Terminal\" to do script \"cd $BACKEND_DIR && export PYTHONPATH=$BACKEND_DIR && uvicorn app.main:app --reload --port 5001\""

# Wait a moment for backend server to initialize
echo -e "${BLUE}Waiting for backend server to initialize...${NC}"
sleep 3

# Start the frontend server
echo -e "${BLUE}Starting frontend server...${NC}"
cd "$FRONTEND_DIR" || exit
osascript -e "tell application \"Terminal\" to do script \"cd $FRONTEND_DIR && npm run dev\""

echo -e "${YELLOW}Both servers are starting...${NC}"
echo -e "${GREEN}Frontend will be available at: ${BLUE}http://localhost:3000${NC}"
echo -e "${GREEN}Backend will be available at: ${BLUE}http://127.0.0.1:5001${NC}"
echo -e "${YELLOW}Press Ctrl+C in each Terminal window to stop the servers when done.${NC}"
