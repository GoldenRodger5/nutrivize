#!/bin/bash

echo "Testing IMPROVED API response with direct curl..."

# Start backend server in the background
cd backend
# Create a temporary Python script to import the module directly
cat > import_test.py << EOF
import sys
sys.path.insert(0, '.')
try:
    from app.meal_suggestions_improved import MealSuggestionResponse, MealSuggestion
    print("Successfully imported improved modules.")
except Exception as e:
    print(f"Failed to import improved modules: {e}")
    sys.exit(1)
EOF

# Test importing the module
python3 import_test.py
if [ $? -ne 0 ]; then
    echo "Error: Could not import improved modules."
    exit 1
fi

# Run the improved server
python3 -m app.main_improved &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Make first request
echo "Sending first meal suggestion request..."
curl -X POST http://localhost:8000/suggest-meal \
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
  }' | tee response1.json

echo -e "\nParsing first response..."
python3 -c "
import json, sys
try:
    with open('response1.json', 'r') as f:
        data = json.load(f)
    if 'suggestions' in data:
        print(f'Number of suggestions: {len(data[\"suggestions\"])}')
        for i, meal in enumerate(data['suggestions']):
            print(f'\\nMeal {i+1}: {meal[\"name\"]}')
            if 'cuisine' in meal:
                print(f'Cuisine: {meal[\"cuisine\"]}')
    else:
        print('No suggestions found')
except Exception as e:
    print(f'Error parsing JSON: {str(e)}')
"

# Make second request to test diversity
echo -e "\nSending second meal suggestion request (should show diversity)..."
curl -X POST http://localhost:8000/suggest-meal \
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
  }' | tee response2.json

echo -e "\nParsing second response..."
python3 -c "
import json, sys
try:
    with open('response2.json', 'r') as f:
        data = json.load(f)
    if 'suggestions' in data:
        print(f'Number of suggestions: {len(data[\"suggestions\"])}')
        for i, meal in enumerate(data['suggestions']):
            print(f'\\nMeal {i+1}: {meal[\"name\"]}')
            if 'cuisine' in meal:
                print(f'Cuisine: {meal[\"cuisine\"]}')
    else:
        print('No suggestions found')
except Exception as e:
    print(f'Error parsing JSON: {str(e)}')
"

# Compare the two responses to check for diversity
echo -e "\nComparing responses for diversity..."
python3 -c "
import json, sys
try:
    with open('response1.json', 'r') as f:
        data1 = json.load(f)
    with open('response2.json', 'r') as f:
        data2 = json.load(f)
    
    names1 = [meal['name'] for meal in data1['suggestions']]
    names2 = [meal['name'] for meal in data2['suggestions']]
    
    duplicates = [name for name in names1 if name in names2]
    if duplicates:
        print(f'Found {len(duplicates)} duplicate meals between responses:')
        for dup in duplicates:
            print(f'- {dup}')
    else:
        print('✅ All meals are different between the two responses')
except Exception as e:
    print(f'Error comparing responses: {str(e)}')
"

# Test API resilience with rapid requests
echo -e "\nTesting API resilience with 3 rapid requests..."
for i in {1..3}; do
    echo "Request $i..."
    curl -s -X POST http://localhost:8000/suggest-meal \
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
      }' -o "response_resilience_$i.json"
    
    # Check for errors in the response
    python3 -c "
import json, sys
try:
    with open(f'response_resilience_$i.json', 'r') as f:
        data = json.load(f)
    
    has_error = False
    if 'suggestions' in data:
        for meal in data['suggestions']:
            if 'Error' in meal.get('name', ''):
                has_error = True
                print(f'❌ Error detected in meal: {meal[\"name\"]}')
    
    if not has_error:
        print(f'✅ Request $i completed without errors')
except Exception as e:
    print(f'❌ Error parsing response: {str(e)}')
"
    # Short delay between requests
    sleep 0.5
done

# Clean up
echo -e "\nShutting down server..."
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

echo "Test complete!" 