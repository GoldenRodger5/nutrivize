"""
Direct testing of individual chatbot operations without requiring API authentication.
"""
import os
import sys
import json
import asyncio
import traceback

# Set up the path to import from backend
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), 'backend')
sys.path.append(backend_dir)

try:
    # Import required modules
    print(f"Importing from: {backend_dir}")
    from app.constants import USER_ID
    from app.chatbot import process_food_operations
    print("Successfully imported required modules")
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

async def test_operation(description, operation_text):
    """Test a single chatbot operation"""
    print(f"\n===== Testing: {description} =====")
    print(f"Input: {operation_text.strip()}")
    
    try:
        result = await process_food_operations(operation_text, USER_ID)
        print(f"Output: {result}")
        print("Success!" if "error" not in result.lower() and "couldn't" not in result.lower() else "Failed!")
        return result
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        return None

async def main():
    """Run all individual tests"""
    # 1. Food Logging
    await test_operation("Food Logging - Add Apple", """
    I'll log that apple for you.

    FOOD_LOG: {"name": "Apple", "amount": 1, "meal_type": "Snack", "calories": 95, "proteins": 0.5, "carbs": 25, "fats": 0.3}
    """)
    
    # 2. Food Indexing
    await test_operation("Food Indexing - Add Greek Yogurt", """
    I'll add that to your food database.

    FOOD_INDEX: {"name": "Greek Yogurt", "serving_size": 100, "serving_unit": "g", "calories": 59, "proteins": 10, "carbs": 3.6, "fats": 0.4}
    """)
    
    # 3. Food List
    await test_operation("Food List - View All Foods", """
    Here are the foods in your database:

    FOOD_LIST:
    """)
    
    # 4. Goal Information
    await test_operation("Goal Information - List Goals", """
    Here are your current goals:

    GOAL_LIST:
    """)
    
    # 5. Goal Modification
    await test_operation("Goal Modification - Update Calories", """
    I'll update your calorie target to 2100.

    GOAL_MODIFY: {"goal_id": "6816c44b16cda5d475acf11f", "nutrition_targets": [{"daily_calories": 2100}]}
    """)
    
    # 6. Goal Modification - Malformed JSON 
    await test_operation("Goal Modification - Malformed JSON", """
    I'll update your calorie target to 2000.

    GOAL_MODIFY: {"goal_id": "6816c44b16cda5d475acf11f", "nutrition_targets": [{"daily_calories": 2000}
    """)
    
    # 7. Meal Suggestion
    await test_operation("Meal Suggestion", """
    Here's a meal suggestion based on your preferences:

    MEAL_SUGGESTION: {"meal_type": "dinner", "time_of_day": "evening", "preference": "high-protein", "remaining_macros": {"calories": 600, "protein": 40, "carbs": 50, "fat": 20}}
    """)
    
    # 8. Meal Plan Generation
    await test_operation("Meal Plan Generation", """
    I'll create a meal plan for you.

    MEAL_PLAN_GENERATE: {"days": 3, "start_date": "2023-06-01", "preferences": {"high-protein": true, "low-carb": true}, "daily_targets": {"calories": 2000, "protein": 120, "carbs": 150, "fat": 70}}
    """)
    
    # 9. View Meal Plan
    await test_operation("View Meal Plan", """
    Here's your current meal plan:

    MEAL_PLAN_VIEW:
    """)
    
    # 10. Special Format - Single Quotes
    await test_operation("Single Quotes in JSON", """
    I'll log this food.

    FOOD_LOG: {'name': 'Banana', 'amount': 1, 'meal_type': 'Snack', 'calories': 105, 'proteins': 1.3, 'carbs': 27, 'fats': 0.4}
    """)
    
    # 11. Error Handling - Missing Required Parameters
    await test_operation("Error Handling - Missing Parameters", """
    I'll delete this.

    FOOD_DELETE: {}
    """)

if __name__ == "__main__":
    print("Starting individual operation tests")
    asyncio.run(main()) 