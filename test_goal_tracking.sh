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

echo -e "${BLUE}=== Nutrivize Goal Tracking Tests ====${NC}"

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

# 2. Create a new weight goal
echo -e "\n${YELLOW}Testing /goals endpoint (POST) - Weight goal${NC}"
WEIGHT_GOAL_ID=$(curl -s -X POST "$API_URL/goals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "weight",
    "target": 75.0,
    "current": 82.5,
    "unit": "kg",
    "start_date": "'$(date +%Y-%m-%d)'",
    "target_date": "'$(date -v+90d +%Y-%m-%d)'",
    "description": "Lose weight gradually over 3 months"
  }' | jq -r '._id')

if [ "$WEIGHT_GOAL_ID" != "null" ] && [ -n "$WEIGHT_GOAL_ID" ]; then
  echo -e "${GREEN}✓ Successfully created weight goal with ID: $WEIGHT_GOAL_ID${NC}"
else
  echo -e "${RED}✗ Failed to create weight goal${NC}"
  WEIGHT_GOAL_ID="g1f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 3. Create a new nutrition goal
echo -e "\n${YELLOW}Testing /goals endpoint (POST) - Nutrition goal${NC}"
NUTRITION_GOAL_ID=$(curl -s -X POST "$API_URL/goals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "nutrition",
    "target": {
      "protein": 120,
      "carbohydrates": 200,
      "fat": 70,
      "calories": 2000
    },
    "start_date": "'$(date +%Y-%m-%d)'",
    "target_date": "'$(date -v+30d +%Y-%m-%d)'",
    "description": "Maintain balanced macronutrient intake"
  }' | jq -r '._id')

if [ "$NUTRITION_GOAL_ID" != "null" ] && [ -n "$NUTRITION_GOAL_ID" ]; then
  echo -e "${GREEN}✓ Successfully created nutrition goal with ID: $NUTRITION_GOAL_ID${NC}"
else
  echo -e "${RED}✗ Failed to create nutrition goal${NC}"
  NUTRITION_GOAL_ID="n1f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 4. Create a new activity goal
echo -e "\n${YELLOW}Testing /goals endpoint (POST) - Activity goal${NC}"
ACTIVITY_GOAL_ID=$(curl -s -X POST "$API_URL/goals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "activity",
    "target": 10000,
    "current": 6000,
    "unit": "steps",
    "start_date": "'$(date +%Y-%m-%d)'",
    "target_date": "'$(date -v+14d +%Y-%m-%d)'",
    "description": "Increase daily step count"
  }' | jq -r '._id')

if [ "$ACTIVITY_GOAL_ID" != "null" ] && [ -n "$ACTIVITY_GOAL_ID" ]; then
  echo -e "${GREEN}✓ Successfully created activity goal with ID: $ACTIVITY_GOAL_ID${NC}"
else
  echo -e "${RED}✗ Failed to create activity goal${NC}"
  ACTIVITY_GOAL_ID="a1f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 5. Get all goals
echo -e "\n${YELLOW}Testing /goals endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 6. Get a specific goal by ID
echo -e "\n${YELLOW}Testing /goals/$WEIGHT_GOAL_ID endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/$WEIGHT_GOAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 7. Get goals by type
echo -e "\n${YELLOW}Testing /goals/by-type/weight endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/by-type/weight" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 8. Get active goals
echo -e "\n${YELLOW}Testing /goals/active endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/active" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 9. Update weight goal with progress
echo -e "\n${YELLOW}Testing /goals/$WEIGHT_GOAL_ID endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/goals/$WEIGHT_GOAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "weight",
    "target": 75.0,
    "current": 81.2,
    "unit": "kg",
    "start_date": "'$(date +%Y-%m-%d)'",
    "target_date": "'$(date -v+90d +%Y-%m-%d)'",
    "description": "Lose weight gradually over 3 months",
    "progress": [
      {
        "date": "'$(date +%Y-%m-%d)'",
        "value": 82.5
      },
      {
        "date": "'$(date -v+7d +%Y-%m-%d)'",
        "value": 81.2
      }
    ]
  }' | jq
check_status

# 10. Add a progress update to the weight goal
echo -e "\n${YELLOW}Testing /goals/$WEIGHT_GOAL_ID/progress endpoint (POST)${NC}"
curl -s -X POST "$API_URL/goals/$WEIGHT_GOAL_ID/progress" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "'$(date -v+14d +%Y-%m-%d)'",
    "value": 80.0
  }' | jq
check_status

# 11. Get goal progress
echo -e "\n${YELLOW}Testing /goals/$WEIGHT_GOAL_ID/progress endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/$WEIGHT_GOAL_ID/progress" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 12. Get goal progress in date range
echo -e "\n${YELLOW}Testing /goals/$WEIGHT_GOAL_ID/progress/range endpoint (GET)${NC}"
START_DATE=$(date +%Y-%m-%d)
END_DATE=$(date -v+30d +%Y-%m-%d)
curl -s -X GET "$API_URL/goals/$WEIGHT_GOAL_ID/progress/range/$START_DATE/$END_DATE" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 13. Get goal completion percentage
echo -e "\n${YELLOW}Testing /goals/$WEIGHT_GOAL_ID/completion endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/$WEIGHT_GOAL_ID/completion" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 14. Get goal forecast
echo -e "\n${YELLOW}Testing /goals/$WEIGHT_GOAL_ID/forecast endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/$WEIGHT_GOAL_ID/forecast" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 15. Set nutrition targets
echo -e "\n${YELLOW}Testing /nutrition-targets endpoint (POST)${NC}"
TARGETS_ID=$(curl -s -X POST "$API_URL/nutrition-targets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calories": 2000,
    "protein": 120,
    "carbohydrates": 200,
    "fat": 70,
    "fiber": 30,
    "sugar": 25,
    "sodium": 2300,
    "effective_date": "'$(date +%Y-%m-%d)'"
  }' | jq -r '._id')

if [ "$TARGETS_ID" != "null" ] && [ -n "$TARGETS_ID" ]; then
  echo -e "${GREEN}✓ Successfully set nutrition targets with ID: $TARGETS_ID${NC}"
else
  echo -e "${RED}✗ Failed to set nutrition targets${NC}"
  TARGETS_ID="t1f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 16. Get current nutrition targets
echo -e "\n${YELLOW}Testing /nutrition-targets/current endpoint (GET)${NC}"
curl -s -X GET "$API_URL/nutrition-targets/current" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 17. Get nutrition targets by date
echo -e "\n${YELLOW}Testing /nutrition-targets/by-date endpoint (GET)${NC}"
curl -s -X GET "$API_URL/nutrition-targets/by-date/$(date +%Y-%m-%d)" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 18. Update nutrition targets
echo -e "\n${YELLOW}Testing /nutrition-targets/$TARGETS_ID endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/nutrition-targets/$TARGETS_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calories": 1950,
    "protein": 130,
    "carbohydrates": 190,
    "fat": 65,
    "fiber": 35,
    "sugar": 20,
    "sodium": 2200,
    "effective_date": "'$(date +%Y-%m-%d)'"
  }' | jq
check_status

# 19. Get nutrition targets history
echo -e "\n${YELLOW}Testing /nutrition-targets/history endpoint (GET)${NC}"
curl -s -X GET "$API_URL/nutrition-targets/history" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 20. Complete a goal
echo -e "\n${YELLOW}Testing /goals/$ACTIVITY_GOAL_ID/complete endpoint (POST)${NC}"
curl -s -X POST "$API_URL/goals/$ACTIVITY_GOAL_ID/complete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completion_date": "'$(date +%Y-%m-%d)'",
    "final_value": 10200
  }' | jq
check_status

# 21. Get goal achievements
echo -e "\n${YELLOW}Testing /goals/achievements endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/achievements" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 22. Get goal statistics
echo -e "\n${YELLOW}Testing /goals/statistics endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/statistics" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 23. Clean up - Delete goals
echo -e "\n${YELLOW}Cleaning up: Deleting goals${NC}"
for GOAL_ID in "$WEIGHT_GOAL_ID" "$NUTRITION_GOAL_ID" "$ACTIVITY_GOAL_ID"; do
  echo -e "Deleting goal $GOAL_ID"
  curl -s -X DELETE "$API_URL/goals/$GOAL_ID" \
    -H "Authorization: Bearer $TOKEN" \
    | jq
  check_status
done

# 24. Clean up - Delete nutrition targets
echo -e "\n${YELLOW}Cleaning up: Deleting nutrition targets${NC}"
curl -s -X DELETE "$API_URL/nutrition-targets/$TARGETS_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${GREEN}=== Goal Tracking Tests Completed ====${NC}" 