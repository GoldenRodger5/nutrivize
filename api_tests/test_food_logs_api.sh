#!/bin/bash

# Test food and logs endpoints with curl
BASE_URL="http://127.0.0.1:5001"
TOKEN=""
USER_ID=""
FOOD_ID=""
LOG_ID=""

# Colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Food & Logs API Endpoint Tests${NC}"
echo "========================================"

# Login to get a token first
login() {
  echo -e "\n${YELLOW}Logging in to get a token...${NC}"
  
  local response=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"testpassword123"}')
  
  # Extract token and user ID
  TOKEN=$(echo "$response" | jq -r '.token')
  USER_ID=$(echo "$response" | jq -r '.uid')
  
  if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    echo "Token: ${TOKEN:0:15}..."
    echo "User ID: $USER_ID"
  else
    echo -e "${RED}✗ Login failed${NC}"
    echo "Cannot proceed with tests without a valid token"
    exit 1
  fi
}

# Test GET /foods endpoint (list all foods)
test_get_foods() {
  echo -e "\n${YELLOW}Testing GET /foods (List all foods)${NC}"
  echo "----------------------------------------"
  
  local response=$(curl -s -X GET "${BASE_URL}/foods" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
  
  echo "Response (showing first food item):"
  echo "$response" | jq '.[0]' 2>/dev/null || echo "$response"
  
  local count=$(echo "$response" | jq 'length')
  echo "Total food items: $count"
  
  if [ "$count" -gt 0 ]; then
    echo -e "${GREEN}✓ Success - foods retrieved${NC}"
    return 0
  else
    echo -e "${YELLOW}! Warning - no foods found${NC}"
    return 1
  fi
}

# Test POST /foods endpoint (create a food item)
test_create_food() {
  echo -e "\n${YELLOW}Testing POST /foods/ (Create a food item)${NC}"
  echo "----------------------------------------"
  
  # Create a food item with a unique name using timestamp
  local timestamp=$(date +%s)
  local food_name="Test Food Item $timestamp"
  
  local response=$(curl -s -X POST "${BASE_URL}/foods/" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${food_name}\",\"serving_size\":100,\"serving_unit\":\"g\",\"calories\":150,\"proteins\":10,\"carbs\":20,\"fats\":5,\"fiber\":3,\"source\":\"test\",\"meal_compatibility\":[\"breakfast\",\"lunch\"]}")
  
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  
  # Extract food ID
  FOOD_ID=$(echo "$response" | jq -r '.id')
  
  if [ "$FOOD_ID" != "null" ] && [ "$FOOD_ID" != "" ]; then
    echo -e "${GREEN}✓ Success - food item created${NC}"
    echo "Food ID: $FOOD_ID"
    return 0
  else
    echo -e "${RED}✗ Failed to create food item${NC}"
    return 1
  fi
}

# Test GET /foods/{food_id} endpoint (get a specific food)
test_get_food() {
  echo -e "\n${YELLOW}Testing GET /foods/$FOOD_ID (Get specific food)${NC}"
  echo "----------------------------------------"
  
  if [ -z "$FOOD_ID" ]; then
    echo -e "${RED}No food ID available, skipping test${NC}"
    return 1
  fi
  
  local response=$(curl -s -X GET "${BASE_URL}/foods/${FOOD_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
  
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  
  local name=$(echo "$response" | jq -r '.name')
  
  if [ "$name" != "null" ] && [ "$name" != "" ]; then
    echo -e "${GREEN}✓ Success - food item retrieved${NC}"
    return 0
  else
    echo -e "${RED}✗ Failed to retrieve food item${NC}"
    return 1
  fi
}

# Test PUT /foods/{food_id} endpoint (update a food)
test_update_food() {
  echo -e "\n${YELLOW}Testing PUT /foods/$FOOD_ID (Update food)${NC}"
  echo "----------------------------------------"
  
  if [ -z "$FOOD_ID" ]; then
    echo -e "${RED}No food ID available, skipping test${NC}"
    return 1
  fi
  
  local new_calories=175
  
  local response=$(curl -s -X PUT "${BASE_URL}/foods/${FOOD_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Updated Test Food\",\"serving_size\":100,\"serving_unit\":\"g\",\"calories\":${new_calories},\"proteins\":12,\"carbs\":18,\"fats\":6,\"fiber\":4,\"source\":\"test\",\"meal_compatibility\":[\"breakfast\",\"lunch\",\"dinner\"]}")
  
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  
  local success=$(echo "$response" | jq -r '.success')
  
  if [ "$success" = "true" ]; then
    echo -e "${GREEN}✓ Success - food item updated${NC}"
    return 0
  else
    echo -e "${RED}✗ Failed to update food item${NC}"
    return 1
  fi
}

# Test POST /logs/ endpoint (create a food log entry)
test_create_log() {
  echo -e "\n${YELLOW}Testing POST /logs/ (Create a food log)${NC}"
  echo "----------------------------------------"
  
  if [ -z "$FOOD_ID" ]; then
    echo -e "${RED}No food ID available, skipping test${NC}"
    return 1
  fi
  
  # Create a log entry using the current date/time
  local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  local response=$(curl -s -X POST "${BASE_URL}/logs/" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"date\":\"${now}\",\"meal_type\":\"lunch\",\"food_id\":\"${FOOD_ID}\",\"name\":\"Updated Test Food\",\"amount\":1.5,\"unit\":\"serving\",\"calories\":262.5,\"proteins\":18,\"carbs\":27,\"fats\":9,\"fiber\":6,\"notes\":\"API test log entry\"}")
  
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  
  # Extract log ID
  LOG_ID=$(echo "$response" | jq -r '.id')
  
  if [ "$LOG_ID" != "null" ] && [ "$LOG_ID" != "" ]; then
    echo -e "${GREEN}✓ Success - log entry created${NC}"
    echo "Log ID: $LOG_ID"
    return 0
  else
    echo -e "${RED}✗ Failed to create log entry${NC}"
    return 1
  fi
}

# Test GET /logs endpoint (get logs for today)
test_get_logs() {
  echo -e "\n${YELLOW}Testing GET /logs (Get today's logs)${NC}"
  echo "----------------------------------------"
  
  local today=$(date -u +"%Y-%m-%d")
  
  local response=$(curl -s -X GET "${BASE_URL}/logs?date=${today}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
  
  echo "Response (summary):"
  echo "$response" | jq '.logs | length' 2>/dev/null || echo "$response"
  
  local log_count=$(echo "$response" | jq '.logs | length')
  
  echo "Number of logs for today: $log_count"
  
  if [ "$log_count" -gt 0 ]; then
    echo -e "${GREEN}✓ Success - logs retrieved${NC}"
    return 0
  else
    echo -e "${YELLOW}! Warning - no logs found for today${NC}"
    return 1
  fi
}

# Test GET /logs/range endpoint (get logs for a date range)
test_get_logs_range() {
  echo -e "\n${YELLOW}Testing GET /logs/range (Get logs for date range)${NC}"
  echo "----------------------------------------"
  
  local today=$(date -u +"%Y-%m-%d")
  local week_ago=$(date -u -v-7d +"%Y-%m-%d")
  
  local response=$(curl -s -X GET "${BASE_URL}/logs/range?start_date=${week_ago}&end_date=${today}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
  
  echo "Response (summary):"
  echo "$response" | jq '.date_range | length' 2>/dev/null || echo "$response"
  
  local days_count=$(echo "$response" | jq '.date_range | length')
  
  echo "Number of days in range: $days_count"
  
  if [ "$days_count" -gt 0 ]; then
    echo -e "${GREEN}✓ Success - log range retrieved${NC}"
    return 0
  else
    echo -e "${RED}✗ Failed to retrieve log range${NC}"
    return 1
  fi
}

# Test DELETE /logs/{log_id} endpoint (delete a log entry)
test_delete_log() {
  echo -e "\n${YELLOW}Testing DELETE /logs/$LOG_ID (Delete log entry)${NC}"
  echo "----------------------------------------"
  
  if [ -z "$LOG_ID" ]; then
    echo -e "${RED}No log ID available, skipping test${NC}"
    return 1
  fi
  
  local response=$(curl -s -X DELETE "${BASE_URL}/logs/${LOG_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
  
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  
  local success=$(echo "$response" | jq -r '.success')
  
  if [ "$success" = "true" ]; then
    echo -e "${GREEN}✓ Success - log entry deleted${NC}"
    return 0
  else
    echo -e "${RED}✗ Failed to delete log entry${NC}"
    return 1
  fi
}

# Test DELETE /foods/{food_id} endpoint (delete a food)
test_delete_food() {
  echo -e "\n${YELLOW}Testing DELETE /foods/$FOOD_ID (Delete food)${NC}"
  echo "----------------------------------------"
  
  if [ -z "$FOOD_ID" ]; then
    echo -e "${RED}No food ID available, skipping test${NC}"
    return 1
  fi
  
  local response=$(curl -s -X DELETE "${BASE_URL}/foods/${FOOD_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
  
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  
  local success=$(echo "$response" | jq -r '.success')
  
  if [ "$success" = "true" ]; then
    echo -e "${GREEN}✓ Success - food item deleted${NC}"
    return 0
  else
    echo -e "${RED}✗ Failed to delete food item${NC}"
    return 1
  fi
}

# Run the tests
login
test_get_foods
test_create_food
test_get_food
test_update_food
test_create_log
test_get_logs
test_get_logs_range
test_delete_log
test_delete_food

echo -e "\n${YELLOW}Food & Logs API Tests Completed${NC}" 