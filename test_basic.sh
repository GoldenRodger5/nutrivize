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

echo -e "${BLUE}=== Nutrivize Basic Endpoint Tests ====${NC}"

# 1. Check API root
echo -e "\n${YELLOW}Testing / endpoint (GET)${NC}"
curl -s $API_URL/ | jq
check_status

# 2. Check database status
echo -e "\n${YELLOW}Testing debug database status endpoint (GET)${NC}"
curl -s $API_URL/debug/db-status | jq
check_status

# 3. Test ping endpoint
echo -e "\n${YELLOW}Testing /debug/ping endpoint (GET)${NC}"
curl -s $API_URL/debug/ping | jq
check_status

# 4. Check debug foods endpoint (public data)
echo -e "\n${YELLOW}Testing /debug/foods endpoint (GET)${NC}"
curl -s $API_URL/debug/foods | jq
check_status

# 5. Check debug goals endpoint (public data)
echo -e "\n${YELLOW}Testing /debug/goals endpoint (GET)${NC}"
curl -s $API_URL/debug/goals | jq
check_status

# 6. Check debug logs endpoint (public data)
echo -e "\n${YELLOW}Testing /debug/logs endpoint (GET)${NC}"
curl -s $API_URL/debug/logs | jq
check_status

# 7. Test exception handling
echo -e "\n${YELLOW}Testing /debug/exception-test endpoint (GET)${NC}"
curl -s $API_URL/debug/exception-test | jq
check_status

echo -e "\n${GREEN}=== Basic Tests Completed ====${NC}" 