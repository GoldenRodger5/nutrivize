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

echo -e "${BLUE}=== Nutrivize Food Logging Tests ====${NC}"

# Get today's date in the required format
TODAY=$(date -u +"%Y-%m-%d")

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

# Create a test food item to use in logs
echo -e "\n${YELLOW}Creating a test food item for logging${NC}"
FOOD_ITEM_ID=$(curl -s -X POST "$API_URL/food-items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Banana",
    "brand": "Fresh Farms",
    "serving_size": 118,
    "serving_unit": "g",
    "calories": 105,
    "protein": 1.3,
    "fat": 0.4,
    "carbohydrates": 27,
    "fiber": 3.1,
    "sugar": 14.4,
    "category": "fruits"
  }' | jq -r '._id')

if [ "$FOOD_ITEM_ID" != "null" ] && [ -n "$FOOD_ITEM_ID" ]; then
  echo -e "${GREEN}✓ Successfully created food item with ID: $FOOD_ITEM_ID${NC}"
else
  echo -e "${RED}✗ Failed to create food item${NC}"
  FOOD_ITEM_ID="51f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 2. Create a food log entry
echo -e "\n${YELLOW}Testing /food-logs endpoint (POST)${NC}"
FOOD_LOG_ID=$(curl -s -X POST "$API_URL/food-logs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"$TODAY\",
    \"meal_type\": \"breakfast\",
    \"food_items\": [
      {
        \"food_item_id\": \"$FOOD_ITEM_ID\",
        \"quantity\": 1
      }
    ]
  }" | jq -r '._id')

if [ "$FOOD_LOG_ID" != "null" ] && [ -n "$FOOD_LOG_ID" ]; then
  echo -e "${GREEN}✓ Successfully created food log entry with ID: $FOOD_LOG_ID${NC}"
else
  echo -e "${RED}✗ Failed to create food log entry${NC}"
  FOOD_LOG_ID="71f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 3. Get all food log entries
echo -e "\n${YELLOW}Testing /food-logs endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 4. Get food log entries by date
echo -e "\n${YELLOW}Testing /food-logs/by-date/$TODAY endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/by-date/$TODAY" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 5. Get food log entry by ID
echo -e "\n${YELLOW}Testing /food-logs/$FOOD_LOG_ID endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/$FOOD_LOG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 6. Update food log entry
echo -e "\n${YELLOW}Testing /food-logs/$FOOD_LOG_ID endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/food-logs/$FOOD_LOG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"$TODAY\",
    \"meal_type\": \"lunch\",
    \"food_items\": [
      {
        \"food_item_id\": \"$FOOD_ITEM_ID\",
        \"quantity\": 2
      }
    ]
  }" | jq
check_status

# 7. Get nutrition summary for the day
echo -e "\n${YELLOW}Testing /food-logs/nutrition-summary/$TODAY endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/nutrition-summary/$TODAY" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 8. Get nutrition summary for date range
PAST_DATE=$(date -v-7d +"%Y-%m-%d" 2>/dev/null || date -d "7 days ago" +"%Y-%m-%d")
echo -e "\n${YELLOW}Testing /food-logs/nutrition-summary endpoint with date range (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/nutrition-summary?start_date=$PAST_DATE&end_date=$TODAY" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 9. Get meal-specific food logs
echo -e "\n${YELLOW}Testing /food-logs/by-meal-type/lunch/$TODAY endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/by-meal-type/lunch/$TODAY" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 10. Bulk add food items to food log
echo -e "\n${YELLOW}Testing /food-logs/bulk endpoint (POST)${NC}"
curl -s -X POST "$API_URL/food-logs/bulk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"$TODAY\",
    \"entries\": [
      {
        \"meal_type\": \"dinner\",
        \"food_items\": [
          {
            \"food_item_id\": \"$FOOD_ITEM_ID\",
            \"quantity\": 1
          }
        ]
      },
      {
        \"meal_type\": \"snack\",
        \"food_items\": [
          {
            \"food_item_id\": \"$FOOD_ITEM_ID\",
            \"quantity\": 0.5
          }
        ]
      }
    ]
  }" | jq
check_status

# 11. Delete food log entry
echo -e "\n${YELLOW}Testing /food-logs/$FOOD_LOG_ID endpoint (DELETE)${NC}"
curl -s -X DELETE "$API_URL/food-logs/$FOOD_LOG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 12. Clean up - Delete the test food item
echo -e "\n${YELLOW}Cleaning up: Deleting test food item${NC}"
curl -s -X DELETE "$API_URL/food-items/$FOOD_ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${GREEN}=== Food Logging Tests Completed ====${NC}" 