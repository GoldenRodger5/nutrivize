#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set the API base URL
API_URL="http://localhost:5001"

# Set test user credentials for authentication
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

echo -e "${BLUE}=== Nutrivize Goals and Nutrition Targets Tests ====${NC}"

# 1. Login to get an auth token
echo -e "\n${YELLOW}Authenticating test user${NC}"
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  | jq -r '.access_token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Successfully obtained token${NC}"
else
  echo -e "${RED}✗ Failed to obtain token${NC}"
  exit 1
fi

# 2. Create a nutrition target
echo -e "\n${YELLOW}Testing /goals/nutrition-targets endpoint (POST)${NC}"
NUTRITION_TARGET_ID=$(curl -s -X POST "$API_URL/goals/nutrition-targets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calories": 2000,
    "protein": 150,
    "fat": 65,
    "carbohydrates": 200,
    "fiber": 30,
    "sugar": 40
  }' | jq -r '._id')

if [ "$NUTRITION_TARGET_ID" != "null" ] && [ -n "$NUTRITION_TARGET_ID" ]; then
  echo -e "${GREEN}✓ Successfully created nutrition target with ID: $NUTRITION_TARGET_ID${NC}"
else
  echo -e "${RED}✗ Failed to create nutrition target${NC}"
  NUTRITION_TARGET_ID="91f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 3. Get the current nutrition target
echo -e "\n${YELLOW}Testing /goals/nutrition-targets/current endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/nutrition-targets/current" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 4. Get nutrition target by ID
echo -e "\n${YELLOW}Testing /goals/nutrition-targets/$NUTRITION_TARGET_ID endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/nutrition-targets/$NUTRITION_TARGET_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 5. Update nutrition target
echo -e "\n${YELLOW}Testing /goals/nutrition-targets/$NUTRITION_TARGET_ID endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/goals/nutrition-targets/$NUTRITION_TARGET_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calories": 1800,
    "protein": 140,
    "fat": 60,
    "carbohydrates": 180,
    "fiber": 35,
    "sugar": 35
  }' | jq
check_status

# 6. Get all nutrition targets history
echo -e "\n${YELLOW}Testing /goals/nutrition-targets/history endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/nutrition-targets/history" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 7. Create a weight goal
echo -e "\n${YELLOW}Testing /goals/weight endpoint (POST)${NC}"
WEIGHT_GOAL_ID=$(curl -s -X POST "$API_URL/goals/weight" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_weight": 70,
    "target_date": "2023-12-31",
    "starting_weight": 80,
    "starting_date": "2023-06-01"
  }' | jq -r '._id')

if [ "$WEIGHT_GOAL_ID" != "null" ] && [ -n "$WEIGHT_GOAL_ID" ]; then
  echo -e "${GREEN}✓ Successfully created weight goal with ID: $WEIGHT_GOAL_ID${NC}"
else
  echo -e "${RED}✗ Failed to create weight goal${NC}"
  WEIGHT_GOAL_ID="a1f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 8. Get the current weight goal
echo -e "\n${YELLOW}Testing /goals/weight/current endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/weight/current" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 9. Update weight goal
echo -e "\n${YELLOW}Testing /goals/weight/$WEIGHT_GOAL_ID endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/goals/weight/$WEIGHT_GOAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_weight": 72,
    "target_date": "2023-12-31",
    "starting_weight": 80,
    "starting_date": "2023-06-01"
  }' | jq
check_status

# 10. Get weight goal history
echo -e "\n${YELLOW}Testing /goals/weight/history endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/weight/history" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 11. Log a weight measurement
echo -e "\n${YELLOW}Testing /goals/weight/measurements endpoint (POST)${NC}"
WEIGHT_MEASUREMENT_ID=$(curl -s -X POST "$API_URL/goals/weight/measurements" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"$(date -u +"%Y-%m-%d")\",
    \"weight\": 78.5
  }" | jq -r '._id')

if [ "$WEIGHT_MEASUREMENT_ID" != "null" ] && [ -n "$WEIGHT_MEASUREMENT_ID" ]; then
  echo -e "${GREEN}✓ Successfully created weight measurement with ID: $WEIGHT_MEASUREMENT_ID${NC}"
else
  echo -e "${RED}✗ Failed to create weight measurement${NC}"
  WEIGHT_MEASUREMENT_ID="b1f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 12. Get weight measurements
echo -e "\n${YELLOW}Testing /goals/weight/measurements endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/weight/measurements" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 13. Get weight progress
echo -e "\n${YELLOW}Testing /goals/weight/progress endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/weight/progress" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 14. Clean up - Delete weight measurement
echo -e "\n${YELLOW}Cleaning up: Deleting weight measurement${NC}"
curl -s -X DELETE "$API_URL/goals/weight/measurements/$WEIGHT_MEASUREMENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 15. Clean up - Delete weight goal
echo -e "\n${YELLOW}Cleaning up: Deleting weight goal${NC}"
curl -s -X DELETE "$API_URL/goals/weight/$WEIGHT_GOAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 16. Clean up - Delete nutrition target
echo -e "\n${YELLOW}Cleaning up: Deleting nutrition target${NC}"
curl -s -X DELETE "$API_URL/goals/nutrition-targets/$NUTRITION_TARGET_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${GREEN}=== Goals and Nutrition Targets Tests Completed ====${NC}" 