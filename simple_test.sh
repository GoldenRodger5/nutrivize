#!/bin/bash

echo "==== Testing Simple 2-Day Meal Plan Generation ===="
curl -s -X POST http://localhost:8000/generate-meal-plan \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "isaac_mineo",
    "days": 2,
    "start_date": "2023-10-19",
    "meal_types": ["breakfast", "lunch"],
    "daily_targets": {
      "calories": 1200,
      "protein": 100,
      "carbs": 120,
      "fat": 40
    },
    "preferences": {
      "diet_type": "high-protein"
    }
  }' | jq '.id'

echo -e "\n==== Done ====" 