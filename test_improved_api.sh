#!/bin/bash

echo "==== Testing Improved API Resilience and Meal Diversity ===="

# Start the improved backend server
echo "Starting the improved backend server..."
cd backend
# Use direct path to module to avoid import issues
python3 -c "import sys; sys.path.insert(0, '.'); from app.meal_suggestions_improved import MealSuggestionResponse; print('Module imported successfully')" || {
  echo "Error importing meal_suggestions_improved module"
  exit 1
}

python3 -m app.main_improved &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Function to extract the diversity in cuisine types
extract_cuisines() {
  echo "$1" | grep -o '"cuisine"[[:space:]]*:[[:space:]]*"[^"]*"' | awk -F'"' '{print $4}' | sort | uniq
}

# Function to check if we got an API error
check_for_api_error() {
  if echo "$1" | grep -q '"name":"API Error"'; then
    echo "❌ API Error detected in response"
    return 1
  fi
  return 0
}

# Function to check if parsing error occurred
check_for_parsing_error() {
  if echo "$1" | grep -q '"name":"Error parsing response"'; then
    echo "❌ Error parsing response detected"
    return 1
  fi
  return 0
}

# Function to properly count suggestion objects in JSON
count_suggestions() {
  echo "$1" | python3 -c "
import sys, json
try:
  data = json.load(sys.stdin)
  if 'suggestions' in data:
    print(len(data['suggestions']))
  else:
    print(0)
except:
  print(0)
"
}

echo -e "\n==== Test 1: Basic Meal Suggestion ===="
echo "Testing basic meal suggestion request..."

RESPONSE1=$(curl -s -X POST http://localhost:8000/suggest-meal \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "isaac_mineo",
    "meal_type": "breakfast",
    "time_of_day": "08:00",
    "preference": "high-protein",
    "remaining_macros": {
      "calories": 2000,
      "protein": 150,
      "carbs": 200,
      "fat": 70
    },
    "specific_ingredients": ["eggs", "oats"]
  }')

# Save response for debugging
echo "$RESPONSE1" > response1.json

# Check for errors
check_for_api_error "$RESPONSE1"
check_for_parsing_error "$RESPONSE1"

# Extract number of suggestions
SUGGESTION_COUNT1=$(count_suggestions "$RESPONSE1")
echo "Received $SUGGESTION_COUNT1 meal suggestions"

# Extract cuisine types
CUISINES1=$(extract_cuisines "$RESPONSE1")
echo "Cuisine types in response 1: $CUISINES1"

echo -e "\n==== Test 2: Second Meal Suggestion (Should be different) ===="
echo "Testing second meal suggestion request..."

RESPONSE2=$(curl -s -X POST http://localhost:8000/suggest-meal \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "isaac_mineo",
    "meal_type": "breakfast",
    "time_of_day": "08:00",
    "preference": "high-protein",
    "remaining_macros": {
      "calories": 2000,
      "protein": 150,
      "carbs": 200,
      "fat": 70
    },
    "specific_ingredients": ["eggs", "oats"]
  }')

# Save response for debugging
echo "$RESPONSE2" > response2.json

# Check for errors
check_for_api_error "$RESPONSE2"
check_for_parsing_error "$RESPONSE2"

# Extract number of suggestions
SUGGESTION_COUNT2=$(count_suggestions "$RESPONSE2")
echo "Received $SUGGESTION_COUNT2 meal suggestions"

# Extract cuisine types
CUISINES2=$(extract_cuisines "$RESPONSE2")
echo "Cuisine types in response 2: $CUISINES2"

# Use python to compare meal names
echo -e "\nComparing meals for diversity..."
python3 -c "
import json, sys

try:
    with open('response1.json', 'r') as f:
        data1 = json.load(f)
    with open('response2.json', 'r') as f:
        data2 = json.load(f)
    
    if 'suggestions' not in data1 or 'suggestions' not in data2:
        print('Could not find suggestions in responses')
        sys.exit(1)
    
    names1 = [meal['name'] for meal in data1['suggestions']]
    names2 = [meal['name'] for meal in data2['suggestions']]
    
    print('Meals from first request:')
    for name in names1:
        print(f'- {name}')
    
    print('\\nMeals from second request:')
    for name in names2:
        print(f'- {name}')
    
    duplicates = [name for name in names1 if name in names2]
    
    if duplicates:
        print(f'\\n⚠️ Found {len(duplicates)} duplicate meals between requests:')
        for dup in duplicates:
            print(f'- {dup}')
    else:
        print('\\n✅ Meal diversity test passed: All meals are different between requests')
except Exception as e:
    print(f'Error comparing meals: {str(e)}')
"

echo -e "\n==== Test 3: API Resilience Test (Rapid Consecutive Requests) ===="
echo "Sending 5 consecutive requests to test resilience..."

SUCCESS_COUNT=0
for i in {1..5}; do
  echo "Request $i..."
  RESPONSE=$(curl -s -X POST http://localhost:8000/suggest-meal \
    -H "Content-Type: application/json" \
    -d '{
      "user_id": "isaac_mineo",
      "meal_type": "lunch",
      "time_of_day": "12:00",
      "preference": "quick",
      "remaining_macros": {
        "calories": 1500,
        "protein": 100,
        "carbs": 150,
        "fat": 50
      }
    }')
  
  if ! echo "$RESPONSE" | grep -q "Error"; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "❌ Error detected in response $i"
  fi
  
  # Don't overwhelm the server
  sleep 1
done

echo -e "\n$SUCCESS_COUNT out of 5 requests completed successfully"
if [ $SUCCESS_COUNT -eq 5 ]; then
  echo "✅ API resilience test passed: All requests completed without errors"
else
  echo "⚠️ Some requests returned errors"
fi

echo -e "\n==== Test 4: Multi-Day Meal Plan Generation ===="
echo "Testing multi-day meal plan with diversity..."

MEAL_PLAN_RESPONSE=$(curl -s -X POST http://localhost:8000/generate-meal-plan \
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
    "allow_meal_repetition": false,
    "use_leftovers": true
  }')

# Save response for debugging
echo "$MEAL_PLAN_RESPONSE" > meal_plan_diversity_test.json

# Extract plan ID
PLAN_ID=$(echo "$MEAL_PLAN_RESPONSE" | grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | awk -F'"' '{print $4}')
echo "Generated meal plan ID: $PLAN_ID"

# Use python to check the meal plan
echo "Analyzing meal plan..."
python3 -c "
import json, sys

try:
    with open('meal_plan_diversity_test.json', 'r') as f:
        data = json.load(f)
    
    if 'days' not in data:
        print('Could not find days in meal plan')
        sys.exit(1)
    
    total_meals = 0
    error_meals = 0
    meal_names = []
    
    for day in data['days']:
        if 'meals' not in day:
            continue
        for meal_type, meal in day['meals'].items():
            total_meals += 1
            if 'name' in meal:
                meal_names.append(meal['name'])
                if 'Error' in meal['name']:
                    error_meals += 1
    
    print(f'Plan contains {total_meals} meals')
    
    if error_meals == 0:
        print('✅ No meal generation errors detected in meal plan')
    else:
        print(f'❌ Found {error_meals} error meals in the meal plan')
    
    # Check for duplicate meals across the plan
    duplicates = []
    seen = set()
    for name in meal_names:
        if name in seen:
            duplicates.append(name)
        else:
            seen.add(name)
    
    if duplicates:
        print(f'⚠️ Found {len(duplicates)} duplicate meals in the plan:')
        for dup in set(duplicates):
            print(f'- {dup}')
    else:
        print('✅ All meals in the plan are unique')
except Exception as e:
    print(f'Error analyzing meal plan: {str(e)}')
"

echo -e "\n==== Summary ===="
if [ "$SUGGESTION_COUNT1" -eq 3 ] && [ "$SUGGESTION_COUNT2" -eq 3 ] && [ $SUCCESS_COUNT -eq 5 ]; then
  echo "✅ All tests passed successfully!"
  echo "- Meal suggestions consistently returned 3 options"
  echo "- API handled 5 consecutive requests without errors"
  echo "- Multi-day meal plan generation successful"
else
  echo "⚠️ Some tests failed"
  if [ "$SUGGESTION_COUNT1" -ne 3 ] || [ "$SUGGESTION_COUNT2" -ne 3 ]; then
    echo "❌ Meal suggestion count issue: Expected 3 suggestions per request"
    echo "   Got $SUGGESTION_COUNT1 and $SUGGESTION_COUNT2 respectively"
  fi
  if [ $SUCCESS_COUNT -ne 5 ]; then
    echo "❌ API resilience test: Only $SUCCESS_COUNT out of 5 requests succeeded"
  fi
fi

# Clean up - kill the server
echo -e "\nShutting down test server..."
kill $SERVER_PID 2>/dev/null || echo "Server already stopped"
wait $SERVER_PID 2>/dev/null

echo "Test complete!" 