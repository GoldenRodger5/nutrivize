#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set the API base URL
API_URL="http://localhost:5001"

# Get user credentials if not provided
if [ -z "$1" ] || [ -z "$2" ]; then
  echo -e "${YELLOW}Please enter valid Firebase credentials${NC}"
  read -p "Email: " USER_EMAIL
  read -s -p "Password: " USER_PASSWORD
  echo ""
else
  USER_EMAIL=$1
  USER_PASSWORD=$2
fi

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

# 2. Login with the provided credentials
echo -e "\n${YELLOW}Testing /auth/login endpoint (POST)${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

echo "$LOGIN_RESPONSE" | jq

# Extract token from response - the API returns it in the "token" field, not "access_token"
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Successfully obtained token${NC}"
  echo "Token: ${TOKEN:0:20}..."
else
  echo -e "${RED}✗ Failed to obtain token${NC}"
  echo "Cannot continue with authenticated endpoints. Please check credentials."
  # Continue with non-authenticated tests
  echo -e "\n${YELLOW}Testing /debug/ping endpoint (GET)${NC}"
  curl -s $API_URL/debug/ping | jq
  check_status
  echo -e "\n${GREEN}=== Authentication Tests Completed ====${NC}"
  exit 1
fi

# 3. Get user profile with token
echo -e "\n${YELLOW}Testing /auth/me endpoint (GET)${NC}"
USER_INFO=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "$USER_INFO" | jq
check_status

# 4. Test authenticated foods endpoint
echo -e "\n${YELLOW}Testing /foods/ endpoint with authentication (GET)${NC}"
curl -s -X GET "$API_URL/foods/" \
  -H "Authorization: Bearer $TOKEN" | jq
check_status

# 5. Test authenticated goals endpoint
echo -e "\n${YELLOW}Testing /goals/ endpoint with authentication (GET)${NC}"
curl -s -X GET "$API_URL/goals/" \
  -H "Authorization: Bearer $TOKEN" | jq
check_status

# 6. Test authenticated goals active endpoint
echo -e "\n${YELLOW}Testing /goals/active endpoint with authentication (GET)${NC}"
curl -s -X GET "$API_URL/goals/active" \
  -H "Authorization: Bearer $TOKEN" | jq
check_status

# Test debug endpoints that don't require authentication
echo -e "\n${YELLOW}Testing /debug/ping endpoint (GET)${NC}"
curl -s $API_URL/debug/ping | jq
check_status

echo -e "\n${GREEN}=== Authentication Tests Completed ====${NC}" 