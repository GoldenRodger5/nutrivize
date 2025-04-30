import sys
sys.path.insert(0, '.')
try:
    from app.meal_suggestions_improved import MealSuggestionResponse, MealSuggestion
    print("Successfully imported improved modules.")
except Exception as e:
    print(f"Failed to import improved modules: {e}")
    sys.exit(1)
