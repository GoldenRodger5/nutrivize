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

# 2. Create a test food item for logging
echo -e "\n${YELLOW}Creating test food item for logging${NC}"
FOOD_ID=$(curl -s -X POST "$API_URL/food-items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Oatmeal",
    "brand": "Test Brand",
    "calories": 150,
    "serving_size": {
      "amount": 1,
      "unit": "cup"
    },
    "nutrients": {
      "protein": 5,
      "carbohydrates": 27,
      "fat": 3,
      "fiber": 4,
      "sugar": 1,
      "sodium": 0
    },
    "food_group": "grains"
  }' | jq -r '._id')

if [ "$FOOD_ID" != "null" ] && [ -n "$FOOD_ID" ]; then
  echo -e "${GREEN}✓ Successfully created food item with ID: $FOOD_ID${NC}"
else
  echo -e "${RED}✗ Failed to create food item${NC}"
  FOOD_ID="f1f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# Get current date in YYYY-MM-DD format
TODAY=$(date +%Y-%m-%d)
YESTERDAY=$(date -v-1d +%Y-%m-%d 2>/dev/null || date -d "yesterday" +%Y-%m-%d)
TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "tomorrow" +%Y-%m-%d)

# 3. Add a food log entry for breakfast today
echo -e "\n${YELLOW}Testing /food-logs endpoint (POST) - Add breakfast entry${NC}"
BREAKFAST_ID=$(curl -s -X POST "$API_URL/food-logs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"food_item_id\": \"$FOOD_ID\",
    \"date\": \"$TODAY\",
    \"meal_type\": \"breakfast\",
    \"servings\": 1.5,
    \"notes\": \"Test breakfast entry\"
  }" | jq -r '._id')

if [ "$BREAKFAST_ID" != "null" ] && [ -n "$BREAKFAST_ID" ]; then
  echo -e "${GREEN}✓ Successfully added breakfast log entry with ID: $BREAKFAST_ID${NC}"
else
  echo -e "${RED}✗ Failed to add breakfast log entry${NC}"
  BREAKFAST_ID="b1f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 4. Add a food log entry for lunch today
echo -e "\n${YELLOW}Testing /food-logs endpoint (POST) - Add lunch entry${NC}"
LUNCH_ID=$(curl -s -X POST "$API_URL/food-logs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"food_item_id\": \"$FOOD_ID\",
    \"date\": \"$TODAY\",
    \"meal_type\": \"lunch\",
    \"servings\": 1,
    \"notes\": \"Test lunch entry\"
  }" | jq -r '._id')

if [ "$LUNCH_ID" != "null" ] && [ -n "$LUNCH_ID" ]; then
  echo -e "${GREEN}✓ Successfully added lunch log entry with ID: $LUNCH_ID${NC}"
else
  echo -e "${RED}✗ Failed to add lunch log entry${NC}"
  LUNCH_ID="l1f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 5. Add a food log entry for yesterday
echo -e "\n${YELLOW}Testing /food-logs endpoint (POST) - Add yesterday's entry${NC}"
YESTERDAY_ID=$(curl -s -X POST "$API_URL/food-logs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"food_item_id\": \"$FOOD_ID\",
    \"date\": \"$YESTERDAY\",
    \"meal_type\": \"dinner\",
    \"servings\": 2,
    \"notes\": \"Test yesterday entry\"
  }" | jq -r '._id')

if [ "$YESTERDAY_ID" != "null" ] && [ -n "$YESTERDAY_ID" ]; then
  echo -e "${GREEN}✓ Successfully added yesterday's log entry with ID: $YESTERDAY_ID${NC}"
else
  echo -e "${RED}✗ Failed to add yesterday's log entry${NC}"
  YESTERDAY_ID="y1f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 6. Get all food logs
echo -e "\n${YELLOW}Testing /food-logs endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 7. Get food logs for today
echo -e "\n${YELLOW}Testing /food-logs/by-date endpoint (GET) - Today${NC}"
curl -s -X GET "$API_URL/food-logs/by-date/$TODAY" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 8. Get food logs for yesterday
echo -e "\n${YELLOW}Testing /food-logs/by-date endpoint (GET) - Yesterday${NC}"
curl -s -X GET "$API_URL/food-logs/by-date/$YESTERDAY" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 9. Get food logs for a date range
echo -e "\n${YELLOW}Testing /food-logs/by-date-range endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/by-date-range?start_date=$YESTERDAY&end_date=$TODAY" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 10. Get food logs by meal type
echo -e "\n${YELLOW}Testing /food-logs/by-meal endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/by-meal/breakfast" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 11. Get a specific food log entry
echo -e "\n${YELLOW}Testing /food-logs/$BREAKFAST_ID endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/$BREAKFAST_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 12. Update a food log entry
echo -e "\n${YELLOW}Testing /food-logs/$BREAKFAST_ID endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/food-logs/$BREAKFAST_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"food_item_id\": \"$FOOD_ID\",
    \"date\": \"$TODAY\",
    \"meal_type\": \"breakfast\",
    \"servings\": 2,
    \"notes\": \"Updated test breakfast entry\"
  }" | jq
check_status

# 13. Get nutrition summary for today
echo -e "\n${YELLOW}Testing /food-logs/nutrition-summary/by-date endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/nutrition-summary/by-date/$TODAY" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 14. Get nutrition summary for a date range
echo -e "\n${YELLOW}Testing /food-logs/nutrition-summary/by-date-range endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/nutrition-summary/by-date-range?start_date=$YESTERDAY&end_date=$TODAY" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 15. Get nutrition breakdown by meal for today
echo -e "\n${YELLOW}Testing /food-logs/nutrition-breakdown/by-meal endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/nutrition-breakdown/by-meal/$TODAY" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 16. Bulk add food log entries
echo -e "\n${YELLOW}Testing /food-logs/bulk endpoint (POST)${NC}"
BULK_RESPONSE=$(curl -s -X POST "$API_URL/food-logs/bulk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "[
    {
      \"food_item_id\": \"$FOOD_ID\",
      \"date\": \"$TODAY\",
      \"meal_type\": \"snack\",
      \"servings\": 0.5,
      \"notes\": \"Bulk test 1\"
    },
    {
      \"food_item_id\": \"$FOOD_ID\",
      \"date\": \"$TODAY\",
      \"meal_type\": \"dinner\",
      \"servings\": 1.5,
      \"notes\": \"Bulk test 2\"
    }
  ]" | jq)

echo "$BULK_RESPONSE"
check_status

# Extract the IDs from bulk response for cleanup later
BULK_IDS=$(echo "$BULK_RESPONSE" | jq -r '.[] | ._id')

# 17. Get food log statistics
echo -e "\n${YELLOW}Testing /food-logs/statistics endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/statistics" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 18. Get most logged foods
echo -e "\n${YELLOW}Testing /food-logs/most-logged endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/most-logged" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 19. Get streak information
echo -e "\n${YELLOW}Testing /food-logs/streak endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/streak" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 20. Add water intake for today
echo -e "\n${YELLOW}Testing /food-logs/water endpoint (POST)${NC}"
WATER_ID=$(curl -s -X POST "$API_URL/food-logs/water" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"$TODAY\",
    \"amount\": 500,
    \"unit\": \"ml\",
    \"time\": \"$(date "+%H:%M")\"
  }" | jq -r '._id')

if [ "$WATER_ID" != "null" ] && [ -n "$WATER_ID" ]; then
  echo -e "${GREEN}✓ Successfully added water intake with ID: $WATER_ID${NC}"
else
  echo -e "${RED}✗ Failed to add water intake${NC}"
  WATER_ID="w1f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 21. Get today's water intake
echo -e "\n${YELLOW}Testing /food-logs/water/by-date endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/water/by-date/$TODAY" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 22. Update water intake
echo -e "\n${YELLOW}Testing /food-logs/water/$WATER_ID endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/food-logs/water/$WATER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"$TODAY\",
    \"amount\": 750,
    \"unit\": \"ml\",
    \"time\": \"$(date "+%H:%M")\"
  }" | jq
check_status

# 23. Get water intake summary for date range
echo -e "\n${YELLOW}Testing /food-logs/water/summary endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/water/summary?start_date=$YESTERDAY&end_date=$TODAY" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 24. Delete water intake
echo -e "\n${YELLOW}Testing /food-logs/water/$WATER_ID endpoint (DELETE)${NC}"
curl -s -X DELETE "$API_URL/food-logs/water/$WATER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 25. Clean up - Delete all created food log entries
echo -e "\n${YELLOW}Cleaning up: Deleting food log entries${NC}"
for ID in "$BREAKFAST_ID" "$LUNCH_ID" "$YESTERDAY_ID"; do
  echo -e "Deleting food log entry $ID"
  curl -s -X DELETE "$API_URL/food-logs/$ID" \
    -H "Authorization: Bearer $TOKEN" \
    | jq
  check_status
done

# 26. Clean up bulk added entries
echo -e "\n${YELLOW}Cleaning up: Deleting bulk log entries${NC}"
for ID in $BULK_IDS; do
  echo -e "Deleting bulk food log entry $ID"
  curl -s -X DELETE "$API_URL/food-logs/$ID" \
    -H "Authorization: Bearer $TOKEN" \
    | jq
  check_status
done

# 27. Clean up - Delete test food item
echo -e "\n${YELLOW}Cleaning up: Deleting test food item${NC}"
curl -s -X DELETE "$API_URL/food-items/$FOOD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${GREEN}=== Food Logging Tests Completed ====${NC}" 