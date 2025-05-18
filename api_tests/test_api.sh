#!/bin/bash

# Test API endpoints with curl
BASE_URL="http://127.0.0.1:5001"
TOKEN=""
USER_ID=""

# Colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting API Endpoint Tests${NC}"
echo "========================================"

# Function to make a request and display the result
request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local auth=$4

  echo -e "\n${YELLOW}Testing: ${method} ${endpoint}${NC}"
  echo "----------------------------------------"
  
  if [ "$method" = "GET" ]; then
    if [ -n "$auth" ]; then
      response=$(curl -s -X GET "${BASE_URL}${endpoint}" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json")
    else
      response=$(curl -s -X GET "${BASE_URL}${endpoint}" \
        -H "Content-Type: application/json")
    fi
  else
    if [ -n "$auth" ]; then
      response=$(curl -s -X ${method} "${BASE_URL}${endpoint}" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "${data}")
    else
      response=$(curl -s -X ${method} "${BASE_URL}${endpoint}" \
        -H "Content-Type: application/json" \
        -d "${data}")
    fi
  fi

  # Extract status from the response
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  
  if [ "$?" -eq 0 ]; then
    echo -e "${GREEN}✓ Success${NC}"
  else
    echo -e "${RED}✗ Failed${NC}"
  fi
}

# Test root endpoint to ensure API is alive
echo -e "\n${YELLOW}1. Testing API Health${NC}"
request "GET" "/" "" ""

# Test authentication endpoints
echo -e "\n${YELLOW}2. Testing Authentication${NC}"

# Login
echo -e "\n${YELLOW}Testing Login${NC}"
login_response=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}')

echo "Login response:"
echo "$login_response" | jq '.' 2>/dev/null || echo "$login_response"

# Extract token and user ID
TOKEN=$(echo "$login_response" | jq -r '.token')
USER_ID=$(echo "$login_response" | jq -r '.uid')

echo "Extracted token: ${TOKEN:0:10}..."
echo "Extracted user ID: $USER_ID"

# Test current user endpoint
request "GET" "/auth/me" "" "auth"

# Test food endpoints
echo -e "\n${YELLOW}3. Testing Food Endpoints${NC}"
request "GET" "/foods" "" "auth"

# Create a food item
FOOD_ID=""
echo -e "\n${YELLOW}Creating a food item${NC}"
food_response=$(curl -s -X POST "${BASE_URL}/foods/" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Banana","serving_size":100,"serving_unit":"g","calories":89,"proteins":1.1,"carbs":22.8,"fats":0.3,"fiber":2.6,"source":"test","meal_compatibility":["breakfast","snack"]}')

echo "Food creation response:"
echo "$food_response" | jq '.' 2>/dev/null || echo "$food_response"

# Extract food ID
FOOD_ID=$(echo "$food_response" | jq -r '.id')
echo "Created food ID: $FOOD_ID"

# Get specific food
if [ -n "$FOOD_ID" ]; then
  request "GET" "/foods/${FOOD_ID}" "" "auth"
else
  echo "Skipping food GET as no ID was retrieved"
fi

# Test food logs
echo -e "\n${YELLOW}4. Testing Food Log Endpoints${NC}"

# Create a food log
echo -e "\n${YELLOW}Creating a food log${NC}"
log_response=$(curl -s -X POST "${BASE_URL}/logs/" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"date\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"meal_type\":\"breakfast\",\"food_id\":\"${FOOD_ID}\",\"name\":\"Test Banana\",\"amount\":1,\"unit\":\"serving\",\"calories\":89,\"proteins\":1.1,\"carbs\":22.8,\"fats\":0.3,\"fiber\":2.6,\"notes\":\"Test log entry\"}")

echo "Log creation response:"
echo "$log_response" | jq '.' 2>/dev/null || echo "$log_response"

# Extract log ID
LOG_ID=$(echo "$log_response" | jq -r '.id')
echo "Created log ID: $LOG_ID"

# Get today's logs
TODAY=$(date -u +"%Y-%m-%d")
request "GET" "/logs?date=${TODAY}" "" "auth"

# Test goals
echo -e "\n${YELLOW}5. Testing Goal Endpoints${NC}"

# Create a goal
echo -e "\n${YELLOW}Creating a goal${NC}"
goal_response=$(curl -s -X POST "${BASE_URL}/goals/" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"weight loss\",\"weight_target\":{\"current\":80,\"goal\":75,\"weekly_rate\":0.5},\"nutrition_targets\":[{\"name\":\"Weight Loss\",\"daily_calories\":1800,\"proteins\":140,\"carbs\":180,\"fats\":60,\"fiber\":25,\"water\":2000,\"applies_to\":[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\",\"saturday\",\"sunday\"]}]}")

echo "Goal creation response:"
echo "$goal_response" | jq '.' 2>/dev/null || echo "$goal_response"

# Extract goal ID
GOAL_ID=$(echo "$goal_response" | jq -r '.id')
echo "Created goal ID: $GOAL_ID"

# Get active goal
request "GET" "/goals/active" "" "auth"

# Test meal suggestions
echo -e "\n${YELLOW}6. Testing Meal Suggestion Endpoints${NC}"
request "POST" "/suggest-meal" "{\"user_id\":\"${USER_ID}\",\"meal_type\":\"breakfast\",\"remaining_calories\":500,\"remaining_protein\":30,\"remaining_carbs\":60,\"remaining_fat\":15}" "auth"

# Test meal plans
echo -e "\n${YELLOW}7. Testing Meal Plan Endpoints${NC}"
request "POST" "/generate-meal-plan" "{\"user_id\":\"${USER_ID}\",\"name\":\"Test Meal Plan\",\"num_days\":3,\"meal_types\":[\"breakfast\",\"lunch\",\"dinner\"],\"daily_calories\":2000,\"daily_protein\":120,\"daily_carbs\":200,\"daily_fat\":60}" "auth"

# Get meal plans
request "GET" "/meal-plans" "" "auth"

# Test health data endpoints
echo -e "\n${YELLOW}8. Testing Health Data Endpoints${NC}"
request "POST" "/api/health/data" "{\"date\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"data_type\":\"steps\",\"value\":8000,\"unit\":\"steps\",\"source\":\"test\"}" "auth"

# Get health data
request "GET" "/api/health/data" "" "auth"

# Test widget preferences
echo -e "\n${YELLOW}9. Testing Widget Preferences${NC}"
request "GET" "/user/widgets" "" "auth"

# Test insights
echo -e "\n${YELLOW}10. Testing Insights Endpoints${NC}"
request "GET" "/api/insights-trends" "" "auth"

echo -e "\n${YELLOW}All API tests completed${NC}" 