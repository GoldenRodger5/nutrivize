"""
Simple test for fixing unbalanced JSON.
"""
import json
import re

def fix_unbalanced_json(json_str):
    """Fix unbalanced JSON for goal modification."""
    print(f"Original JSON: {json_str}")
    
    # First try the direct regex extraction approach
    if 'goal_id' in json_str and 'daily_calories' in json_str:
        pattern = r'"goal_id":\s*"([^"]+)".*?"daily_calories":\s*(\d+)'
        match = re.search(pattern, json_str, re.DOTALL)
        if match:
            goal_id = match.group(1)
            calories = int(match.group(2))
            
            # Create a proper JSON structure
            fixed_json = {
                "goal_id": goal_id,
                "nutrition_targets": [
                    {"daily_calories": calories}
                ]
            }
            
            fixed_str = json.dumps(fixed_json)
            print(f"Fixed using regex: {fixed_str}")
            return fixed_str
    
    # For the specific "daily_calories" case
    if "nutrition_targets" in json_str:
        # Try to extract partial structure
        parts = {}
        
        # Extract goal_id
        goal_id_match = re.search(r'"goal_id":\s*"([^"]+)"', json_str)
        if goal_id_match:
            parts["goal_id"] = goal_id_match.group(1)
        
        # Extract daily_calories
        cal_match = re.search(r'"daily_calories":\s*(\d+)', json_str)
        if cal_match and "goal_id" in parts:
            cal_value = int(cal_match.group(1))
            
            # Rebuild the JSON with correct structure
            fixed_json = {
                "goal_id": parts["goal_id"],
                "nutrition_targets": [
                    {"daily_calories": cal_value}
                ]
            }
            
            fixed_str = json.dumps(fixed_json)
            print(f"Fixed using partial extraction: {fixed_str}")
            return fixed_str
    
    # Generic approach using bracket balancing
    open_braces = json_str.count('{')
    close_braces = json_str.count('}')
    open_brackets = json_str.count('[')
    close_brackets = json_str.count(']')
    
    # Balance the structure
    if open_brackets > close_brackets:
        json_str += ']' * (open_brackets - close_brackets)
    
    if open_braces > close_braces:
        json_str += '}' * (open_braces - close_braces)
    
    print(f"Fixed using brace balancing: {json_str}")
    return json_str

# Test cases with different problems
test_cases = [
    # Complete, well-formed JSON
    '{"goal_id": "abc123", "nutrition_targets": [{"daily_calories": 2000}]}',
    
    # Missing closing braces
    '{"goal_id": "abc123", "nutrition_targets": [{"daily_calories": 2000}',
    
    # Missing multiple braces
    '{"goal_id": "abc123", "nutrition_targets": [{"daily_calories": 2000',
    
    # Incomplete structure
    '{"goal_id": "abc123", "nutrition_targets": [{'
]

print("=== Testing JSON Balancing Fix ===\n")

for i, test_case in enumerate(test_cases, 1):
    print(f"\nTest Case {i}:")
    
    try:
        fixed = fix_unbalanced_json(test_case)
        parsed = json.loads(fixed)
        print(f"SUCCESS! Parsed JSON correctly: {parsed}")
        
        # Check key elements
        if "goal_id" in parsed:
            print(f"Goal ID preserved: {parsed['goal_id']}")
        if "nutrition_targets" in parsed:
            for target in parsed["nutrition_targets"]:
                if "daily_calories" in target:
                    print(f"Daily calories: {target['daily_calories']}")
    except Exception as e:
        print(f"ERROR: {e}")
        
    print("-" * 50)

print("\nAll tests completed!") 