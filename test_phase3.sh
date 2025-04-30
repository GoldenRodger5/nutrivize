#!/bin/bash

echo "==== Phase 3 Test: Meal Repetition & Advanced Grocery List ===="

# Generate a meal plan with meal repetition
echo -e "\n1. Generating a 3-day meal plan with repetition..."
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
    },
    "allow_meal_repetition": true,
    "use_leftovers": true,
    "repeat_meals": {
      "breakfast": [2]
    },
    "leftover_settings": {
      "lunch": [2]
    }
  }')

# Extract the plan ID
PLAN_ID=$(echo "$RESPONSE" | grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | awk -F'"' '{print $4}')
echo "Plan ID: $PLAN_ID"

# Check if day 3 breakfast is a repeat
echo -e "\n2. Verifying day 3 breakfast is a repeat..."
REPEAT_ID=$(echo "$RESPONSE" | jq -r '.days[2].meals.breakfast.repeat_of_meal_id')
IS_REPEAT=$([[ "$REPEAT_ID" != "null" ]] && echo "true" || echo "false")
echo "Is day 3 breakfast a repeat? $IS_REPEAT"

# Check if day 3 lunch is leftovers
echo -e "\n3. Verifying day 3 lunch is leftovers..."
IS_LEFTOVER=$(echo "$RESPONSE" | jq -r '.days[2].meals.lunch.is_leftover')
echo "Is day 3 lunch leftovers? $IS_LEFTOVER"

# Check if leftovers have reduced cooking time
echo -e "\n4. Checking cooking time for leftovers..."
LEFTOVER_COOKING_TIME=$(echo "$RESPONSE" | jq -r '.days[2].meals.lunch.cooking_time')
echo "Leftover cooking time: $LEFTOVER_COOKING_TIME (should be reduced)"

# Check grocery list categories and costs
echo -e "\n5. Checking grocery list categories and estimated costs..."
CATEGORIES=$(echo "$RESPONSE" | jq -r '.grocery_list[] | .category' | sort | uniq | wc -l)
echo "Number of grocery categories: $CATEGORIES"

echo "Sample grocery items with costs:"
echo "$RESPONSE" | jq -r '.grocery_list | [.[] | {item: .item, category: .category, cost: .estimated_cost}][0:5]'

# Calculate total estimated cost
TOTAL_COST=$(echo "$RESPONSE" | jq '[.grocery_list[] | .estimated_cost] | add')
echo -e "\nEstimated total grocery cost: $TOTAL_COST"

echo -e "\n==== Phase 3 Test Complete =====" 