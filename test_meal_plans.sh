#!/bin/bash

# Function to extract the meal plan ID from a JSON response
extract_plan_id() {
  echo "$1" | grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | awk -F'"' '{print $4}'
}

echo "==== Testing Meal Plan Generation (Single Day) ===="
RESPONSE=$(curl -s -X POST http://localhost:8000/generate-meal-plan \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "isaac_mineo",
    "days": 1,
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

echo $RESPONSE | json_pp

# Extract the plan ID for use in subsequent tests
PLAN_ID=$(extract_plan_id "$RESPONSE")
echo -e "\nExtracted Plan ID: $PLAN_ID"

echo -e "\n==== Testing Get Active Meal Plan ===="
curl -s -X GET "http://localhost:8000/meal-plans/active?user_id=isaac_mineo" | json_pp

echo -e "\n==== Testing Logging a Meal from Meal Plan ===="
curl -s -X POST "http://localhost:8000/meal-plans/$PLAN_ID/log-meal?user_id=isaac_mineo&day_index=0&meal_type=breakfast" | json_pp

echo -e "\n==== Testing Getting Active Meal Plan After Logging ===="
curl -s -X GET "http://localhost:8000/meal-plans/active?user_id=isaac_mineo" | json_pp

echo -e "\n==== Testing Meal Plan Generation (Multiple Days) ===="
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

echo $RESPONSE | json_pp

# Extract the multi-day plan ID
MULTI_DAY_PLAN_ID=$(extract_plan_id "$RESPONSE")
echo -e "\nExtracted Multi-Day Plan ID: $MULTI_DAY_PLAN_ID"

echo -e "\n==== Testing Logging a Meal from Multi-Day Meal Plan (Day 2) ===="
curl -s -X POST "http://localhost:8000/meal-plans/$MULTI_DAY_PLAN_ID/log-meal?user_id=isaac_mineo&day_index=1&meal_type=lunch" | json_pp 