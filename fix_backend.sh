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

echo -e "${BLUE}Fixing backend server and connection issues${NC}"

# Kill any existing uvicorn processes
echo -e "${YELLOW}Killing any existing backend processes...${NC}"
pkill -f "uvicorn app.main:app" || true
sleep 2

# Test MongoDB connection
echo -e "${BLUE}Testing MongoDB connection...${NC}"
cd "$BACKEND_DIR" || exit
PYTHONPATH=$BACKEND_DIR python test_mongodb.py

if [ $? -ne 0 ]; then
    echo -e "${RED}MongoDB connection failed. Please check your credentials and try again.${NC}"
    exit 1
fi

# Test Firebase authentication
echo -e "${BLUE}Testing Firebase authentication...${NC}"
PYTHONPATH=$BACKEND_DIR python test_login.py

if [ $? -ne 0 ]; then
    echo -e "${RED}Firebase authentication failed. Please check your credentials and try again.${NC}"
    exit 1
fi

# Start the backend server
echo -e "${BLUE}Starting backend server with proper configuration...${NC}"
cd "$PROJECT_DIR" || exit

# Start the backend server in a new terminal window
osascript -e "tell application \"Terminal\" to do script \"cd $BACKEND_DIR && export PYTHONPATH=$BACKEND_DIR && uvicorn app.main:app --reload --host 0.0.0.0 --port 5001 --log-level debug\""

echo -e "${GREEN}Backend server starting in a new terminal window.${NC}"
echo -e "${YELLOW}Please wait a few seconds for it to initialize...${NC}"

sleep 5

# Test if the server is running
echo -e "${BLUE}Testing if server is running...${NC}"
curl -s http://localhost:5001/ > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Server is running successfully!${NC}"
else
    echo -e "${YELLOW}Server may not be fully initialized yet. Wait a few more seconds and try accessing it.${NC}"
fi

echo -e "${GREEN}You can now log in using the test user credentials:${NC}"
echo -e "${BLUE}Email:${NC} test@example.com"
echo -e "${BLUE}Password:${NC} testpassword123"
echo -e "${YELLOW}Open http://localhost:3000 in your browser to access the frontend.${NC}" 