"""
Test script for diagnosing and fixing JSON parsing issues in goal modification.
"""
import os
import sys
import asyncio
import json
import re
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
    print("Successfully imported required modules")
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

async def test_goal_json_fix():
    """Test the JSON parsing fix for goal modification."""
    print("\n=== Testing Goal JSON Parsing Fix ===\n")
    
    try:
        # First, get the current active goal to get its ID
        active_goal = get_user_active_goal(USER_ID)
        if not active_goal:
            print("No active goal found. Please create one first.")
            return False
        
        goal_id = str(active_goal.get("_id"))
        print(f"Found active goal with ID: {goal_id}")
        
        # Generate test cases with various JSON formats
        test_cases = [
            # Test Case 1: Complete JSON with proper formatting
            (f"GOAL_MODIFY: {{\"goal_id\": \"{goal_id}\", \"nutrition_targets\": [{{\"daily_calories\": 2000}}]}}",
             "Standard JSON format with proper double quotes and nested objects"),
            
            # Test Case 2: JSON with single quotes instead of double quotes
            (f"GOAL_MODIFY: {{'goal_id': '{goal_id}', 'nutrition_targets': [{{'daily_calories': 2000}}]}}",
             "JSON with single quotes instead of double quotes"),
            
            # Test Case 3: JSON with unbalanced braces
            (f"GOAL_MODIFY: {{\"goal_id\": \"{goal_id}\", \"nutrition_targets\": [{{\"daily_calories\": 2000}}",
             "Unbalanced JSON with missing closing braces"),
            
            # Test Case 4: JSON with trailing comma
            (f"GOAL_MODIFY: {{\"goal_id\": \"{goal_id}\", \"nutrition_targets\": [{{\"daily_calories\": 2000,}}]}}",
             "JSON with trailing comma after last property")
        ]
        
        # Test each case
        for i, (test_json, description) in enumerate(test_cases, 1):
            print(f"\nTest Case {i}: {description}")
            print(f"JSON: {test_json}")
            
            # Fix the JSON using a hand-coded version of the fix
            json_data = extract_and_fix_json(test_json)
            if json_data:
                print(f"Extracted and fixed JSON: {json_data}")
                
                # Try to verify it's now valid JSON by parsing it
                try:
                    parsed_json = json.loads(json_data)
                    print(f"Successfully parsed JSON: {parsed_json}")
                    
                    # Verify goal_id is extracted correctly
                    if "goal_id" in parsed_json:
                        print(f"Found goal_id: {parsed_json['goal_id']}")
                    else:
                        print("goal_id not found in parsed JSON")
                        
                    # Verify nutrition_targets is structured correctly
                    if "nutrition_targets" in parsed_json and isinstance(parsed_json["nutrition_targets"], list):
                        for target in parsed_json["nutrition_targets"]:
                            if "daily_calories" in target:
                                print(f"Found daily_calories: {target['daily_calories']}")
                except json.JSONDecodeError as e:
                    print(f"JSON parse error after fix: {e}")
            else:
                print("Failed to extract and fix JSON")
            
            print("-" * 50)
        
        print("\nAll tests completed!")
        return True
        
    except Exception as e:
        print(f"\nError during testing: {e}")
        traceback.print_exc()
        return False

def extract_and_fix_json(text):
    """
    Extract and fix JSON from a GOAL_MODIFY command
    """
    # Use regex to extract the JSON part
    match = re.search(r"GOAL_MODIFY:\s*({.*})", text, re.DOTALL)
    if not match:
        # Try a more forgiving pattern for unbalanced braces
        match = re.search(r"GOAL_MODIFY:\s*({.*)", text, re.DOTALL)
        if not match:
            return None
    
    # Extract the JSON string
    json_str = match.group(1)
    
    # Replace single quotes with double quotes
    json_str = json_str.replace("'", '"')
    
    # Fix common JSON errors
    # Remove trailing commas before closing braces/brackets
    json_str = re.sub(r',\s*}', '}', json_str)
    json_str = re.sub(r',\s*]', ']', json_str)
    
    # Try to balance braces if needed
    open_braces = json_str.count('{')
    close_braces = json_str.count('}')
    if open_braces > close_braces:
        json_str += '}' * (open_braces - close_braces)
    
    open_brackets = json_str.count('[')
    close_brackets = json_str.count(']')
    if open_brackets > close_brackets:
        json_str += ']' * (open_brackets - close_brackets)
    
    return json_str

if __name__ == "__main__":
    print("Starting goal JSON parsing fix test")
    result = asyncio.run(test_goal_json_fix())
    if result:
        print("✅ Goal JSON parsing test completed")
        sys.exit(0)
    else:
        print("❌ Goal JSON parsing test failed")
        sys.exit(1) 