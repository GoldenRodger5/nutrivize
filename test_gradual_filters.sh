#!/bin/bash

# Function to test a specific combination and check if it succeeds
test_combination() {
  local description=$1
  local data=$2
  
  echo "==== Testing: $description ===="
  
  # Make the API call and capture the response
  response=$(curl -s -X POST http://localhost:8000/suggest-meal \
    -H "Content-Type: application/json" \
    -d "$data")
  
  # Check if the response contains an error
  if [[ "$response" == *"Error parsing response"* ]]; then
    echo "❌ Test FAILED - Error in response"
    echo "Response: $response"
  else
    echo "✅ Test PASSED - Valid suggestions received"
    echo "First suggestion: $(echo $response | grep -o '"name":"[^"]*"' | head -1)"
  fi
  
  echo ""
}

# Base request with minimal filters
base_request='{
  "user_id": "isaac_mineo",
  "meal_type": "dinner",
  "time_of_day": "18:00",
  "remaining_macros": {
    "calories": 800,
    "protein": 40,
    "carbs": 80,
    "fat": 30
  },
  "use_food_index_only": true
}'

# Test 1: Basic request
test_combination "Basic request (no filters)" "$base_request"

# Test 2: Add preference
preference_request='{
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
}'
test_combination "With preference filter" "$preference_request"

# Test 3: Add one specific ingredient
one_ingredient_request='{
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
  "specific_ingredients": ["Chicken"]
}'
test_combination "With one specific ingredient" "$one_ingredient_request"

# Test 4: Add calorie range
calorie_range_request='{
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
  "calorie_range": {"min": 400, "max": 600}
}'
test_combination "With calorie range" "$calorie_range_request"

# Test 5: Add diet type
diet_type_request='{
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
  "diet_type": "high-protein"
}'
test_combination "With diet type" "$diet_type_request"

# Test 6: Add cooking time (all filters)
all_filters_request='{
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
  "diet_type": "high-protein",
  "cooking_time": 30
}'
test_combination "With all filters" "$all_filters_request"

# Test 7: Steak specific test
steak_request='{
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
test_combination "Steak specific request" "$steak_request"

echo "All tests completed." 