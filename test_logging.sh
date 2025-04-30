#!/bin/bash

PLAN_ID="c54cb80a-20f4-4eb0-98f8-0edef332905f"  # Use the ID from the previous test

echo "Logging breakfast from Day 1..."
curl -v -X POST "http://localhost:8000/meal-plans/$PLAN_ID/log-meal?user_id=isaac_mineo&day_index=0&meal_type=breakfast"

echo -e "\n\nLogging lunch from Day 2..."
curl -v -X POST "http://localhost:8000/meal-plans/$PLAN_ID/log-meal?user_id=isaac_mineo&day_index=1&meal_type=lunch" 