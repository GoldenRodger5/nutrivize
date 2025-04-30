#!/bin/bash

echo "Testing meal suggestions API with the new ingredient macros feature..."

# Create test request payload
cat > test_request.json << 'EOJ'
{
  "user_id": "test_user",
  "meal_type": "snack",
  "time_of_day": "15:00",
  "preference": "healthy",
  "remaining_macros": {
    "calories": 500,
    "protein": 30,
    "carbs": 50,
    "fat": 20
  },
  "use_food_index_only": false,
  "specific_ingredients": ["yogurt", "berries"]
}
EOJ

# Make request and save response
curl -s -X POST -H "Content-Type: application/json" -d @test_request.json http://localhost:8000/suggest-meal > test_response.json

# Extract and show the first suggestion's name
echo -e "\nMeal suggestion:"
grep -o '"name":"[^"]*"' test_response.json | head -1

# Extract and show if there are ingredients with macros
echo -e "\nChecking for ingredient macros..."
grep -o '"macros":{[^}]*}' test_response.json | head -2

# Extract and show needs_indexing flags
echo -e "\nChecking for needs_indexing flags..."
grep -o '"needs_indexing":[a-z]*' test_response.json | head -2

echo -e "\nTesting complete. Check the test_response.json file for full details." 