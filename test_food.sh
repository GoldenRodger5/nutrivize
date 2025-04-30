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

echo -e "${BLUE}=== Nutrivize Food Item Management Tests ====${NC}"

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

# 2. Create a new food item
echo -e "\n${YELLOW}Testing /food-items endpoint (POST)${NC}"
FOOD_ITEM_ID=$(curl -s -X POST "$API_URL/food-items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Apple",
    "brand": "Fresh Farms",
    "serving_size": 100,
    "serving_unit": "g",
    "calories": 52,
    "protein": 0.3,
    "fat": 0.2,
    "carbohydrates": 14,
    "fiber": 2.4,
    "sugar": 10.3,
    "category": "fruits"
  }' | jq -r '._id')

if [ "$FOOD_ITEM_ID" != "null" ] && [ -n "$FOOD_ITEM_ID" ]; then
  echo -e "${GREEN}✓ Successfully created food item with ID: $FOOD_ITEM_ID${NC}"
else
  echo -e "${RED}✗ Failed to create food item${NC}"
  FOOD_ITEM_ID="51f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 3. Get all food items
echo -e "\n${YELLOW}Testing /food-items endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 4. Search for food items
echo -e "\n${YELLOW}Testing /food-items/search?query=apple endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/search?query=apple" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 5. Get food item by ID
echo -e "\n${YELLOW}Testing /food-items/$FOOD_ITEM_ID endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/$FOOD_ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 6. Get food items by category
echo -e "\n${YELLOW}Testing /food-items/category/fruits endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/category/fruits" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 7. Update food item
echo -e "\n${YELLOW}Testing /food-items/$FOOD_ITEM_ID endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/food-items/$FOOD_ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Apple",
    "brand": "Organic Farms",
    "serving_size": 100,
    "serving_unit": "g",
    "calories": 50,
    "protein": 0.4,
    "fat": 0.2,
    "carbohydrates": 13.5,
    "fiber": 2.5,
    "sugar": 10,
    "category": "fruits"
  }' | jq
check_status

# 8. Get user's favorite food items (if implemented)
echo -e "\n${YELLOW}Testing /food-items/favorites endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/favorites" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 9. Add food item to favorites (if implemented)
echo -e "\n${YELLOW}Testing /food-items/$FOOD_ITEM_ID/favorite endpoint (POST)${NC}"
curl -s -X POST "$API_URL/food-items/$FOOD_ITEM_ID/favorite" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 10. Remove food item from favorites (if implemented)
echo -e "\n${YELLOW}Testing /food-items/$FOOD_ITEM_ID/favorite endpoint (DELETE)${NC}"
curl -s -X DELETE "$API_URL/food-items/$FOOD_ITEM_ID/favorite" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 11. Get frequently used food items (if implemented)
echo -e "\n${YELLOW}Testing /food-items/frequent endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/frequent" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 12. Get recently used food items (if implemented)
echo -e "\n${YELLOW}Testing /food-items/recent endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/recent" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 13. Delete food item
echo -e "\n${YELLOW}Testing /food-items/$FOOD_ITEM_ID endpoint (DELETE)${NC}"
curl -s -X DELETE "$API_URL/food-items/$FOOD_ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${GREEN}=== Food Item Management Tests Completed ====${NC}" 