#!/bin/bash
# Simple curl test script for testing our fixes

API_URL="http://localhost:5001/api/chat"
AUTH_HEADER="Authorization: Bearer test_user_token"

# Helper function to send a chat request
function test_chat() {
  local message="$1"
  local description="$2"
  
  echo "===== Testing: ${description} ====="
  echo "Request: $message"
  
  response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{\"message\": \"$message\"}")
  
  # Extract the response
  response_text=$(echo "$response" | jq -r '.response // empty')
  
  echo "Response:"
  echo "$response_text"
  echo "----------------------------------------"
}

echo "========================================="
echo "   TESTING AI CHATBOT FUNCTIONALITY     "
echo "========================================="

# 1. Test meal suggestion - this has the JSON parsing issue to test our fix
test_chat "Suggest a high-protein dinner with around 600 calories" "Meal Suggestion Fix"

# 2. Test goal modification with potentially malformed request
test_chat "Update my daily calorie goal to 2100" "Goal Modification Fix"

# 3. Test meal plan view
test_chat "Show me my current meal plan" "Meal Plan View Fix"

# 4. Test food logging with minimal info
test_chat "Log a banana as a snack" "Food Logging with Missing Fields"

# 5. Test meal suggestion with specific ingredients
test_chat "Suggest a lunch with chicken and broccoli" "Meal Suggestion with Ingredients"

echo "All tests completed" 