#!/bin/bash
echo "Restoring original API files..."
cp backend/app/meal_suggestions.py.bak backend/app/meal_suggestions.py
cp backend/app/main.py.bak backend/app/main.py
echo "Original API restored."
