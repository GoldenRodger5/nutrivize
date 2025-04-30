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
TEST_EMAIL="test@example.com"
TEST_PASSWORD="testpassword123"

# Function to check if a command succeeded
check_status() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Success${NC}"
  else
    echo -e "${RED}✗ Failed${NC}"
  fi
}

echo -e "${BLUE}=== Nutrivize Meal Features Tests ====${NC}"

# 1. Login to get an auth token
echo -e "\n${YELLOW}Authenticating test user${NC}"
AUTH_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

# Extract the token and user ID
TOKEN=$(echo $AUTH_RESPONSE | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}Authentication failed. Cannot continue tests.${NC}"
  exit 1
fi

echo -e "${GREEN}Authentication successful. Token received.${NC}"

# Set auth header for subsequent requests
AUTH_HEADER="Authorization: Bearer $TOKEN"

# Get user ID
echo -e "\n${YELLOW}Getting user ID${NC}"
USER_PROFILE=$(curl -s -H "$AUTH_HEADER" $API_URL/auth/me)
USER_ID=$(echo $USER_PROFILE | jq -r '.uid')

if [ -z "$USER_ID" ] || [ "$USER_ID" = "null" ]; then
  echo -e "${RED}Failed to get user ID. Cannot continue tests.${NC}"
  exit 1
fi

echo -e "${GREEN}User ID: $USER_ID${NC}"

# 2. Test meal suggestions
echo -e "\n${YELLOW}Testing /suggest-meal endpoint (POST)${NC}"
SUGGESTION_RESPONSE=$(curl -s -X POST \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"meal_type\": \"lunch\",
    \"time_of_day\": \"12:00\",
    \"preferences\": [\"high-protein\"],
    \"excluded_foods\": [],
    \"preferred_ingredients\": [\"chicken\", \"rice\"],
    \"max_calories\": 600,
    \"remaining_macros\": {
      \"calories\": 1500,
      \"proteins\": 100,
      \"carbs\": 150,
      \"fats\": 50,
      \"protein\": 100,
      \"fat\": 50
    }
  }" \
  $API_URL/suggest-meal)

echo $SUGGESTION_RESPONSE | jq
check_status

# 3. Test meal plan generation
echo -e "\n${YELLOW}Testing /generate-meal-plan endpoint (POST)${NC}"
PLAN_RESPONSE=$(curl -s -X POST \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"days\": 1,
    \"preferences\": {
      \"dietary\": [\"high-protein\"],
      \"meal_types\": [\"breakfast\", \"lunch\", \"dinner\"]
    },
    \"excluded_foods\": [],
    \"calories_per_day\": 2000,
    \"daily_targets\": {
      \"calories\": 2000,
      \"proteins\": 150,
      \"protein\": 150,
      \"carbs\": 200,
      \"fats\": 65,
      \"fat\": 65
    }
  }" \
  $API_URL/generate-meal-plan)

echo $PLAN_RESPONSE | jq
PLAN_ID=$(echo $PLAN_RESPONSE | jq -r '.id')

# 4. Test getting active meal plan
echo -e "\n${YELLOW}Testing /meal-plans/active endpoint (GET)${NC}"
curl -s -H "$AUTH_HEADER" $API_URL/meal-plans/active | jq
check_status

# 5. Test getting all meal plans
echo -e "\n${YELLOW}Testing /meal-plans/all endpoint (GET)${NC}"
curl -s -H "$AUTH_HEADER" $API_URL/meal-plans/all | jq
check_status

# 6. Test getting regular meal plans
echo -e "\n${YELLOW}Testing /meal-plans endpoint (GET)${NC}"
curl -s -H "$AUTH_HEADER" $API_URL/meal-plans | jq
check_status

# 7. Test chatbot
echo -e "\n${YELLOW}Testing /api/chat endpoint (POST)${NC}"
curl -s -X POST \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "{
    \"messages\": [
      {
        \"role\": \"user\",
        \"content\": \"What are some high protein foods?\"
      }
    ],
    \"fetch_context\": true,
    \"user_id\": \"$USER_ID\"
  }" \
  $API_URL/api/chat | jq
check_status

echo -e "\n${GREEN}=== Meal Features Tests Completed ====${NC}" 