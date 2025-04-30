#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set the API base URL
API_URL="http://localhost:5001"

# Set test user credentials
TEST_EMAIL="test@example.com"
TEST_PASSWORD="password123"

# Function to check if a command succeeded
check_status() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Success${NC}"
  else
    echo -e "${RED}✗ Failed${NC}"
  fi
}

echo -e "${BLUE}=== Nutrivize Authentication Tests ====${NC}"

# 0. Check API status
echo -e "\n${YELLOW}Testing / endpoint (GET)${NC}"
curl -s $API_URL/ | jq
check_status

# 1. Check database status
echo -e "\n${YELLOW}Testing debug database status endpoint (GET)${NC}"
curl -s $API_URL/debug/db-status | jq
check_status

# 2. Register a new user (may fail if user already exists, which is fine for testing)
echo -e "\n${YELLOW}Testing /auth/register endpoint (POST)${NC}"
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test User\"}" \
  | jq
check_status

# 3. Login with the test user
echo -e "\n${YELLOW}Testing /auth/login endpoint (POST)${NC}"
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  | jq -r '.access_token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Successfully obtained token${NC}"
  echo "Token: ${TOKEN:0:20}..."
else
  echo -e "${RED}✗ Failed to obtain token${NC}"
  echo "Will try to continue with other tests that don't require authentication"
fi

# 4. Get user profile (if we have a token)
if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "\n${YELLOW}Testing /auth/me endpoint (GET)${NC}"
  curl -s -X GET "$API_URL/auth/me" \
    -H "Authorization: Bearer $TOKEN" \
    | jq
  check_status
fi

# Test some debug endpoints that don't require authentication
echo -e "\n${YELLOW}Testing /debug/ping endpoint (GET)${NC}"
curl -s $API_URL/debug/ping | jq
check_status

echo -e "\n${GREEN}=== Authentication Tests Completed ====${NC}" 