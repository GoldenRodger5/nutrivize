"""
Test script for fixing unbalanced JSON in goal modification.
"""
import json
import re

def fix_unbalanced_json(json_str):
    """
    Fix unbalanced JSON with proper nesting structure.
    Focus on the common daily_calories update case.
    """
    print(f"Original: {json_str}")
    
    # Try direct regex extraction for the specific case
    if 'daily_calories' in json_str and 'goal_id' in json_str:
        pattern = r'"goal_id":\s*"([^"]+)".*?"daily_calories":\s*(\d+)'
        match = re.search(pattern, json_str)
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
            
            print(f"Fixed using regex: {fixed_json}")
            return json.dumps(fixed_json)
    
    # If regex approach doesn't work, try balancing braces differently
    # This is a very specific fix for the case of a nutrition target with missing closing braces
    if '"nutrition_targets": [{"daily_calories":' in json_str:
        # Find where the partial JSON ends
        truncated_at = json_str.find('daily_calories')
        if truncated_at > 0:
            # Get a clean base structure up to "daily_calories"
            base_part = json_str[:truncated_at + len('daily_calories')]
            
            # Extract any digits after "daily_calories":
            value_match = re.search(r'daily_calories":\s*(\d+)', json_str)
            if value_match:
                cal_value = value_match.group(1)
                # Reconstruct with proper closing braces - use double braces in f-string
                fixed_json = f'{base_part}": {cal_value}}]}}'  # {{ and }} are escaped as { and }
                print(f"Fixed using structure awareness: {fixed_json}")
                return fixed_json
    
    # Generic approach: balance braces but ensure proper nesting
    open_braces = json_str.count('{')
    close_braces = json_str.count('}')
    open_brackets = json_str.count('[')
    close_brackets = json_str.count(']')
    
    # First close any arrays, then objects (for proper nesting)
    if open_brackets > close_brackets:
        json_str += ']' * (open_brackets - close_brackets)
    
    if open_braces > close_braces:
        json_str += '}' * (open_braces - close_braces)
    
    print(f"Fixed using brace balancing: {json_str}")
    return json_str

# Test cases
test_cases = [
    '{"goal_id": "abc123", "nutrition_targets": [{"daily_calories": 2000}]}',  # Balanced
    '{"goal_id": "abc123", "nutrition_targets": [{"daily_calories": 2000}',    # Unbalanced
    '{"goal_id": "abc123", "nutrition_targets": [{"daily_calories": 2000',     # Very unbalanced
    '{"goal_id": "abc123", "nutrition_targets": ',                            # Extremely unbalanced
]

print("=== Testing JSON Balancing Fix ===\n")

for i, test_case in enumerate(test_cases, 1):
    print(f"\nTest Case {i}:")
    try:
        fixed = fix_unbalanced_json(test_case)
        # Try to parse the fixed JSON
        parsed = json.loads(fixed)
        print(f"SUCCESS! Fixed JSON parses correctly: {parsed}")
        
        # Verify key parts are preserved
        if "goal_id" in parsed:
            print(f"- Goal ID preserved: {parsed['goal_id']}")
        if "nutrition_targets" in parsed and isinstance(parsed["nutrition_targets"], list):
            for target in parsed["nutrition_targets"]:
                if "daily_calories" in target:
                    print(f"- Daily calories preserved: {target['daily_calories']}")
    except json.JSONDecodeError as e:
        print(f"FAILED: Could not parse fixed JSON: {e}")
    except Exception as e:
        print(f"ERROR: {e}")
    
    print("-" * 50)

print("\nAll tests completed!") 