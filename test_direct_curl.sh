#!/bin/bash

echo "Testing API response with direct curl..."

# Start backend server in the background
cd backend
python3 -m app.main &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Make request
echo "Sending meal suggestion request..."
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
  }' | tee response.json

echo -e "\nParsing response..."
echo "Number of suggestions:"
cat response.json | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'suggestions' in data:
        print(len(data['suggestions']))
    else:
        print('No suggestions found')
except Exception as e:
    print(f'Error parsing JSON: {str(e)}')
"

# Clean up
echo "Shutting down server..."
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

echo "Test complete!" 