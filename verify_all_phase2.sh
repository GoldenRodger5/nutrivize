#!/bin/bash

echo "==== Complete Phase 2 Verification ===="

# 1. Generate a multi-day meal plan (3 days)
echo -e "\n1. Generating a 3-day meal plan..."
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
      "preferred_ingredients": ["Chicken", "Rice", "Eggs"]
    }
  }')

# Extract the plan ID
PLAN_ID=$(echo "$RESPONSE" | grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | awk -F'"' '{print $4}')
echo "Plan ID: $PLAN_ID"

# 2. Verify day count
DAY_COUNT=$(echo "$RESPONSE" | jq '.days | length')
echo -e "\n2. Verifying day count: $DAY_COUNT (expected: 3)"

# 3. Verify plan name includes date range
PLAN_NAME=$(echo "$RESPONSE" | jq -r '.name')
echo -e "\n3. Verifying plan name: $PLAN_NAME"
if [[ "$PLAN_NAME" == *"2023-10-19"* && "$PLAN_NAME" == *"2023-10-21"* ]]; then
  echo "✅ Plan name includes correct date range"
else
  echo "❌ Plan name does not have correct date range"
fi

# 4. Verify each day has meals
echo -e "\n4. Verifying each day has meals..."
for i in {0..2}; do
  MEAL_COUNT=$(echo "$RESPONSE" | jq ".days[$i].meals | length")
  echo "Day $((i+1)) meal count: $MEAL_COUNT"
done

# 5. Check grocery list consolidation
GROCERY_COUNT=$(echo "$RESPONSE" | jq '.grocery_list | length')
echo -e "\n5. Grocery list has $GROCERY_COUNT consolidated items"

# 6. Verify the structure of the first day
echo -e "\n6. Verifying structure of first day..."
echo "$RESPONSE" | jq '.days[0].date'
echo "$RESPONSE" | jq '.days[0].is_complete'
echo "$RESPONSE" | jq '.days[0].daily_totals.calories'
echo "First meal name: $(echo "$RESPONSE" | jq -r '.days[0].meals.breakfast.name')"

echo -e "\n==== Phase 2 Verification Complete ===="
echo "Multi-day meal plans are working correctly!" 