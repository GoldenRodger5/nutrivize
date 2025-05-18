#!/bin/bash

# Test authentication endpoints with curl
BASE_URL="http://127.0.0.1:5001"
TOKEN=""
USER_ID=""

# Colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Authentication API Endpoint Tests${NC}"
echo "========================================"

# Test login endpoint
test_login() {
  local email=$1
  local password=$2
  
  echo -e "\n${YELLOW}Testing Login: ${email}${NC}"
  echo "----------------------------------------"
  
  local response=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${password}\"}")
  
  echo "Login response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  
  # Extract token and user ID
  local token=$(echo "$response" | jq -r '.token')
  local uid=$(echo "$response" | jq -r '.uid')
  
  if [ "$token" != "null" ] && [ "$token" != "" ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    echo "Token: ${token:0:15}..."
    echo "User ID: $uid"
    TOKEN=$token
    USER_ID=$uid
    return 0
  else
    echo -e "${RED}✗ Login failed${NC}"
    return 1
  fi
}

# Test token verification with /auth/me endpoint
test_me() {
  echo -e "\n${YELLOW}Testing Token Verification (/auth/me)${NC}"
  echo "----------------------------------------"
  
  if [ -z "$TOKEN" ]; then
    echo -e "${RED}No token available, skipping test${NC}"
    return 1
  fi
  
  local response=$(curl -s -X GET "${BASE_URL}/auth/me" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
  
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  
  local uid=$(echo "$response" | jq -r '.uid')
  
  if [ "$uid" != "null" ] && [ "$uid" != "" ]; then
    echo -e "${GREEN}✓ Token verification successful${NC}"
    return 0
  else
    echo -e "${RED}✗ Token verification failed${NC}"
    return 1
  fi
}

# Test direct Firebase login (endpoint doesn't exist in backend but useful for client-side)
test_direct_firebase_login() {
  echo -e "\n${YELLOW}Testing Direct Firebase Login (client-side)${NC}"
  echo "This would be handled in the frontend with Firebase SDK"
}

# Test with invalid credentials
test_invalid_login() {
  local email=$1
  local password=$2
  
  echo -e "\n${YELLOW}Testing Invalid Login: ${email}${NC}"
  echo "----------------------------------------"
  
  local response=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${password}\"}")
  
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  
  # Check for error message
  local detail=$(echo "$response" | jq -r '.detail')
  
  if [[ "$detail" == *"Invalid credentials"* || "$detail" == *"Login failed"* ]]; then
    echo -e "${GREEN}✓ Invalid login correctly rejected${NC}"
    return 0
  else
    echo -e "${RED}✗ Test failed - invalid login was not properly rejected${NC}"
    return 1
  fi
}

# Test with missing required fields
test_incomplete_login() {
  echo -e "\n${YELLOW}Testing Login with Missing Fields${NC}"
  echo "----------------------------------------"
  
  local response=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test@example.com\"}")
  
  echo "Response (missing password):"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  
  response=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"password\":\"password123\"}")
  
  echo "Response (missing email):"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Test token expiration behavior (this would simulate using an expired token)
test_expired_token() {
  echo -e "\n${YELLOW}Testing with Expired Token (simulated)${NC}"
  echo "----------------------------------------"
  
  # This is a fake expired JWT token - actual tokens will have different format and claims
  local expired_token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
  
  local response=$(curl -s -X GET "${BASE_URL}/auth/me" \
    -H "Authorization: Bearer ${expired_token}" \
    -H "Content-Type: application/json")
  
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  
  # Check for error message related to token expiration
  local detail=$(echo "$response" | jq -r '.detail')
  
  if [[ "$detail" == *"Invalid token"* || "$detail" == *"expired"* || "$detail" == *"verification failed"* ]]; then
    echo -e "${GREEN}✓ Expired token correctly rejected${NC}"
    return 0
  else
    echo -e "${RED}✗ Test failed - expired token was not properly handled${NC}"
    return 1
  fi
}

# Run tests
echo -e "\n${YELLOW}1. Testing Successful Login${NC}"
test_login "test@example.com" "testpassword123"

if [ $? -eq 0 ]; then
  echo -e "\n${YELLOW}2. Testing Token Verification${NC}"
  test_me
fi

echo -e "\n${YELLOW}3. Testing Login with Invalid Credentials${NC}"
test_invalid_login "wrong@example.com" "wrongpassword"

echo -e "\n${YELLOW}4. Testing Login with Missing Fields${NC}"
test_incomplete_login

echo -e "\n${YELLOW}5. Testing with Expired Token${NC}"
test_expired_token

echo -e "\n${YELLOW}Authentication API Tests Completed${NC}" 