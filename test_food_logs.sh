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
echo -e "\n${YELLOW}Creating a test food item for logging${NC}"
FOOD_ID=$(curl -s -X POST "$API_URL/foods" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Food for Logging",
    "brand": "Test Brand",
    "calories": 200,
    "serving_size": {
      "amount": 100,
      "unit": "g"
    },
    "nutrients": {
      "protein": 10,
      "fat": 5,
      "carbohydrates": 25,
      "fiber": 3,
      "sugar": 5
    },
    "food_group": "grains"
  }' | jq -r '._id')

if [ "$FOOD_ID" != "null" ] && [ -n "$FOOD_ID" ]; then
  echo -e "${GREEN}✓ Successfully created food item with ID: $FOOD_ID${NC}"
else
  echo -e "${RED}✗ Failed to create food item${NC}"
  FOOD_ID="61f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 3. Create a food log entry for breakfast
echo -e "\n${YELLOW}Testing /food-logs endpoint (POST) - Breakfast${NC}"
BREAKFAST_LOG_ID=$(curl -s -X POST "$API_URL/food-logs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"food_id\": \"$FOOD_ID\",
    \"meal_type\": \"breakfast\",
    \"serving_size\": {
      \"amount\": 150,
      \"unit\": \"g\"
    },
    \"date\": \"$(date +%Y-%m-%d)\"
  }" | jq -r '._id')

if [ "$BREAKFAST_LOG_ID" != "null" ] && [ -n "$BREAKFAST_LOG_ID" ]; then
  echo -e "${GREEN}✓ Successfully created breakfast log with ID: $BREAKFAST_LOG_ID${NC}"
else
  echo -e "${RED}✗ Failed to create breakfast log${NC}"
  BREAKFAST_LOG_ID="b1f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 4. Create a food log entry for lunch
echo -e "\n${YELLOW}Testing /food-logs endpoint (POST) - Lunch${NC}"
LUNCH_LOG_ID=$(curl -s -X POST "$API_URL/food-logs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"food_id\": \"$FOOD_ID\",
    \"meal_type\": \"lunch\",
    \"serving_size\": {
      \"amount\": 200,
      \"unit\": \"g\"
    },
    \"date\": \"$(date +%Y-%m-%d)\"
  }" | jq -r '._id')

if [ "$LUNCH_LOG_ID" != "null" ] && [ -n "$LUNCH_LOG_ID" ]; then
  echo -e "${GREEN}✓ Successfully created lunch log with ID: $LUNCH_LOG_ID${NC}"
else
  echo -e "${RED}✗ Failed to create lunch log${NC}"
  LUNCH_LOG_ID="l1f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 5. Get food logs for today
echo -e "\n${YELLOW}Testing /food-logs/by-date endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/by-date/$(date +%Y-%m-%d)" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 6. Get food logs by date range
echo -e "\n${YELLOW}Testing /food-logs/by-date-range endpoint (GET)${NC}"
START_DATE=$(date -v-7d +%Y-%m-%d) # 7 days ago
END_DATE=$(date +%Y-%m-%d) # today
curl -s -X GET "$API_URL/food-logs/by-date-range/$START_DATE/$END_DATE" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 7. Get food logs by meal type
echo -e "\n${YELLOW}Testing /food-logs/by-meal-type endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/by-meal-type/breakfast/$(date +%Y-%m-%d)" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 8. Get nutritional summary for today
echo -e "\n${YELLOW}Testing /food-logs/nutrition-summary endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/nutrition-summary/$(date +%Y-%m-%d)" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 9. Get nutritional summary by date range
echo -e "\n${YELLOW}Testing /food-logs/nutrition-summary/range endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/nutrition-summary/range/$START_DATE/$END_DATE" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 10. Update the breakfast food log entry
echo -e "\n${YELLOW}Testing /food-logs/$BREAKFAST_LOG_ID endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/food-logs/$BREAKFAST_LOG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"food_id\": \"$FOOD_ID\",
    \"meal_type\": \"breakfast\",
    \"serving_size\": {
      \"amount\": 125,
      \"unit\": \"g\"
    },
    \"date\": \"$(date +%Y-%m-%d)\"
  }" | jq
check_status

# 11. Get updated nutritional summary for today
echo -e "\n${YELLOW}Testing updated /food-logs/nutrition-summary endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/nutrition-summary/$(date +%Y-%m-%d)" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 12. Get food log entry by ID
echo -e "\n${YELLOW}Testing /food-logs/$BREAKFAST_LOG_ID endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/$BREAKFAST_LOG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 13. Get meals with specific food
echo -e "\n${YELLOW}Testing /food-logs/with-food/$FOOD_ID endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/with-food/$FOOD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 14. Get frequently logged foods
echo -e "\n${YELLOW}Testing /food-logs/frequently-logged endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/frequently-logged" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 15. Get food log statistics
echo -e "\n${YELLOW}Testing /food-logs/statistics endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/statistics" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 16. Bulk create food logs
echo -e "\n${YELLOW}Testing /food-logs/bulk endpoint (POST)${NC}"
BULK_RESULT=$(curl -s -X POST "$API_URL/food-logs/bulk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "[
    {
      \"food_id\": \"$FOOD_ID\",
      \"meal_type\": \"dinner\",
      \"serving_size\": {
        \"amount\": 180,
        \"unit\": \"g\"
      },
      \"date\": \"$(date +%Y-%m-%d)\"
    },
    {
      \"food_id\": \"$FOOD_ID\",
      \"meal_type\": \"snack\",
      \"serving_size\": {
        \"amount\": 50,
        \"unit\": \"g\"
      },
      \"date\": \"$(date +%Y-%m-%d)\"
    }
  ]" | jq)

echo "$BULK_RESULT" | jq
DINNER_LOG_ID=$(echo "$BULK_RESULT" | jq -r '.[0]._id')
SNACK_LOG_ID=$(echo "$BULK_RESULT" | jq -r '.[1]._id')

# 17. Get updated nutritional summary after bulk create
echo -e "\n${YELLOW}Testing nutritional summary after bulk create (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/nutrition-summary/$(date +%Y-%m-%d)" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 18. Export food logs as CSV
echo -e "\n${YELLOW}Testing /food-logs/export endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-logs/export/$START_DATE/$END_DATE" \
  -H "Authorization: Bearer $TOKEN"
check_status

# 19. Clean up - Delete food logs
echo -e "\n${YELLOW}Cleaning up: Deleting food logs${NC}"
for LOG_ID in "$BREAKFAST_LOG_ID" "$LUNCH_LOG_ID" "$DINNER_LOG_ID" "$SNACK_LOG_ID"; do
  echo -e "Deleting log $LOG_ID"
  curl -s -X DELETE "$API_URL/food-logs/$LOG_ID" \
    -H "Authorization: Bearer $TOKEN" \
    | jq
  check_status
done

# 20. Clean up - Delete the test food item
echo -e "\n${YELLOW}Cleaning up: Deleting test food item${NC}"
curl -s -X DELETE "$API_URL/foods/$FOOD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${GREEN}=== Food Logging Tests Completed ====${NC}" 