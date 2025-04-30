#!/bin/bash

# Function to extract the meal plan ID from a JSON response
extract_plan_id() {
  echo "$1" | grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | awk -F'"' '{print $4}'
}

echo "==== Phase 2 Simplified Verification ===="

# 1. Generate a new 3-day meal plan
echo -e "\n1. Generating a 3-day meal plan"
RESPONSE=$(curl -s -X POST http://localhost:8000/generate-meal-plan \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "isaac_mineo",
    "days": 3,
    "start_date": "2023-10-19",
    "meal_types": ["breakfast", "lunch", "dinner"],
    "daily_targets": {
      "calories": 2000,
      "protein": 150,
      "carbs": 200,
      "fat": 65
    },
    "preferences": {
      "diet_type": "high-protein",
      "preferred_ingredients": ["Chicken", "Rice"]
    }
  }')

# Extract the plan ID 
PLAN_ID=$(extract_plan_id "$RESPONSE")
echo "Plan ID: $PLAN_ID"

# 2. Verify plan was created with 3 days
echo -e "\n2. Verifying plan has 3 days"
DAYS_COUNT=$(curl -s -X GET "http://localhost:8000/meal-plans/active?user_id=isaac_mineo" | jq '.days | length')
echo "Number of days in plan: $DAYS_COUNT"

# 3. Verify the plan name includes date range
echo -e "\n3. Verifying plan name includes date range"
PLAN_NAME=$(curl -s -X GET "http://localhost:8000/meal-plans/active?user_id=isaac_mineo" | jq -r '.name')
echo "Plan name: $PLAN_NAME"

# 4. Verify the grocery list has consolidated items
echo -e "\n4. Verifying grocery list consolidation"
GROCERY_COUNT=$(curl -s -X GET "http://localhost:8000/meal-plans/active?user_id=isaac_mineo" | jq '.grocery_list | length')
echo "Grocery list items: $GROCERY_COUNT"

# 5. Test logging a meal from Day 1
echo -e "\n5. Testing meal logging from Day 1"
echo "Response from logging breakfast Day 1:"
curl -s -X POST "http://localhost:8000/meal-plans/$PLAN_ID/log-meal?user_id=isaac_mineo&day_index=0&meal_type=breakfast"

# Check if days are marked complete
echo -e "\n\n6. Checking completion status of days"
echo "Day 1 complete status:"
curl -s -X GET "http://localhost:8000/meal-plans/active?user_id=isaac_mineo" | jq '.days[0].is_complete'

echo -e "\n==== Phase 2 Verification Complete ====" 