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

echo -e "${BLUE}=== Nutrivize Food Items Management Tests ====${NC}"

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

# 2. Create a test food item
echo -e "\n${YELLOW}Testing /foods endpoint (POST)${NC}"
FOOD_ID=$(curl -s -X POST "$API_URL/foods" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Apple",
    "brand": "Test Brand",
    "calories": 95,
    "serving_size": {
      "amount": 100,
      "unit": "g"
    },
    "nutrients": {
      "protein": 0.5,
      "fat": 0.3,
      "carbohydrates": 25,
      "fiber": 4.4,
      "sugar": 19
    },
    "food_group": "fruits",
    "is_verified": true,
    "barcode": "1234567890123"
  }' | jq -r '._id')

if [ "$FOOD_ID" != "null" ] && [ -n "$FOOD_ID" ]; then
  echo -e "${GREEN}✓ Successfully created food item with ID: $FOOD_ID${NC}"
else
  echo -e "${RED}✗ Failed to create food item${NC}"
  FOOD_ID="61f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 3. Get food item by ID
echo -e "\n${YELLOW}Testing /foods/$FOOD_ID endpoint (GET)${NC}"
curl -s -X GET "$API_URL/foods/$FOOD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 4. Get all food items (with pagination)
echo -e "\n${YELLOW}Testing /foods endpoint (GET) with pagination${NC}"
curl -s -X GET "$API_URL/foods?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 5. Search for food items
echo -e "\n${YELLOW}Testing /foods/search endpoint (GET)${NC}"
curl -s -X GET "$API_URL/foods/search?query=Apple" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 6. Filter food items by food group
echo -e "\n${YELLOW}Testing /foods/by-food-group endpoint (GET)${NC}"
curl -s -X GET "$API_URL/foods/by-food-group/fruits" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 7. Get food items by nutritional criteria
echo -e "\n${YELLOW}Testing /foods/by-nutrition endpoint (GET)${NC}"
curl -s -X GET "$API_URL/foods/by-nutrition?min_protein=0.5&max_calories=100" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 8. Update the food item
echo -e "\n${YELLOW}Testing /foods/$FOOD_ID endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/foods/$FOOD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Apple Updated",
    "brand": "Test Brand Updated",
    "calories": 90,
    "serving_size": {
      "amount": 100,
      "unit": "g"
    },
    "nutrients": {
      "protein": 0.5,
      "fat": 0.2,
      "carbohydrates": 24,
      "fiber": 4.5,
      "sugar": 18
    },
    "food_group": "fruits",
    "is_verified": true,
    "barcode": "1234567890123"
  }' | jq
check_status

# 9. Get food items by barcode
echo -e "\n${YELLOW}Testing /foods/barcode/1234567890123 endpoint (GET)${NC}"
curl -s -X GET "$API_URL/foods/barcode/1234567890123" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 10. Get recently added food items
echo -e "\n${YELLOW}Testing /foods/recent endpoint (GET)${NC}"
curl -s -X GET "$API_URL/foods/recent" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 11. Get frequently used food items (should be empty for a new item)
echo -e "\n${YELLOW}Testing /foods/frequently-used endpoint (GET)${NC}"
curl -s -X GET "$API_URL/foods/frequently-used" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 12. Get favorite food items
echo -e "\n${YELLOW}Testing /foods/favorites endpoint (GET)${NC}"
curl -s -X GET "$API_URL/foods/favorites" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 13. Add to favorites
echo -e "\n${YELLOW}Testing /foods/favorites/$FOOD_ID endpoint (POST)${NC}"
curl -s -X POST "$API_URL/foods/favorites/$FOOD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 14. Check favorites again after adding one
echo -e "\n${YELLOW}Testing /foods/favorites endpoint (GET) after adding favorite${NC}"
curl -s -X GET "$API_URL/foods/favorites" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 15. Remove from favorites
echo -e "\n${YELLOW}Testing /foods/favorites/$FOOD_ID endpoint (DELETE)${NC}"
curl -s -X DELETE "$API_URL/foods/favorites/$FOOD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 16. Create a custom food item
echo -e "\n${YELLOW}Testing /foods/custom endpoint (POST)${NC}"
CUSTOM_FOOD_ID=$(curl -s -X POST "$API_URL/foods/custom" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Custom Recipe",
    "calories": 350,
    "serving_size": {
      "amount": 200,
      "unit": "g"
    },
    "nutrients": {
      "protein": 10,
      "fat": 15,
      "carbohydrates": 40,
      "fiber": 5,
      "sugar": 10
    },
    "food_group": "custom"
  }' | jq -r '._id')

if [ "$CUSTOM_FOOD_ID" != "null" ] && [ -n "$CUSTOM_FOOD_ID" ]; then
  echo -e "${GREEN}✓ Successfully created custom food with ID: $CUSTOM_FOOD_ID${NC}"
else
  echo -e "${RED}✗ Failed to create custom food${NC}"
  CUSTOM_FOOD_ID="c1f7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 17. Get user's custom food items
echo -e "\n${YELLOW}Testing /foods/custom endpoint (GET)${NC}"
curl -s -X GET "$API_URL/foods/custom" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 18. Clean up - Delete custom food
echo -e "\n${YELLOW}Cleaning up: Deleting custom food item${NC}"
curl -s -X DELETE "$API_URL/foods/custom/$CUSTOM_FOOD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 19. Clean up - Delete standard food
echo -e "\n${YELLOW}Cleaning up: Deleting food item${NC}"
curl -s -X DELETE "$API_URL/foods/$FOOD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${GREEN}=== Food Items Management Tests Completed ====${NC}" 