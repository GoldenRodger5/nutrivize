#!/bin/bash

echo "==== Phase 2 Final Verification: Multi-Day Plans ===="

# Generate a 3-day meal plan
echo "1. Generating a 3-day meal plan..."
curl -s -X POST http://localhost:8000/generate-meal-plan \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "isaac_mineo",
    "days": 3,
    "start_date": "2023-10-19",
    "meal_types": ["breakfast", "lunch"],
    "daily_targets": {
      "calories": 1800,
      "protein": 120,
      "carbs": 180,
      "fat": 60
    }
  }' | jq '.days | length'

# Check the name of the active plan (should include date range)
echo "2. Checking plan name includes date range..."
curl -s -X GET "http://localhost:8000/meal-plans/active?user_id=isaac_mineo" | jq -r '.name'

# Check that grocery list is consolidated
echo "3. Checking grocery list consolidation..."
curl -s -X GET "http://localhost:8000/meal-plans/active?user_id=isaac_mineo" | jq '.grocery_list | length'

echo -e "\n==== Phase 2 Verification Complete ====" 