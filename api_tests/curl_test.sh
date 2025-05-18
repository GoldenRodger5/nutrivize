#!/bin/bash
# Curl script to test the Nutrivize chatbot API directly

API_URL="http://localhost:5001/api/chat"
AUTH_HEADER="Authorization: Bearer test_user_token"

# Helper function to send a chat request and print the response
function send_chat_request() {
  local message="$1"
  local description="$2"
  
  echo "===== Testing: $description ====="
  echo "Request: $message"
  
  response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{\"message\": \"$message\"}")
  
  echo "Response:"
  echo "$response" | jq '.response' -r
  echo ""
}

# 1. Test food logging
send_chat_request "Log an apple as a snack with 95 calories, 0.5g protein, 25g carbs, and 0.3g fat" "Food Logging"

# 2. Test meal suggestion - this has the JSON parsing issue to test our fix
send_chat_request "Suggest a high-protein dinner with around 600 calories" "Meal Suggestion"

# 3. Test meal plan generation
send_chat_request "Create a 3-day meal plan with high-protein, low-carb preferences" "Meal Plan Generation"

# 4. Test goal modification with well-formed request
send_chat_request "Update my calorie target to 2100 in my current goal" "Goal Modification - Well Formed"

# 5. Test goal modification with malformed request (simulating the issue)
send_chat_request "Set my daily calorie goal to 2000 in my weight loss plan" "Goal Modification - Potentially Malformed"

# 6. Test view meal plan
send_chat_request "Show me my current meal plan" "View Meal Plan"

echo "All tests completed" 