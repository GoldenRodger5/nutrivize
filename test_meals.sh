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

echo -e "${BLUE}=== Nutrivize Meal Suggestions and Meal Plans Tests ====${NC}"

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

# Get today's date in the required format
TODAY=$(date -u +"%Y-%m-%d")

# 2. Create a food item for meal planning
echo -e "\n${YELLOW}Creating test food item for meal planning${NC}"
FOOD_ITEM_ID=$(curl -s -X POST "$API_URL/food-items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chicken Breast",
    "brand": "Organic Farms",
    "calories": 165,
    "serving_size": 100,
    "serving_unit": "g",
    "nutrients": {
      "protein": 31,
      "fat": 3.6,
      "carbohydrates": 0,
      "fiber": 0,
      "sugar": 0
    }
  }' | jq -r '._id')

if [ "$FOOD_ITEM_ID" != "null" ] && [ -n "$FOOD_ITEM_ID" ]; then
  echo -e "${GREEN}✓ Successfully created food item with ID: $FOOD_ITEM_ID${NC}"
else
  echo -e "${RED}✗ Failed to create food item${NC}"
  FOOD_ITEM_ID="61f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 3. Create a meal suggestion
echo -e "\n${YELLOW}Testing /meal-suggestions endpoint (POST)${NC}"
SUGGESTION_ID=$(curl -s -X POST "$API_URL/meal-suggestions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"High Protein Lunch\",
    \"meal_type\": \"lunch\",
    \"total_calories\": 450,
    \"food_items\": [
      {
        \"food_item_id\": \"$FOOD_ITEM_ID\",
        \"quantity\": 200
      }
    ],
    \"nutrients\": {
      \"protein\": 62,
      \"fat\": 7.2,
      \"carbohydrates\": 15,
      \"fiber\": 3,
      \"sugar\": 1
    },
    \"tags\": [\"high-protein\", \"low-carb\"]
  }" | jq -r '._id')

if [ "$SUGGESTION_ID" != "null" ] && [ -n "$SUGGESTION_ID" ]; then
  echo -e "${GREEN}✓ Successfully created meal suggestion with ID: $SUGGESTION_ID${NC}"
else
  echo -e "${RED}✗ Failed to create meal suggestion${NC}"
  SUGGESTION_ID="71f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 4. Get all meal suggestions
echo -e "\n${YELLOW}Testing /meal-suggestions endpoint (GET)${NC}"
curl -s -X GET "$API_URL/meal-suggestions" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 5. Get meal suggestions by meal type
echo -e "\n${YELLOW}Testing /meal-suggestions/by-meal-type/lunch endpoint (GET)${NC}"
curl -s -X GET "$API_URL/meal-suggestions/by-meal-type/lunch" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 6. Get meal suggestion by ID
echo -e "\n${YELLOW}Testing /meal-suggestions/$SUGGESTION_ID endpoint (GET)${NC}"
curl -s -X GET "$API_URL/meal-suggestions/$SUGGESTION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 7. Update meal suggestion
echo -e "\n${YELLOW}Testing /meal-suggestions/$SUGGESTION_ID endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/meal-suggestions/$SUGGESTION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Updated High Protein Lunch\",
    \"meal_type\": \"lunch\",
    \"total_calories\": 480,
    \"food_items\": [
      {
        \"food_item_id\": \"$FOOD_ITEM_ID\",
        \"quantity\": 220
      }
    ],
    \"nutrients\": {
      \"protein\": 68.2,
      \"fat\": 7.9,
      \"carbohydrates\": 15,
      \"fiber\": 3,
      \"sugar\": 1
    },
    \"tags\": [\"high-protein\", \"low-carb\", \"quick\"]
  }" | jq
check_status

# 8. Create a meal plan
echo -e "\n${YELLOW}Testing /meal-plans endpoint (POST)${NC}"
PLAN_ID=$(curl -s -X POST "$API_URL/meal-plans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Day Plan\",
    \"date\": \"$TODAY\",
    \"meals\": [
      {
        \"meal_type\": \"lunch\",
        \"meal_suggestion_id\": \"$SUGGESTION_ID\"
      }
    ],
    \"total_calories\": 480,
    \"total_nutrients\": {
      \"protein\": 68.2,
      \"fat\": 7.9,
      \"carbohydrates\": 15,
      \"fiber\": 3,
      \"sugar\": 1
    }
  }" | jq -r '._id')

if [ "$PLAN_ID" != "null" ] && [ -n "$PLAN_ID" ]; then
  echo -e "${GREEN}✓ Successfully created meal plan with ID: $PLAN_ID${NC}"
else
  echo -e "${RED}✗ Failed to create meal plan${NC}"
  PLAN_ID="81f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 9. Get all meal plans
echo -e "\n${YELLOW}Testing /meal-plans endpoint (GET)${NC}"
curl -s -X GET "$API_URL/meal-plans" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 10. Get meal plan by ID
echo -e "\n${YELLOW}Testing /meal-plans/$PLAN_ID endpoint (GET)${NC}"
curl -s -X GET "$API_URL/meal-plans/$PLAN_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 11. Get meal plan by date
echo -e "\n${YELLOW}Testing /meal-plans/by-date/$TODAY endpoint (GET)${NC}"
curl -s -X GET "$API_URL/meal-plans/by-date/$TODAY" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 12. Update meal plan
echo -e "\n${YELLOW}Testing /meal-plans/$PLAN_ID endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/meal-plans/$PLAN_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Updated Test Day Plan\",
    \"date\": \"$TODAY\",
    \"meals\": [
      {
        \"meal_type\": \"lunch\",
        \"meal_suggestion_id\": \"$SUGGESTION_ID\"
      },
      {
        \"meal_type\": \"dinner\",
        \"meal_suggestion_id\": \"$SUGGESTION_ID\"
      }
    ],
    \"total_calories\": 960,
    \"total_nutrients\": {
      \"protein\": 136.4,
      \"fat\": 15.8,
      \"carbohydrates\": 30,
      \"fiber\": 6,
      \"sugar\": 2
    }
  }" | jq
check_status

# 13. Generate auto meal plan based on nutrition targets
echo -e "\n${YELLOW}Testing /meal-plans/generate endpoint (POST)${NC}"
curl -s -X POST "$API_URL/meal-plans/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"$TODAY\",
    \"target_calories\": 2000,
    \"target_nutrients\": {
      \"protein\": 120,
      \"fat\": 65,
      \"carbohydrates\": 250
    },
    \"meal_preferences\": [\"breakfast\", \"lunch\", \"dinner\"],
    \"dietary_restrictions\": []
  }" | jq
check_status

# 14. Convert meal plan to food log entries
echo -e "\n${YELLOW}Testing /meal-plans/$PLAN_ID/to-food-log endpoint (POST)${NC}"
curl -s -X POST "$API_URL/meal-plans/$PLAN_ID/to-food-log" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 15. Delete meal plan
echo -e "\n${YELLOW}Testing /meal-plans/$PLAN_ID endpoint (DELETE)${NC}"
curl -s -X DELETE "$API_URL/meal-plans/$PLAN_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 16. Delete meal suggestion
echo -e "\n${YELLOW}Testing /meal-suggestions/$SUGGESTION_ID endpoint (DELETE)${NC}"
curl -s -X DELETE "$API_URL/meal-suggestions/$SUGGESTION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 17. Clean up - Delete the test food item
echo -e "\n${YELLOW}Cleaning up: Deleting test food item${NC}"
curl -s -X DELETE "$API_URL/food-items/$FOOD_ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${GREEN}=== Meal Suggestions and Meal Plans Tests Completed ====${NC}" 