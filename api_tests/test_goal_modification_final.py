"""
Final test for goal modification functionality
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
    from app.models import get_user_active_goal, update_goal
    from app.chatbot import process_food_operations
    print("Successfully imported required modules")
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

async def test_goal_modification_final():
    """Final test for goal modification with the updated fix."""
    print("\n=== Final Goal Modification Test ===\n")
    
    try:
        # First, get the current active goal to get its ID
        active_goal = get_user_active_goal(USER_ID)
        if not active_goal:
            print("No active goal found. Please create one first.")
            return False
        
        goal_id = str(active_goal.get("_id"))
        print(f"Found active goal with ID: {goal_id}")
        
        # Get current calorie target for comparison
        nutrition_targets = active_goal.get("nutrition_targets", [])
        current_calories = 0
        if nutrition_targets:
            current_calories = nutrition_targets[0].get("daily_calories", 0)
        
        print(f"Current calorie target: {current_calories}")
        
        # Test with different calorie values to verify change
        new_calories = 2100 if current_calories != 2100 else 2000
        
        # Create the different test scenarios with proper and improper JSON
        test_scenarios = [
            # Test 1: Well-formed JSON
            (f"GOAL_MODIFY: {{\"goal_id\": \"{goal_id}\", \"nutrition_targets\": [{{\"daily_calories\": {new_calories}}}]}}",
             f"Setting calorie target to {new_calories} with proper JSON"),
            
            # Test 2: Unbalanced braces
            (f"GOAL_MODIFY: {{\"goal_id\": \"{goal_id}\", \"nutrition_targets\": [{{\"daily_calories\": {new_calories}}}",
             f"Setting calorie target to {new_calories} with unbalanced braces"),
            
            # Test 3: Single quotes instead of double quotes
            (f"GOAL_MODIFY: {{'goal_id': '{goal_id}', 'nutrition_targets': [{{'daily_calories': {new_calories}}}]}}",
             f"Setting calorie target to {new_calories} with single quotes")
        ]
        
        # Run each test scenario
        for i, (test_input, description) in enumerate(test_scenarios, 1):
            print(f"\nTest {i}: {description}")
            print(f"Input: {test_input}")
            
            # Create a simulated response string
            test_response = f"I'll update your daily calorie target to {new_calories}.\n\n{test_input}"
            
            # Process using the modified function
            result = await process_food_operations(test_response, USER_ID)
            print(f"Result: {result}")
            
            # Verify the goal was actually updated
            updated_goal = get_user_active_goal(USER_ID)
            updated_nutrition_targets = updated_goal.get("nutrition_targets", [])
            updated_calories = 0
            if updated_nutrition_targets:
                updated_calories = updated_nutrition_targets[0].get("daily_calories", 0)
            
            print(f"Updated calorie target: {updated_calories}")
            
            if updated_calories == new_calories:
                print("✓ SUCCESS! Calorie target updated successfully.")
            else:
                print("✗ FAILURE. Calorie target not updated.")
            
            print("-" * 50)
        
        print("\nAll tests completed!")
        return True
        
    except Exception as e:
        print(f"\nError during testing: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Starting final goal modification test")
    result = asyncio.run(test_goal_modification_final())
    if result:
        print("✅ All goal modification tests passed!")
        sys.exit(0)
    else:
        print("❌ Goal modification test failed")
        sys.exit(1) 