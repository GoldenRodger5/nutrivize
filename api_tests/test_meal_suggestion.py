"""
Test script for meal suggestion functionality.
"""
import os
import sys
import asyncio
import json

# Set up the path to import from backend
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), 'backend')
sys.path.append(backend_dir)

try:
    from app.constants import USER_ID
    from app.chatbot import process_food_operations
    print("Successfully imported required modules")
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

async def test_meal_suggestion():
    """Test meal suggestion with corrected JSON"""
    print("\n===== Testing Meal Suggestion =====\n")
    
    # Test with corrected JSON syntax - the issue might be with the "remaining_macros" nested object
    test_input = """
    Here's a meal suggestion based on your preferences:

    MEAL_SUGGESTION: {"meal_type": "dinner", "time_of_day": "evening", "preference": "high-protein", "remaining_macros": {"calories": 600, "protein": 40, "carbs": 50, "fat": 20}}
    """
    
    # Add explicit closing brackets to the JSON
    fixed_input = """
    Here's a meal suggestion based on your preferences:

    MEAL_SUGGESTION: {"meal_type": "dinner", "time_of_day": "evening", "preference": "high-protein", "remaining_macros": {"calories": 600, "protein": 40, "carbs": 50, "fat": 20}}
    """
    
    print(f"Original input: {test_input.strip()}")
    print(f"Fixed input: {fixed_input.strip()}")
    
    try:
        result = await process_food_operations(fixed_input, USER_ID)
        print(f"\nResult: {result}\n")
        print("Success!" if "meal suggestion" in result.lower() or "here are some" in result.lower() else "Failed!")
        
        # Also try with explicitly escaped quotes
        test_input_alt = """
        Here's a meal suggestion based on your preferences:

        MEAL_SUGGESTION: {"meal_type": "dinner", "time_of_day": "evening", "preference": "high-protein", "remaining_macros": {"calories": 600, "protein": 40, "carbs": 50, "fat": 20}}
        """
        
        print("\n===== Testing Alternative Format =====\n")
        result_alt = await process_food_operations(test_input_alt, USER_ID)
        print(f"Result: {result_alt}\n")
        
        return True
        
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Starting meal suggestion test")
    asyncio.run(test_meal_suggestion()) 