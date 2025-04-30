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

# 1. Register a new user (may fail if user already exists, which is fine for testing)
echo -e "\n${YELLOW}Testing /auth/register endpoint (POST)${NC}"
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test User\"}" \
  | jq
check_status

# 2. Login with the test user
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
  exit 1
fi

# 3. Get user profile
echo -e "\n${YELLOW}Testing /auth/me endpoint (GET)${NC}"
USER_ID=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '._id')

if [ "$USER_ID" != "null" ] && [ -n "$USER_ID" ]; then
  echo -e "${GREEN}✓ Successfully retrieved user ID: $USER_ID${NC}"
else
  echo -e "${RED}✗ Failed to retrieve user ID${NC}"
fi

# 4. Update user profile
echo -e "\n${YELLOW}Testing /auth/update-profile endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/auth/update-profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Updated Test User\",\"email\":\"$TEST_EMAIL\"}" \
  | jq
check_status

# 5. Test password reset request (skipping actual email verification)
echo -e "\n${YELLOW}Testing /auth/reset-password-request endpoint (POST)${NC}"
curl -s -X POST "$API_URL/auth/reset-password-request" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}" \
  | jq
check_status

# 6. Log out
echo -e "\n${YELLOW}Testing /auth/logout endpoint (POST)${NC}"
curl -s -X POST "$API_URL/auth/logout" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${GREEN}=== Authentication Tests Completed ====${NC}" 