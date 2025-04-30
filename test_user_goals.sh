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

echo -e "${BLUE}=== Nutrivize User Goals & Nutrition Targets Tests ====${NC}"

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

# Get current date for target date fields
CURRENT_DATE=$(date +%Y-%m-%d)
FUTURE_DATE=$(date -v+30d +%Y-%m-%d 2>/dev/null || date -d "+30 days" +%Y-%m-%d)

# 2. Create a weight goal
echo -e "\n${YELLOW}Testing /goals/weight endpoint (POST)${NC}"
WEIGHT_GOAL_ID=$(curl -s -X POST "$API_URL/goals/weight" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"current_weight\": 180,
    \"target_weight\": 170,
    \"target_date\": \"$FUTURE_DATE\",
    \"weight_unit\": \"lb\"
  }" | jq -r '._id')

if [ "$WEIGHT_GOAL_ID" != "null" ] && [ -n "$WEIGHT_GOAL_ID" ]; then
  echo -e "${GREEN}✓ Successfully created weight goal with ID: $WEIGHT_GOAL_ID${NC}"
else
  echo -e "${RED}✗ Failed to create weight goal${NC}"
  WEIGHT_GOAL_ID="w1g7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 3. Get current weight goal
echo -e "\n${YELLOW}Testing /goals/weight endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/weight" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 4. Update weight goal
echo -e "\n${YELLOW}Testing /goals/weight endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/goals/weight" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"current_weight\": 178,
    \"target_weight\": 165,
    \"target_date\": \"$FUTURE_DATE\",
    \"weight_unit\": \"lb\"
  }" | jq
check_status

# 5. Create a nutrition target
echo -e "\n${YELLOW}Testing /goals/nutrition endpoint (POST)${NC}"
NUTRITION_TARGET_ID=$(curl -s -X POST "$API_URL/goals/nutrition" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calories": 2000,
    "protein": 120,
    "carbohydrates": 200,
    "fat": 65,
    "fiber": 30,
    "sugar": 50,
    "sodium": 2300
  }' | jq -r '._id')

if [ "$NUTRITION_TARGET_ID" != "null" ] && [ -n "$NUTRITION_TARGET_ID" ]; then
  echo -e "${GREEN}✓ Successfully created nutrition target with ID: $NUTRITION_TARGET_ID${NC}"
else
  echo -e "${RED}✗ Failed to create nutrition target${NC}"
  NUTRITION_TARGET_ID="n1t7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 6. Get current nutrition target
echo -e "\n${YELLOW}Testing /goals/nutrition endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/nutrition" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 7. Update nutrition target
echo -e "\n${YELLOW}Testing /goals/nutrition endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/goals/nutrition" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calories": 1800,
    "protein": 130,
    "carbohydrates": 180,
    "fat": 60,
    "fiber": 35,
    "sugar": 40,
    "sodium": 2000
  }' | jq
check_status

# 8. Create a physical activity goal
echo -e "\n${YELLOW}Testing /goals/activity endpoint (POST)${NC}"
ACTIVITY_GOAL_ID=$(curl -s -X POST "$API_URL/goals/activity" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_level": "moderate",
    "weekly_exercise_minutes": 150,
    "exercise_types": ["walking", "weightlifting", "yoga"]
  }' | jq -r '._id')

if [ "$ACTIVITY_GOAL_ID" != "null" ] && [ -n "$ACTIVITY_GOAL_ID" ]; then
  echo -e "${GREEN}✓ Successfully created activity goal with ID: $ACTIVITY_GOAL_ID${NC}"
else
  echo -e "${RED}✗ Failed to create activity goal${NC}"
  ACTIVITY_GOAL_ID="a1g7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 9. Get current activity goal
echo -e "\n${YELLOW}Testing /goals/activity endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/activity" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 10. Update activity goal
echo -e "\n${YELLOW}Testing /goals/activity endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/goals/activity" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_level": "active",
    "weekly_exercise_minutes": 180,
    "exercise_types": ["running", "weightlifting", "swimming"]
  }' | jq
check_status

# 11. Create water intake goal
echo -e "\n${YELLOW}Testing /goals/water endpoint (POST)${NC}"
WATER_GOAL_ID=$(curl -s -X POST "$API_URL/goals/water" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "daily_target": 2500,
    "unit": "ml"
  }' | jq -r '._id')

if [ "$WATER_GOAL_ID" != "null" ] && [ -n "$WATER_GOAL_ID" ]; then
  echo -e "${GREEN}✓ Successfully created water goal with ID: $WATER_GOAL_ID${NC}"
else
  echo -e "${RED}✗ Failed to create water goal${NC}"
  WATER_GOAL_ID="w1g7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 12. Get current water goal
echo -e "\n${YELLOW}Testing /goals/water endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/water" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 13. Update water goal
echo -e "\n${YELLOW}Testing /goals/water endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/goals/water" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "daily_target": 3000,
    "unit": "ml"
  }' | jq
check_status

# 14. Create a meal frequency goal
echo -e "\n${YELLOW}Testing /goals/meal-frequency endpoint (POST)${NC}"
MEAL_FREQ_GOAL_ID=$(curl -s -X POST "$API_URL/goals/meal-frequency" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meals_per_day": 3,
    "snacks_per_day": 2,
    "meal_schedule": [
      {"meal_type": "breakfast", "time": "07:30"},
      {"meal_type": "lunch", "time": "12:30"},
      {"meal_type": "dinner", "time": "18:30"},
      {"meal_type": "snack", "time": "10:00"},
      {"meal_type": "snack", "time": "15:30"}
    ]
  }' | jq -r '._id')

if [ "$MEAL_FREQ_GOAL_ID" != "null" ] && [ -n "$MEAL_FREQ_GOAL_ID" ]; then
  echo -e "${GREEN}✓ Successfully created meal frequency goal with ID: $MEAL_FREQ_GOAL_ID${NC}"
else
  echo -e "${RED}✗ Failed to create meal frequency goal${NC}"
  MEAL_FREQ_GOAL_ID="m1g7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 15. Get current meal frequency goal
echo -e "\n${YELLOW}Testing /goals/meal-frequency endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/meal-frequency" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 16. Update meal frequency goal
echo -e "\n${YELLOW}Testing /goals/meal-frequency endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/goals/meal-frequency" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meals_per_day": 4,
    "snacks_per_day": 1,
    "meal_schedule": [
      {"meal_type": "breakfast", "time": "07:00"},
      {"meal_type": "lunch", "time": "12:00"},
      {"meal_type": "dinner", "time": "18:00"},
      {"meal_type": "snack", "time": "15:00"},
      {"meal_type": "evening_meal", "time": "21:00"}
    ]
  }' | jq
check_status

# 17. Create dietary preferences
echo -e "\n${YELLOW}Testing /goals/preferences endpoint (POST)${NC}"
PREFERENCES_ID=$(curl -s -X POST "$API_URL/goals/preferences" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "diet_type": "omnivore",
    "food_allergies": ["peanuts", "shellfish"],
    "food_dislikes": ["brussels sprouts", "liver"],
    "cuisine_preferences": ["italian", "japanese", "mediterranean"]
  }' | jq -r '._id')

if [ "$PREFERENCES_ID" != "null" ] && [ -n "$PREFERENCES_ID" ]; then
  echo -e "${GREEN}✓ Successfully created dietary preferences with ID: $PREFERENCES_ID${NC}"
else
  echo -e "${RED}✗ Failed to create dietary preferences${NC}"
  PREFERENCES_ID="p1g7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 18. Get current dietary preferences
echo -e "\n${YELLOW}Testing /goals/preferences endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/preferences" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 19. Update dietary preferences
echo -e "\n${YELLOW}Testing /goals/preferences endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/goals/preferences" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "diet_type": "flexitarian",
    "food_allergies": ["peanuts", "shellfish", "dairy"],
    "food_dislikes": ["brussels sprouts", "liver", "okra"],
    "cuisine_preferences": ["italian", "thai", "mediterranean", "mexican"]
  }' | jq
check_status

# 20. Get all user goals
echo -e "\n${YELLOW}Testing /goals endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 21. Get goal progress for weight goal
echo -e "\n${YELLOW}Testing /goals/weight/progress endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/weight/progress" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 22. Update weight progress
echo -e "\n${YELLOW}Testing /goals/weight/progress endpoint (POST)${NC}"
WEIGHT_PROGRESS_ID=$(curl -s -X POST "$API_URL/goals/weight/progress" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"weight\": 177,
    \"date\": \"$CURRENT_DATE\",
    \"weight_unit\": \"lb\"
  }" | jq -r '._id')

if [ "$WEIGHT_PROGRESS_ID" != "null" ] && [ -n "$WEIGHT_PROGRESS_ID" ]; then
  echo -e "${GREEN}✓ Successfully added weight progress with ID: $WEIGHT_PROGRESS_ID${NC}"
else
  echo -e "${RED}✗ Failed to add weight progress${NC}"
  WEIGHT_PROGRESS_ID="w1p7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 23. Get nutrition goal progress
echo -e "\n${YELLOW}Testing /goals/nutrition/progress endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/nutrition/progress" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 24. Get activity goal progress
echo -e "\n${YELLOW}Testing /goals/activity/progress endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/activity/progress" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 25. Update activity progress
echo -e "\n${YELLOW}Testing /goals/activity/progress endpoint (POST)${NC}"
ACTIVITY_PROGRESS_ID=$(curl -s -X POST "$API_URL/goals/activity/progress" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"activity_type\": \"running\",
    \"duration\": 45,
    \"calories_burned\": 350,
    \"date\": \"$CURRENT_DATE\"
  }" | jq -r '._id')

if [ "$ACTIVITY_PROGRESS_ID" != "null" ] && [ -n "$ACTIVITY_PROGRESS_ID" ]; then
  echo -e "${GREEN}✓ Successfully added activity progress with ID: $ACTIVITY_PROGRESS_ID${NC}"
else
  echo -e "${RED}✗ Failed to add activity progress${NC}"
  ACTIVITY_PROGRESS_ID="a1p7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 26. Generate nutrition recommendations based on goals
echo -e "\n${YELLOW}Testing /goals/recommendations endpoint (GET)${NC}"
curl -s -X GET "$API_URL/goals/recommendations" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 27. Clean up - Delete all created goals and preferences
echo -e "\n${YELLOW}Cleaning up: Deleting weight goal${NC}"
curl -s -X DELETE "$API_URL/goals/weight" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${YELLOW}Cleaning up: Deleting nutrition target${NC}"
curl -s -X DELETE "$API_URL/goals/nutrition" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${YELLOW}Cleaning up: Deleting activity goal${NC}"
curl -s -X DELETE "$API_URL/goals/activity" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${YELLOW}Cleaning up: Deleting water goal${NC}"
curl -s -X DELETE "$API_URL/goals/water" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${YELLOW}Cleaning up: Deleting meal frequency goal${NC}"
curl -s -X DELETE "$API_URL/goals/meal-frequency" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${YELLOW}Cleaning up: Deleting dietary preferences${NC}"
curl -s -X DELETE "$API_URL/goals/preferences" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${GREEN}=== User Goals & Nutrition Targets Tests Completed ====${NC}" 