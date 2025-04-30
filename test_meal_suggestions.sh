#!/bin/bash

echo "=== Testing Basic Meal Suggestion ==="
curl -X POST http://localhost:8000/suggest-meal \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "isaac_mineo",
    "meal_type": "dinner",
    "time_of_day": "18:00",
    "preference": null,
    "remaining_macros": {
      "calories": 800,
      "protein": 40,
      "carbs": 80,
      "fat": 30
    },
    "use_food_index_only": true
  }' | grep -q "suggestions" && echo "✅ Basic meal suggestion passed" || echo "❌ Basic meal suggestion failed"

echo "=== Testing with Dietary Preference ==="
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
    "use_food_index_only": true
  }' | grep -q "suggestions" && echo "✅ Preference filter passed" || echo "❌ Preference filter failed"

echo "=== Testing with Specific Ingredients ==="
curl -X POST http://localhost:8000/suggest-meal \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "isaac_mineo",
    "meal_type": "dinner",
    "time_of_day": "18:00",
    "remaining_macros": {
      "calories": 800,
      "protein": 40,
      "carbs": 80,
      "fat": 30
    },
    "use_food_index_only": true,
    "specific_ingredients": ["Chicken"]
  }' | grep -q "suggestions" && echo "✅ Specific ingredients filter passed" || echo "❌ Specific ingredients filter failed"

echo "=== Testing with Calorie Range ==="
curl -X POST http://localhost:8000/suggest-meal \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "isaac_mineo",
    "meal_type": "dinner",
    "time_of_day": "18:00",
    "remaining_macros": {
      "calories": 800,
      "protein": 40,
      "carbs": 80,
      "fat": 30
    },
    "use_food_index_only": true,
    "calorie_range": {"min": 400, "max": 600}
  }' | grep -q "suggestions" && echo "✅ Calorie range filter passed" || echo "❌ Calorie range filter failed"

echo "=== Testing with Diet Type ==="
curl -X POST http://localhost:8000/suggest-meal \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "isaac_mineo",
    "meal_type": "dinner",
    "time_of_day": "18:00",
    "remaining_macros": {
      "calories": 800,
      "protein": 40,
      "carbs": 80,
      "fat": 30
    },
    "use_food_index_only": true,
    "diet_type": "high-protein"
  }' | grep -q "suggestions" && echo "✅ Diet type filter passed" || echo "❌ Diet type filter failed"

echo "=== Testing with Cooking Time ==="
curl -X POST http://localhost:8000/suggest-meal \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "isaac_mineo",
    "meal_type": "dinner",
    "time_of_day": "18:00",
    "remaining_macros": {
      "calories": 800,
      "protein": 40,
      "carbs": 80,
      "fat": 30
    },
    "use_food_index_only": true,
    "cooking_time": 30
  }' | grep -q "suggestions" && echo "✅ Cooking time filter passed" || echo "❌ Cooking time filter failed"

echo "=== Testing Multiple Filters Combined ==="
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
    "specific_ingredients": ["Chicken"],
    "calorie_range": {"min": 400, "max": 600},
    "cooking_time": 30
  }' | grep -q "suggestions" && echo "✅ Multiple filters passed" || echo "❌ Multiple filters failed" 