#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set the API base URL
API_URL="http://localhost:5001"

# Function to check if a command succeeded
check_status() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Success${NC}"
  else
    echo -e "${RED}✗ Failed${NC}"
  fi
}

echo -e "${BLUE}=== Nutrivize System Status Tests ====${NC}"

# 1. Test system status endpoint
echo -e "\n${YELLOW}Testing /status endpoint (GET)${NC}"
curl -s $API_URL/status | jq
check_status

# 2. Test database status endpoint
echo -e "\n${YELLOW}Testing /status/database endpoint (GET)${NC}"
curl -s $API_URL/status/database | jq
check_status

# 3. Test AI Service status endpoint
echo -e "\n${YELLOW}Testing /status/ai-service endpoint (GET)${NC}"
curl -s $API_URL/status/ai-service | jq
check_status

# 4. Test version endpoint
echo -e "\n${YELLOW}Testing /version endpoint (GET)${NC}"
curl -s $API_URL/version | jq
check_status

# 5. Test service health endpoint
echo -e "\n${YELLOW}Testing /health endpoint (GET)${NC}"
curl -s $API_URL/health | jq
check_status

echo -e "\n${GREEN}=== System Status Tests Completed ====${NC}" 