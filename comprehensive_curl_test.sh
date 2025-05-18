#!/bin/bash
# Comprehensive curl test script for Nutrivize AI chatbot

API_URL="http://localhost:5001/api/chat"
AUTH_HEADER="Authorization: Bearer test_user_token"

# Test counter for tracking progress
TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0

# Colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to send a chat request and analyze the response
function send_chat_request() {
  TEST_COUNT=$((TEST_COUNT + 1))
  local message="$1"
  local description="$2"
  local expected_pattern="$3"
  local error_pattern="$4"
  
  echo -e "\n${BLUE}===== TEST #${TEST_COUNT}: ${description} =====${NC}"
  echo -e "${YELLOW}Request:${NC} $message"
  
  response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{\"message\": \"$message\"}")
  
  # Extract just the response field
  response_text=$(echo "$response" | jq -r '.response // empty')
  
  echo -e "${YELLOW}Response:${NC}"
  echo "$response_text"
  
  # Check if response contains expected pattern
  if [ -n "$error_pattern" ] && echo "$response_text" | grep -q "$error_pattern"; then
    echo -e "${RED}✘ FAILED: Response contains error pattern: '$error_pattern'${NC}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  elif [ -z "$expected_pattern" ] || echo "$response_text" | grep -q "$expected_pattern"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo -e "${RED}✘ FAILED: Response does not contain expected pattern: '$expected_pattern'${NC}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

# Start server if not running (assumes server is in standard location)
if ! curl -s "http://localhost:5001/health" > /dev/null; then
  echo "Server not running. Attempting to start server..."
  cd ../
  nohup ./start-server.sh > server.log 2>&1 &
  sleep 5
  if ! curl -s "http://localhost:5001/health" > /dev/null; then
    echo "Failed to start server. Please start it manually."
    exit 1
  fi
  echo "Server started successfully."
  cd api_tests
fi

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   NUTRIVIZE AI CHATBOT - CURL TESTS    ${NC}"
echo -e "${BLUE}=========================================${NC}"

# 1. Test basic conversation
send_chat_request "Hello, how are you?" "Basic Conversation" "Hello" "error"

# 2. Test food logging with complete info
send_chat_request "Log an apple for breakfast with 95 calories, 0.5g protein, 25g carbs, and 0.3g fat" "Food Logging - Complete Info" "logged.*apple" "couldn't log"

# 3. Test food logging with missing fields
send_chat_request "Log a banana as a snack" "Food Logging - Missing Fields" "logged.*banana" "couldn't log"

# 4. Test meal suggestion - this tests the JSON parsing fix
send_chat_request "Suggest a high-protein dinner with around 600 calories" "Meal Suggestion - Standard" "Here are some meal suggestions" "couldn't generate meal suggestions"

# 5. Test meal suggestion with specific ingredients
send_chat_request "Suggest a lunch with chicken and rice" "Meal Suggestion - Specific Ingredients" "Here are some meal suggestions" "couldn't generate meal suggestions"

# 6. Test meal plan generation - short-term
send_chat_request "Create a 3-day meal plan with high-protein preferences" "Meal Plan Generation - Short Term" "created a meal plan" "couldn't create"

# 7. Test meal plan view
send_chat_request "Show me my current meal plan" "View Meal Plan" "meal plan|don't have any active" "I couldn't retrieve"

# 8. Test goal modification with well-formed request
send_chat_request "Update my calorie target to 2100 in my current goal" "Goal Modification - Well Formed" "updated your goal" "couldn't update"

# 9. Test goal modification with malformed request
send_chat_request "Set my daily calorie goal to 2000" "Goal Modification - Potentially Malformed" "updated your goal" "couldn't update"

# 10. Test nutritional information query
send_chat_request "What's the nutritional information for a banana?" "Nutritional Query" "calories|protein|carbs|fat" "don't have information"

# 11. Test tracking progress
send_chat_request "How am I doing with my nutrition goals today?" "Progress Tracking" "progress|goals|consumed" "don't have enough information"

# 12. Test food logging with non-existent food
send_chat_request "Log some moon cheese" "Food Logging - Non-existent Food" "logged|approximated|couldn't find" "couldn't log"

# 13. Test summarizing nutrition
send_chat_request "Summarize my nutrition for today" "Nutrition Summary" "consumed|remaining|total" "don't have enough information"

# 14. Test calorie calculation
send_chat_request "How many calories should I eat daily for maintenance?" "Calorie Calculation" "calories|maintain|weight" "need more information"

# Print test summary
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}             TEST SUMMARY              ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "Total tests:  ${TEST_COUNT}"
echo -e "${GREEN}Tests passed: ${PASS_COUNT}${NC}"
echo -e "${RED}Tests failed: ${FAIL_COUNT}${NC}"

# Exit with failure if any tests failed
if [ $FAIL_COUNT -gt 0 ]; then
  exit 1
fi

exit 0 