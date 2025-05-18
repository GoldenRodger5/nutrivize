#!/bin/bash

# Test script for goal-related API functionality
# This tests the enhanced AI chatbot's ability to handle goal-related queries

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL for the API
BASE_URL="http://localhost:5001"

# Verify server is running
echo -e "${BLUE}Verifying server is running...${NC}"
SERVER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/ || echo "Failed")

if [[ "$SERVER_RESPONSE" == "Failed" ]]; then
  echo -e "${RED}Server is not responding. Cannot connect to $BASE_URL${NC}"
  exit 1
elif [[ "$SERVER_RESPONSE" != "200" && "$SERVER_RESPONSE" != "404" ]]; then
  echo -e "${RED}Server is responding with unexpected status code: $SERVER_RESPONSE${NC}"
  exit 1
fi

echo -e "${GREEN}Server is responding. Status code: $SERVER_RESPONSE${NC}"

# Login to get an authentication token
echo -e "${BLUE}Logging in to get authentication token...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}')

echo -e "${BLUE}Login response: $LOGIN_RESPONSE${NC}"

# Extract the token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Failed to get authentication token.${NC}"
  echo -e "${RED}Response was: $LOGIN_RESPONSE${NC}"
  
  # Try with alternative credentials that might be set up in the test environment
  echo -e "${BLUE}Trying alternative credentials...${NC}"
  LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "user@example.com", "password": "password"}')
  
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed with alternative credentials as well.${NC}"
    echo -e "${RED}Please check your server configuration and credentials.${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}Successfully obtained authentication token.${NC}"

# Function to test a goal-related query
test_goal_query() {
  QUERY="$1"
  EXPECTED_PATTERN="$2"
  DESCRIPTION="$3"
  
  echo -e "${BLUE}Testing: ${DESCRIPTION}${NC}"
  
  RESPONSE=$(curl -s -X POST "${BASE_URL}/api/chat" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"messages\": [{\"role\": \"user\", \"content\": \"$QUERY\"}], \"fetch_context\": true}")
  
  # Print the response for debugging
  echo -e "${BLUE}Response received (truncated):${NC} ${RESPONSE:0:100}..."
  
  # Check if response contains the expected pattern
  if echo "$RESPONSE" | grep -q "$EXPECTED_PATTERN"; then
    echo -e "${GREEN}✓ Test passed: Response contains expected content${NC}"
  else
    echo -e "${RED}✗ Test failed: Response does not contain expected content${NC}"
    echo "Full response: $RESPONSE"
  fi
  
  # Add a small delay between requests
  sleep 1
}

# Test various goal-related queries
test_goal_query "Show me my current goal" "Goal" "Retrieving current goal information"
test_goal_query "How am I doing with my goals?" "progress" "Checking goal progress"
test_goal_query "Can you suggest adjustments to my goal?" "adjustments" "Getting goal adjustment suggestions"
test_goal_query "What's my weight progress like?" "Weight" "Checking weight progress"
test_goal_query "How many calories should I eat based on my goal?" "calories" "Checking calorie target"

echo -e "${BLUE}All goal-related function tests completed.${NC}" 