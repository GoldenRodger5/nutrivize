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
    "name": "Test Oatmeal",
    "brand": "Test Brand",
    "description": "A test food item - steel cut oatmeal",
    "serving_size": 100,
    "serving_unit": "g",
    "calories": 350,
    "protein": 13,
    "carbohydrates": 62,
    "fat": 6,
    "fiber": 10,
    "sugar": 1,
    "sodium": 4,
    "tags": ["breakfast", "grain", "organic"],
    "is_verified": true,
    "food_group": "grains"
  }' | jq -r '._id')

if [ "$FOOD_ITEM_ID" != "null" ] && [ -n "$FOOD_ITEM_ID" ]; then
  echo -e "${GREEN}✓ Successfully created food item with ID: $FOOD_ITEM_ID${NC}"
else
  echo -e "${RED}✗ Failed to create food item${NC}"
  FOOD_ITEM_ID="f1d7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 3. Get all food items
echo -e "\n${YELLOW}Testing /food-items endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 4. Get specific food item by ID
echo -e "\n${YELLOW}Testing /food-items/{id} endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/$FOOD_ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 5. Update food item
echo -e "\n${YELLOW}Testing /food-items/{id} endpoint (PUT)${NC}"
curl -s -X PUT "$API_URL/food-items/$FOOD_ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Oatmeal Updated",
    "brand": "Test Brand Premium",
    "description": "Updated description - premium steel cut oatmeal",
    "serving_size": 100,
    "serving_unit": "g",
    "calories": 340,
    "protein": 14,
    "carbohydrates": 60,
    "fat": 5,
    "fiber": 12,
    "sugar": 0,
    "sodium": 3,
    "tags": ["breakfast", "grain", "organic", "premium"],
    "is_verified": true,
    "food_group": "grains"
  }' | jq
check_status

# 6. Search for food items by name
echo -e "\n${YELLOW}Testing /food-items/search endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/search?query=oatmeal" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 7. Filter food items by nutrition values
echo -e "\n${YELLOW}Testing /food-items/filter endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/filter?min_protein=10&max_fat=10" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 8. Get food items by food group
echo -e "\n${YELLOW}Testing /food-items/group/{group} endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/group/grains" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 9. Get food items by tags
echo -e "\n${YELLOW}Testing /food-items/tags endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/tags?tags=breakfast,organic" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 10. Create another food item for bulk operations
echo -e "\n${YELLOW}Creating another test food item${NC}"
FOOD_ITEM_ID2=$(curl -s -X POST "$API_URL/food-items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Yogurt",
    "brand": "Test Brand",
    "description": "A test food item - Greek yogurt",
    "serving_size": 100,
    "serving_unit": "g",
    "calories": 120,
    "protein": 15,
    "carbohydrates": 6,
    "fat": 3,
    "fiber": 0,
    "sugar": 5,
    "sodium": 70,
    "tags": ["breakfast", "dairy", "protein"],
    "is_verified": true,
    "food_group": "dairy"
  }' | jq -r '._id')

if [ "$FOOD_ITEM_ID2" != "null" ] && [ -n "$FOOD_ITEM_ID2" ]; then
  echo -e "${GREEN}✓ Successfully created second food item with ID: $FOOD_ITEM_ID2${NC}"
else
  echo -e "${RED}✗ Failed to create second food item${NC}"
  FOOD_ITEM_ID2="f2d7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 11. Get food items by multiple IDs
echo -e "\n${YELLOW}Testing /food-items/bulk endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/bulk?ids=$FOOD_ITEM_ID,$FOOD_ITEM_ID2" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 12. Calculate nutrition for specific amount
echo -e "\n${YELLOW}Testing /food-items/$FOOD_ITEM_ID/calculate endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/$FOOD_ITEM_ID/calculate?amount=150&unit=g" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 13. Compare two food items
echo -e "\n${YELLOW}Testing /food-items/compare endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/compare?id1=$FOOD_ITEM_ID&id2=$FOOD_ITEM_ID2" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 14. Get food item suggestions based on nutrition targets
echo -e "\n${YELLOW}Testing /food-items/suggest endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/suggest?target_protein=20&target_calories=300" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 15. Create a new food item with custom nutrition data
echo -e "\n${YELLOW}Testing /food-items/custom endpoint (POST)${NC}"
CUSTOM_FOOD_ID=$(curl -s -X POST "$API_URL/food-items/custom" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Custom Recipe",
    "description": "A custom food item created by the user",
    "serving_size": 200,
    "serving_unit": "g",
    "calories": 450,
    "protein": 25,
    "carbohydrates": 45,
    "fat": 18,
    "fiber": 8,
    "sugar": 3,
    "sodium": 120,
    "is_custom": true,
    "tags": ["custom", "recipe", "homemade"],
    "food_group": "mixed"
  }' | jq -r '._id')

if [ "$CUSTOM_FOOD_ID" != "null" ] && [ -n "$CUSTOM_FOOD_ID" ]; then
  echo -e "${GREEN}✓ Successfully created custom food item with ID: $CUSTOM_FOOD_ID${NC}"
else
  echo -e "${RED}✗ Failed to create custom food item${NC}"
  CUSTOM_FOOD_ID="c1d7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 16. Get user's custom food items
echo -e "\n${YELLOW}Testing /food-items/custom endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/custom" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 17. Create a food item with a recipe (composed of other food items)
echo -e "\n${YELLOW}Testing /food-items/recipe endpoint (POST)${NC}"
RECIPE_ID=$(curl -s -X POST "$API_URL/food-items/recipe" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Yogurt Oatmeal Bowl\",
    \"description\": \"A combination of oatmeal and yogurt\",
    \"ingredients\": [
      {\"food_item_id\": \"$FOOD_ITEM_ID\", \"amount\": 75, \"unit\": \"g\"},
      {\"food_item_id\": \"$FOOD_ITEM_ID2\", \"amount\": 150, \"unit\": \"g\"}
    ],
    \"serving_size\": 225,
    \"serving_unit\": \"g\",
    \"tags\": [\"breakfast\", \"recipe\", \"high-protein\"],
    \"food_group\": \"mixed\"
  }" | jq -r '._id')

if [ "$RECIPE_ID" != "null" ] && [ -n "$RECIPE_ID" ]; then
  echo -e "${GREEN}✓ Successfully created recipe with ID: $RECIPE_ID${NC}"
else
  echo -e "${RED}✗ Failed to create recipe${NC}"
  RECIPE_ID="r1d7b0b9b9b9b9b9b9b9b9b9" # Fallback ID for testing
fi

# 18. Get food item recipes for a user
echo -e "\n${YELLOW}Testing /food-items/recipe endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/recipe" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 19. Get recently used food items
echo -e "\n${YELLOW}Testing /food-items/recent endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/recent" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 20. Get most frequently used food items
echo -e "\n${YELLOW}Testing /food-items/frequent endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/frequent" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

# 21. Import food items from external source or file (if supported)
echo -e "\n${YELLOW}Testing /food-items/import endpoint (POST)${NC}"
curl -s -X POST "$API_URL/food-items/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "csv",
    "data": [
      {
        "name": "Imported Apple",
        "serving_size": 100,
        "serving_unit": "g",
        "calories": 52,
        "protein": 0.3,
        "carbohydrates": 14,
        "fat": 0.2,
        "fiber": 2.4,
        "sugar": 10.4,
        "sodium": 1,
        "food_group": "fruits"
      }
    ]
  }' | jq
check_status

# 22. Export food items (if supported)
echo -e "\n${YELLOW}Testing /food-items/export endpoint (GET)${NC}"
curl -s -X GET "$API_URL/food-items/export?format=json" \
  -H "Authorization: Bearer $TOKEN" \
  | jq 'length'
check_status

# 23. Clean up - Delete all created food items
echo -e "\n${YELLOW}Cleaning up: Deleting first test food item${NC}"
curl -s -X DELETE "$API_URL/food-items/$FOOD_ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${YELLOW}Cleaning up: Deleting second test food item${NC}"
curl -s -X DELETE "$API_URL/food-items/$FOOD_ITEM_ID2" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${YELLOW}Cleaning up: Deleting custom food item${NC}"
curl -s -X DELETE "$API_URL/food-items/$CUSTOM_FOOD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${YELLOW}Cleaning up: Deleting recipe food item${NC}"
curl -s -X DELETE "$API_URL/food-items/$RECIPE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
check_status

echo -e "\n${GREEN}=== Food Item Management Tests Completed ====${NC}" 