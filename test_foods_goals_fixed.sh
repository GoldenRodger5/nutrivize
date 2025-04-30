#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set the API base URL
API_URL="http://localhost:5001"

echo -e "${BLUE}=== Nutrivize Foods and Goals Tests ====${NC}"

# 1. Test getting all foods
echo -e "\n${YELLOW}Testing /foods/ endpoint (GET)${NC}"
curl -s -X GET "$API_URL/foods/" | jq
check_status() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Success${NC}"
  else
    echo -e "${RED}✗ Failed${NC}"
  fi
}
check_status

# 2. Test getting a specific food by ID (we'll grab the first ID from the list)
echo -e "\n${YELLOW}Getting first food ID from list${NC}"
FOOD_ID=$(curl -s -X GET "$API_URL/foods/" | jq -r '.[0]._id')

if [ "$FOOD_ID" != "null" ] && [ -n "$FOOD_ID" ]; then
  echo -e "${GREEN}✓ Successfully obtained food ID: $FOOD_ID${NC}"

  echo -e "\n${YELLOW}Testing /foods/$FOOD_ID endpoint (GET)${NC}"
  curl -s -X GET "$API_URL/foods/$FOOD_ID" | jq
  check_status
else
  echo -e "${RED}✗ Failed to obtain food ID${NC}"
fi

# 3. Test getting all goals
echo -e "\n${YELLOW}Testing /goals/ endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/" | jq
check_status

# 4. Test getting active goals
echo -e "\n${YELLOW}Testing /goals/active endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/active" | jq
check_status

# 5. Test the debug foods endpoint
echo -e "\n${YELLOW}Testing /debug/foods endpoint (GET)${NC}"
curl -s -X GET "$API_URL/debug/foods" | jq
check_status

# 6. Test the debug goals endpoint
echo -e "\n${YELLOW}Testing /debug/goals endpoint (GET)${NC}"
curl -s -X GET "$API_URL/debug/goals" | jq
check_status

# 7. Test the debug logs endpoint
echo -e "\n${YELLOW}Testing /debug/logs endpoint (GET)${NC}"
curl -s -X GET "$API_URL/debug/logs" | jq
check_status

# 8. Test the meal plan generation endpoint
echo -e "\n${YELLOW}Testing /generate-meal-plan endpoint (POST) - This may take a while${NC}"
curl -s -X POST "$API_URL/generate-meal-plan" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "sample_user_id",
    "days": 1,
    "preferences": {
      "dietary": ["balanced"],
      "meal_types": ["breakfast", "lunch", "dinner"]
    },
    "excluded_foods": [],
    "calories_per_day": 2000,
    "daily_targets": {
      "calories": 2000,
      "protein": 100,
      "carbs": 250,
      "fats": 65
    }
  }' | jq
check_status

echo -e "\n${GREEN}=== Foods and Goals Tests Completed ====${NC}" 