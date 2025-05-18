#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set the API base URL
API_URL="http://localhost:5001"

# Store token for authenticated requests
TOKEN=""

# Function to check if a command succeeded
check_status() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Success${NC}"
  else
    echo -e "${RED}✗ Failed${NC}"
  fi
}

echo -e "${BLUE}=== Nutrivize API Testing Script ====${NC}"

# 1. Test API health
echo -e "\n${YELLOW}Testing API root endpoint (GET /)${NC}"
curl -s $API_URL/ | jq
check_status

# 2. Try to register a user (this may fail if Firebase auth is not set up)
echo -e "\n${YELLOW}Testing user registration (POST /auth/register)${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}')

echo "$REGISTER_RESPONSE" | jq
check_status

# 3. Try to login (this may also fail if Firebase auth is not set up)
echo -e "\n${YELLOW}Testing user login (POST /auth/login)${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

echo "$LOGIN_RESPONSE" | jq

# Extract token if login was successful
if echo "$LOGIN_RESPONSE" | grep -q "token"; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
  echo -e "${GREEN}✓ Successfully obtained token: ${TOKEN:0:15}...${NC}"
else
  echo -e "${YELLOW}⚠ Unable to get token, will proceed with unauthenticated tests${NC}"
fi

# 4. Test authenticated endpoints if we have a token
if [ -n "$TOKEN" ]; then
  echo -e "\n${YELLOW}Testing user profile (GET /auth/me)${NC}"
  curl -s -X GET "$API_URL/auth/me" \
    -H "Authorization: Bearer $TOKEN" | jq
  check_status
  
  echo -e "\n${YELLOW}Testing user profile (GET /user/profile)${NC}"
  curl -s -X GET "$API_URL/user/profile" \
    -H "Authorization: Bearer $TOKEN" | jq
  check_status
fi

# 5. Test food endpoints (these might work even without authentication)
echo -e "\n${YELLOW}Testing food search (GET /foods/)${NC}"
FOODS_HEADER=""
if [ -n "$TOKEN" ]; then
  FOODS_HEADER="-H \"Authorization: Bearer $TOKEN\""
fi

eval "curl -s -X GET \"$API_URL/foods/?query=apple\" $FOODS_HEADER" | jq
check_status

# 6. Test logs endpoint (also might require authentication)
if [ -n "$TOKEN" ]; then
  echo -e "\n${YELLOW}Testing food logs (GET /logs)${NC}"
  TODAY=$(date +%Y-%m-%d)
  curl -s -X GET "$API_URL/logs?user_id=test_user&date=$TODAY" \
    -H "Authorization: Bearer $TOKEN" | jq
  check_status
fi

# 7. Test health metrics endpoint
echo -e "\n${YELLOW}Testing health metrics endpoint (GET /health)${NC}"
curl -s -X GET "$API_URL/health" | jq
check_status

echo -e "\n${GREEN}=== API Testing Completed ====${NC}"
echo -e "Note: Some tests may have failed due to authentication requirements\nor server configuration."
