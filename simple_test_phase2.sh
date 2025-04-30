#!/bin/bash

# Function to extract the meal plan ID from a JSON response
extract_plan_id() {
  echo "$1" | grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | awk -F'"' '{print $4}'
}

echo "==== Testing Phase 2: Simple 2-Day Meal Plan Generation ===="
RESPONSE=$(curl -s -X POST http://localhost:8000/generate-meal-plan \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "isaac_mineo",
    "days": 2,
    "start_date": "2023-10-19",
    "meal_types": ["breakfast", "lunch"],
    "daily_targets": {
      "calories": 1200,
      "protein": 100,
      "carbs": 120,
      "fat": 40
    },
    "preferences": {
      "diet_type": "high-protein"
    }
  }')

echo "Generated a 2-day meal plan"
# Extract the plan ID
PLAN_ID=$(extract_plan_id "$RESPONSE")
echo -e "\nExtracted Plan ID: $PLAN_ID"

echo -e "\n==== Testing Get Active Meal Plan ===="
curl -s -X GET "http://localhost:8000/meal-plans/active?user_id=isaac_mineo" | jq -c '.days | length'

echo -e "\n==== Testing Logging Meals from Different Days ===="
echo "Logging breakfast from Day 1..."
curl -s -X POST "http://localhost:8000/meal-plans/$PLAN_ID/log-meal?user_id=isaac_mineo&day_index=0&meal_type=breakfast" | jq '.message'

echo "Logging lunch from Day 2..."
curl -s -X POST "http://localhost:8000/meal-plans/$PLAN_ID/log-meal?user_id=isaac_mineo&day_index=1&meal_type=lunch" | jq '.message'

echo -e "\n==== Checking Grocery List Consolidation ===="
echo "Number of grocery items:"
curl -s -X GET "http://localhost:8000/meal-plans/active?user_id=isaac_mineo" | jq '.grocery_list | length'

echo -e "\n==== Done ====" 