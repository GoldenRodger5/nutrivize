#!/bin/bash

echo "==== Running Verbose Test with Multiple Filters ===="
echo "This test will show the full API response for detailed debugging"

echo "Sending request with multiple filters..."
curl -X POST http://localhost:8000/suggest-meal \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "isaac_mineo",
    "meal_type": "dinner",
    "time_of_day": "18:00",
    "preference": "healthy",
    "remaining_macros": {
      "calories": 800,
      "protein": 40,
      "carbs": 80,
      "fat": 30
    },
    "use_food_index_only": true,
    "specific_ingredients": ["Chicken", "Rice"],
    "calorie_range": {"min": 400, "max": 600},
    "diet_type": "high-protein",
    "cooking_time": 30
  }'

echo -e "\n\n==== Running Test with Specific Filters that Failed Previously ===="
echo "Sending request with the specific steak combination that failed earlier..."
curl -X POST http://localhost:8000/suggest-meal \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "isaac_mineo",
    "meal_type": "dinner",
    "time_of_day": "18:00",
    "preference": "steak",
    "remaining_macros": {
      "calories": 800,
      "protein": 40,
      "carbs": 80,
      "fat": 30
    },
    "use_food_index_only": true,
    "calorie_range": {"min": 400, "max": 600}
  }'

echo -e "\n\nTests completed. Check the responses for any errors." 