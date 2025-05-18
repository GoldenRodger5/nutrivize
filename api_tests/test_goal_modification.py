"""
Test script for goal modification functionality.
"""
import os
import sys
import asyncio
import json
import traceback

# Set up the path to import from backend
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), 'backend')
sys.path.append(backend_dir)

try:
    # Import required modules
    print(f"Importing from: {backend_dir}")
    from app.constants import USER_ID
    from app.models import get_user_active_goal
    from app.chatbot import process_food_operations
    print("Successfully imported required modules")
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

async def test_goal_modification():
    """Test goal modification functionality."""
    print("\n=== Testing Goal Modification ===\n")
    
    try:
        # First, get the current active goal to get its ID
        active_goal = get_user_active_goal(USER_ID)
        if not active_goal:
            print("No active goal found. Please create one first.")
            return False
        
        goal_id = str(active_goal.get("_id"))
        print(f"Found active goal with ID: {goal_id}")
        
        # Get current calorie target
        nutrition_targets = active_goal.get("nutrition_targets", [])
        current_calories = 0
        if nutrition_targets:
            current_calories = nutrition_targets[0].get("daily_calories", 0)
        
        print(f"Current calorie target: {current_calories}")
        
        # Test 1: Modify daily calories to 2000
        print("\nTest 1: Modifying daily calories to 2000")
        
        # Create a simulated Claude response with GOAL_MODIFY command
        test_response = f"""
I'll update your calorie target to 2000.

GOAL_MODIFY: {{"goal_id": "{goal_id}", "nutrition_targets": [{{"daily_calories": 2000}}]}}
        """
        
        # Process the response
        modified_response = await process_food_operations(test_response, USER_ID)
        print(f"Modified response: {modified_response}")
        
        # Check if the goal was actually updated
        updated_goal = get_user_active_goal(USER_ID)
        updated_nutrition_targets = updated_goal.get("nutrition_targets", [])
        updated_calories = 0
        if updated_nutrition_targets:
            updated_calories = updated_nutrition_targets[0].get("daily_calories", 0)
        
        print(f"Updated calorie target: {updated_calories}")
        
        # Test 2: Modify with incorrect format
        print("\nTest 2: Testing with incorrect JSON format")
        
        # Create a simulated Claude response with malformed GOAL_MODIFY command
        test_response_bad = """
I'll update your calorie target to 2000.

GOAL_MODIFY: {'goal_id': '12345abc', 'nutrition_targets': [{'daily_calories': 2000}]}
        """
        
        # Process the response
        modified_response_bad = await process_food_operations(test_response_bad, USER_ID)
        print(f"Modified response (bad format): {modified_response_bad}")
        
        # Test 3: Modify without goal ID
        print("\nTest 3: Testing without goal ID")
        
        # Create a simulated Claude response without goal_id
        test_response_no_id = """
I'll update your calorie target to 2000.

GOAL_MODIFY: {"nutrition_targets": [{"daily_calories": 2000}]}
        """
        
        # Process the response
        modified_response_no_id = await process_food_operations(test_response_no_id, USER_ID)
        print(f"Modified response (no ID): {modified_response_no_id}")
        
        print("\nAll tests completed!")
        return True
        
    except Exception as e:
        print(f"\nError during testing: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Starting goal modification test")
    result = asyncio.run(test_goal_modification())
    if result:
        print("✅ Goal modification test completed")
        sys.exit(0)
    else:
        print("❌ Goal modification test failed")
        sys.exit(1) 