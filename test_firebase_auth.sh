#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set the API base URL
API_URL="http://localhost:5001"

# Test user credentials
TEST_EMAIL="testuser@example.com"
TEST_PASSWORD="password123"
TEST_NAME="Test User"

echo -e "${BLUE}=== Nutrivize Firebase Authentication Test ====${NC}"

# Step 1: Test server health
echo -e "\n${YELLOW}Step 1: Testing server health${NC}"
HEALTH_RESPONSE=$(curl -s $API_URL/ | jq -r '.message')
if [[ "$HEALTH_RESPONSE" == "Nutrivize API is running" ]]; then
  echo -e "${GREEN}✓ Server is running${NC}"
else
  echo -e "${RED}✗ Server check failed: ${HEALTH_RESPONSE}${NC}"
  echo "Please ensure the server is running on port 5001"
  exit 1
fi

# Step 2: Try to register a new user
echo -e "\n${YELLOW}Step 2: Testing user registration (may fail if user already exists)${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}")

echo "Register response:"
echo "$REGISTER_RESPONSE" | jq

# Step 3: Login with the test user
echo -e "\n${YELLOW}Step 3: Testing user login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "Login response:"
echo "$LOGIN_RESPONSE" | jq

# Check if login succeeded and we got a token
if echo "$LOGIN_RESPONSE" | jq -e '.token' > /dev/null 2>&1; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
  USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.uid')
  echo -e "${GREEN}✓ Login successful. Got token: ${TOKEN:0:15}...${NC}"
  echo -e "${GREEN}✓ User ID: ${USER_ID}${NC}"
else
  echo -e "${RED}✗ Login failed. No token received.${NC}"
  echo "Check server logs for more details."
  exit 1
fi

# Step 4: Verify token with /auth/me endpoint
echo -e "\n${YELLOW}Step 4: Verifying token with /auth/me endpoint${NC}"
ME_RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "Me response:"
echo "$ME_RESPONSE" | jq

# Check if /auth/me returned expected data
if echo "$ME_RESPONSE" | jq -e '.uid' > /dev/null 2>&1; then
  RETURNED_UID=$(echo "$ME_RESPONSE" | jq -r '.uid')
  if [[ "$RETURNED_UID" == "$USER_ID" ]]; then
    echo -e "${GREEN}✓ Token verification successful. User ID matches: ${RETURNED_UID}${NC}"
  else
    echo -e "${RED}✗ Token verification failed. User ID mismatch:${NC}"
    echo "Expected: $USER_ID"
    echo "Received: $RETURNED_UID"
  fi
else
  echo -e "${RED}✗ Token verification failed. No user data received.${NC}"
fi

# Step 5: Test user profile endpoint
echo -e "\n${YELLOW}Step 5: Testing user profile endpoint${NC}"
PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/user/profile" \
  -H "Authorization: Bearer $TOKEN")

echo "Profile response:"
echo "$PROFILE_RESPONSE" | jq

# Final check: Verify user profile access
if ! echo "$PROFILE_RESPONSE" | grep -q "detail.*Not authenticated"; then
  echo -e "${GREEN}✓ User profile access successful${NC}"
else
  echo -e "${RED}✗ User profile access failed. Authentication issue.${NC}"
fi

echo -e "\n${BLUE}=== Firebase Authentication Test Complete ====${NC}" 