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

echo -e "${BLUE}=== Nutrivize API Test ====${NC}"

# 1. Test the root endpoint (no auth required)
echo -e "\n${YELLOW}Testing root endpoint${NC}"
curl -s $API_URL/ | jq
check_status

# 2. Login to get an auth token
echo -e "\n${YELLOW}Authenticating test user${NC}"
AUTH_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo $AUTH_RESPONSE | jq

# Extract the token
TOKEN=$(echo $AUTH_RESPONSE | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}Authentication failed. Cannot continue tests.${NC}"
  exit 1
fi

echo -e "${GREEN}Authentication successful. Token received.${NC}"

# Set auth header for subsequent requests
AUTH_HEADER="Authorization: Bearer $TOKEN"

# Extract user ID from the profile
echo -e "\n${YELLOW}Getting user ID for subsequent requests${NC}"
USER_PROFILE=$(curl -s -H "$AUTH_HEADER" $API_URL/auth/me)
echo $USER_PROFILE | jq
USER_ID=$(echo $USER_PROFILE | jq -r '.uid')

echo -e "User ID: $USER_ID"

# 3. Get user profile
echo -e "\n${YELLOW}Testing /auth/me endpoint${NC}"
curl -s -H "$AUTH_HEADER" $API_URL/auth/me | jq
check_status

# 4. Test food items endpoints
echo -e "\n${YELLOW}Testing /foods/ endpoint (GET)${NC}"
curl -s -H "$AUTH_HEADER" $API_URL/foods/ | jq
check_status

# 5. Create a food item
echo -e "\n${YELLOW}Testing /foods/ endpoint (POST)${NC}"
FOOD_RESPONSE=$(curl -s -X POST \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Apple",
    "serving_size": 100,
    "serving_unit": "g",
    "calories": 52,
    "proteins": 0.3,
    "carbs": 14,
    "fats": 0.2,
    "fiber": 2.4,
    "source": "test",
    "meal_compatibility": ["breakfast", "snack"]
  }' \
  $API_URL/foods/)

echo $FOOD_RESPONSE | jq
FOOD_ID=$(echo $FOOD_RESPONSE | jq -r '.id')

# 6. Get food item by ID
if [ -n "$FOOD_ID" ] && [ "$FOOD_ID" != "null" ]; then
  echo -e "\n${YELLOW}Testing /foods/{food_id} endpoint (GET)${NC}"
  curl -s -H "$AUTH_HEADER" $API_URL/foods/$FOOD_ID | jq
  check_status

  # 7. Update food item
  echo -e "\n${YELLOW}Testing /foods/{food_id} endpoint (PUT)${NC}"
  curl -s -X PUT \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Updated Test Apple",
      "serving_size": 100,
      "serving_unit": "g",
      "calories": 55,
      "proteins": 0.3,
      "carbs": 14,
      "fats": 0.2,
      "fiber": 2.4,
      "source": "test",
      "meal_compatibility": ["breakfast", "snack"]
    }' \
    $API_URL/foods/$FOOD_ID | jq
  check_status
fi

# 8. Test food logs
echo -e "\n${YELLOW}Testing /logs/ endpoint (POST)${NC}"
DATE=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
LOG_RESPONSE=$(curl -s -X POST \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"$DATE\",
    \"meal_type\": \"breakfast\",
    \"food_id\": \"$FOOD_ID\",
    \"name\": \"Test Apple\",
    \"amount\": 1,
    \"unit\": \"serving\",
    \"calories\": 52,
    \"proteins\": 0.3,
    \"carbs\": 14,
    \"fats\": 0.2,
    \"fiber\": 2.4,
    \"notes\": \"API test\"
  }" \
  $API_URL/logs/)

echo $LOG_RESPONSE | jq
LOG_ID=$(echo $LOG_RESPONSE | jq -r '.id')

# 9. Get logs for today
echo -e "\n${YELLOW}Testing /logs endpoint (GET)${NC}"
TODAY=$(date -u +"%Y-%m-%d")
curl -s -H "$AUTH_HEADER" "$API_URL/logs?date=$TODAY" | jq
check_status

# 10. Get logs for a range
echo -e "\n${YELLOW}Testing /logs/range endpoint (GET)${NC}"
START_DATE=$(date -u -v-7d +"%Y-%m-%d")
END_DATE=$(date -u +"%Y-%m-%d")
curl -s -H "$AUTH_HEADER" "$API_URL/logs/range?start_date=$START_DATE&end_date=$END_DATE" | jq
check_status

# 11. Update log if we have an ID
if [ -n "$LOG_ID" ] && [ "$LOG_ID" != "null" ]; then
  echo -e "\n${YELLOW}Testing /logs/{log_id} endpoint (PUT)${NC}"
  curl -s -X PUT \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d "{
      \"date\": \"$DATE\",
      \"meal_type\": \"lunch\",
      \"food_id\": \"$FOOD_ID\",
      \"name\": \"Updated Test Apple\",
      \"amount\": 2,
      \"unit\": \"serving\",
      \"calories\": 104,
      \"proteins\": 0.6,
      \"carbs\": 28,
      \"fats\": 0.4,
      \"fiber\": 4.8,
      \"notes\": \"Updated API test\"
    }" \
    $API_URL/logs/$LOG_ID | jq
  check_status
fi

# 12. Test goals endpoint (POST)
echo -e "\n${YELLOW}Testing /goals/ endpoint (POST)${NC}"
GOAL_RESPONSE=$(curl -s -X POST \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "weight_loss",
    "weight_target": {
      "current": 80,
      "goal": 75
    },
    "nutrition_targets": [
      {
        "name": "Standard Day",
        "daily_calories": 1800,
        "proteins": 120,
        "carbs": 180,
        "fats": 60,
        "fiber": 25,
        "water": 2000,
        "applies_to": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      }
    ]
  }' \
  $API_URL/goals/)

echo $GOAL_RESPONSE | jq
GOAL_ID=$(echo $GOAL_RESPONSE | jq -r '.id')

# 13. Get all goals
echo -e "\n${YELLOW}Testing /goals/ endpoint (GET)${NC}"
curl -s -H "$AUTH_HEADER" $API_URL/goals/ | jq
check_status

# 14. Get active goal
echo -e "\n${YELLOW}Testing /goals/active endpoint (GET)${NC}"
curl -s -H "$AUTH_HEADER" $API_URL/goals/active | jq
check_status

# 15. Test specific goal endpoints if we have an ID
if [ -n "$GOAL_ID" ] && [ "$GOAL_ID" != "null" ]; then
  echo -e "\n${YELLOW}Testing /goals/{goal_id} endpoint (GET)${NC}"
  curl -s -H "$AUTH_HEADER" $API_URL/goals/$GOAL_ID | jq
  check_status

  # 16. Add nutrition target to goal
  echo -e "\n${YELLOW}Testing /goals/{goal_id}/targets endpoint (POST)${NC}"
  curl -s -X POST \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Training Day",
      "daily_calories": 2000,
      "proteins": 150,
      "carbs": 200,
      "fats": 55,
      "fiber": 30,
      "water": 2500,
      "applies_to": ["Monday", "Wednesday", "Friday"]
    }' \
    $API_URL/goals/$GOAL_ID/targets | jq
  check_status

  # 17. Activate goal
  echo -e "\n${YELLOW}Testing /goals/{goal_id}/activate endpoint (POST)${NC}"
  curl -s -X POST \
    -H "$AUTH_HEADER" \
    $API_URL/goals/$GOAL_ID/activate | jq
  check_status
fi

# 18. Test nutrition aggregates
echo -e "\n${YELLOW}Testing /api/nutrition/aggregates/ endpoint (GET)${NC}"
curl -s -H "$AUTH_HEADER" "$API_URL/api/nutrition/aggregates/?start_date=$START_DATE&end_date=$END_DATE" | jq
check_status

# 19. Test meal suggestions with fixed parameters
echo -e "\n${YELLOW}Testing /suggest-meal endpoint (POST) with fixed parameters${NC}"
curl -s -X POST \
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
  $API_URL/suggest-meal | jq
check_status

# 20. Test meal plans with fixed parameters
echo -e "\n${YELLOW}Testing /generate-meal-plan endpoint (POST) with fixed parameters${NC}"
curl -s -X POST \
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
  $API_URL/generate-meal-plan | jq
check_status

# 21. Get active meal plan
echo -e "\n${YELLOW}Testing /meal-plans/active endpoint (GET)${NC}"
curl -s -H "$AUTH_HEADER" $API_URL/meal-plans/active | jq
check_status

# 22. Get all meal plans
echo -e "\n${YELLOW}Testing /meal-plans/all endpoint (GET)${NC}"
curl -s -H "$AUTH_HEADER" $API_URL/meal-plans/all | jq
check_status

# 23. Get regular meal plans
echo -e "\n${YELLOW}Testing /meal-plans endpoint (GET)${NC}"
curl -s -H "$AUTH_HEADER" $API_URL/meal-plans | jq
check_status

# 24. Test chatbot integration
echo -e "\n${YELLOW}Testing /api/chat endpoint (POST)${NC}"
curl -s -X POST \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What foods are high in protein?"
      }
    ],
    "fetch_context": true
  }' \
  $API_URL/api/chat | jq
check_status

# 25. Test debug endpoints
echo -e "\n${YELLOW}Testing /debug/ping endpoint (GET)${NC}"
curl -s $API_URL/debug/ping | jq
check_status

echo -e "\n${YELLOW}Testing /debug/db-status endpoint (GET)${NC}"
curl -s $API_URL/debug/db-status | jq
check_status

# Clean up - Delete food item and log if we created them
if [ -n "$LOG_ID" ] && [ "$LOG_ID" != "null" ]; then
  echo -e "\n${YELLOW}Cleaning up: Deleting test log${NC}"
  curl -s -X DELETE -H "$AUTH_HEADER" $API_URL/logs/$LOG_ID | jq
  check_status
fi

if [ -n "$FOOD_ID" ] && [ "$FOOD_ID" != "null" ]; then
  echo -e "\n${YELLOW}Cleaning up: Deleting test food item${NC}"
  curl -s -X DELETE -H "$AUTH_HEADER" $API_URL/foods/$FOOD_ID | jq
  check_status
fi

if [ -n "$GOAL_ID" ] && [ "$GOAL_ID" != "null" ]; then
  echo -e "\n${YELLOW}Cleaning up: Deleting test goal${NC}"
  curl -s -X DELETE -H "$AUTH_HEADER" $API_URL/goals/$GOAL_ID | jq
  check_status
fi

echo -e "\n${GREEN}=== Test completed ====${NC}" 