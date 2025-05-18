"""
Direct test for the update_goal function.
"""
import os
import sys
import json

# Set up the path to import from backend
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), 'backend')
sys.path.append(backend_dir)

try:
    # Import required modules
    print(f"Importing from: {backend_dir}")
    from app.constants import USER_ID
    from app.models import get_user_active_goal, update_goal
    print("Successfully imported required modules")
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

def test_update_goal_direct():
    """Test the update_goal function directly to diagnose issues."""
    print("\n=== Direct Testing of update_goal Function ===\n")
    
    try:
        # First, get the current active goal to get its ID
        active_goal = get_user_active_goal(USER_ID)
        if not active_goal:
            print("No active goal found. Please create one first.")
            return False
        
        goal_id = str(active_goal.get("_id"))
        print(f"Found active goal with ID: {goal_id}")
        
        # Get current nutrition targets for comparison
        nutrition_targets = active_goal.get("nutrition_targets", [])
        current_calories = 0
        if nutrition_targets:
            current_calories = nutrition_targets[0].get("daily_calories", 0)
        
        print(f"Current calorie target: {current_calories}")
        
        # Test different update approaches
        test_cases = [
            # Test 1: Direct update with simple value
            {"nutrition_targets": [{"daily_calories": 2200}]},
            
            # Test 2: Try updating with complete nutrition target (preserving other values)
            {"nutrition_targets": [
                {
                    "daily_calories": 2300,
                    "proteins": nutrition_targets[0].get("proteins", 100),
                    "carbs": nutrition_targets[0].get("carbs", 200),
                    "fats": nutrition_targets[0].get("fats", 70)
                }
            ]},
            
            # Test 3: Try a completely different approach - direct serialization
            json.loads(json.dumps({"nutrition_targets": [{"daily_calories": 2400}]}))
        ]
        
        # Run each test case
        for i, test_data in enumerate(test_cases, 1):
            print(f"\nTest Case {i}:")
            print(f"Update data: {test_data}")
            
            # Try to update the goal
            try:
                result = update_goal(goal_id, test_data, USER_ID)
                print(f"Update result: {result}")
                
                # Check if the update was successful
                updated_goal = get_user_active_goal(USER_ID)
                updated_targets = updated_goal.get("nutrition_targets", [])
                updated_calories = 0
                if updated_targets:
                    updated_calories = updated_targets[0].get("daily_calories", 0)
                
                print(f"Updated calorie target: {updated_calories}")
                
                if result and updated_calories == test_data["nutrition_targets"][0]["daily_calories"]:
                    print("✓ SUCCESS! Goal updated correctly.")
                else:
                    print("✗ FAILURE. Goal not updated as expected.")
            except Exception as e:
                print(f"Error during update: {e}")
                import traceback
                traceback.print_exc()
            
            print("-" * 50)
        
        print("\nAll tests completed!")
        return True
        
    except Exception as e:
        print(f"\nError during testing: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Starting direct update_goal testing")
    result = test_update_goal_direct()
    if result:
        print("✅ Direct testing completed")
    else:
        print("❌ Direct testing failed")
    
    # Reset goal target if needed
    try:
        goal = get_user_active_goal(USER_ID)
        if goal:
            reset_data = {"nutrition_targets": [{"daily_calories": 2000}]}
            update_goal(str(goal.get("_id")), reset_data, USER_ID)
            print("Goal reset to original values (2000 calories)")
    except Exception:
        pass 