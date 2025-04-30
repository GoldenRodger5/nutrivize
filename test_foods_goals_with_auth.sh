#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set the API base URL
API_URL="http://localhost:5001"

# Get user credentials if not provided
if [ -z "$1" ] || [ -z "$2" ]; then
  echo -e "${YELLOW}Please enter valid Firebase credentials${NC}"
  read -p "Email: " USER_EMAIL
  read -s -p "Password: " USER_PASSWORD
  echo ""
else
  USER_EMAIL=$1
  USER_PASSWORD=$2
fi

# Function to check if a command succeeded
check_status() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Success${NC}"
  else
    echo -e "${RED}✗ Failed${NC}"
  fi
}

echo -e "${BLUE}=== Nutrivize Foods and Goals Tests ====${NC}"

# 1. Login to get an authentication token
echo -e "\n${YELLOW}Authenticating with provided credentials${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

echo "$LOGIN_RESPONSE" | jq

# Extract token from response - the API returns it in the "token" field, not "access_token"
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Successfully obtained token${NC}"
  echo "Token: ${TOKEN:0:20}..."
else
  echo -e "${RED}✗ Failed to obtain token${NC}"
  echo "Cannot continue with authenticated endpoints. Please check credentials."
  echo -e "\n${GREEN}=== Tests Aborted ====${NC}"
  exit 1
fi

# 2. Test getting all foods with authentication
echo -e "\n${YELLOW}Testing /foods/ endpoint with authentication (GET)${NC}"
FOODS_RESPONSE=$(curl -s -X GET "$API_URL/foods/" \
  -H "Authorization: Bearer $TOKEN")

echo "$FOODS_RESPONSE" | jq
check_status

# 3. Get a specific food item ID
echo -e "\n${YELLOW}Getting first food ID from list${NC}"
FOOD_ID=$(echo "$FOODS_RESPONSE" | jq -r '.[0]._id')

if [ "$FOOD_ID" != "null" ] && [ -n "$FOOD_ID" ] && [ "$FOOD_ID" != "" ]; then
  echo -e "${GREEN}✓ Successfully obtained food ID: $FOOD_ID${NC}"

  # 4. Get specific food by ID
  echo -e "\n${YELLOW}Testing /foods/$FOOD_ID endpoint with authentication (GET)${NC}"
  curl -s -X GET "$API_URL/foods/$FOOD_ID" \
    -H "Authorization: Bearer $TOKEN" | jq
  check_status
else
  echo -e "${RED}✗ Failed to obtain food ID${NC}"
fi

# 5. Test getting all goals with authentication
echo -e "\n${YELLOW}Testing /goals/ endpoint with authentication (GET)${NC}"
curl -s -X GET "$API_URL/goals/" \
  -H "Authorization: Bearer $TOKEN" | jq
check_status

# 6. Test getting active goals with authentication
echo -e "\n${YELLOW}Testing /goals/active endpoint with authentication (GET)${NC}"
curl -s -X GET "$API_URL/goals/active" \
  -H "Authorization: Bearer $TOKEN" | jq
check_status

# 7. Test meal plan generation with authentication
echo -e "\n${YELLOW}Testing /generate-meal-plan endpoint with authentication (POST) - This may take a while${NC}"
curl -s -X POST "$API_URL/generate-meal-plan" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "sample_user_id",
    "days": 1,
    "preferences": {
      "dietary": ["balanced"],
      "meal_types": ["breakfast", "lunch", "dinner"]
    },
    "excluded_foods": [],
    "calories_per_day": 2000,
    "daily_targets": {
      "calories": 2000,
      "protein": 100,
      "carbs": 250,
      "fats": 65
    }
  }' | jq
check_status

# 8. Test chat API with authentication
echo -e "\n${YELLOW}Testing /api/chat endpoint with authentication (POST)${NC}"
curl -s -X POST "$API_URL/api/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What are some healthy breakfast ideas?"
      }
    ]
  }' | jq
check_status

echo -e "\n${GREEN}=== Foods and Goals Tests Completed ====${NC}" 