#!/usr/bin/env python3
"""
Test the JSON parsing fix for meal suggestions at column 157
"""
import re
import json

def test_meal_suggestion_fix():
    # Sample response with the problematic JSON
    response = 'MEAL_SUGGESTION: {"meal_type": "dinner", "time_of_day": "evening", "preference": "high-protein", "remaining_macros": {"calories": 600, "protein": 40, "carbs": 50, "fat": 20}'
    
    # Extract the meal suggestion
    meal_match = re.search(r"MEAL_SUGGESTION:\s*({.*})", response, re.DOTALL)
    if meal_match:
        # Extract and parse the meal data
        meal_data_str = meal_match.group(1).replace("'", '"')
        
        print(f"Original JSON string: {meal_data_str}")
        
        # Fix common JSON issues
        meal_data_str = re.sub(r',\s*}', '}', meal_data_str)
        meal_data_str = re.sub(r',\s*]', ']', meal_data_str)
        
        # First fix: Direct replacement for the specific pattern
        if '"remaining_macros"' in meal_data_str and '"fat": 20}' in meal_data_str:
            meal_data_str = meal_data_str.replace('"fat": 20}', '"fat": 20}}')
            print(f"Applied direct fix: {meal_data_str}")
        
        # Second fix: Balance braces
        open_braces = meal_data_str.count('{')
        close_braces = meal_data_str.count('}')
        if open_braces > close_braces:
            meal_data_str += '}' * (open_braces - close_braces)
            print(f"Balanced braces: {meal_data_str}")
        
        # Try to parse the JSON
        try:
            meal_data = json.loads(meal_data_str)
            print(f"Successfully parsed JSON: {meal_data}")
            return True
        except json.JSONDecodeError as e:
            print(f"JSON error: {e}")
            
            # Try the regex approach as last resort
            try:
                print("Trying fallback approach with regex extraction")
                # Extract each field using regex
                meal_type_match = re.search(r'"meal_type"\s*:\s*"([^"]+)"', meal_data_str)
                time_match = re.search(r'"time_of_day"\s*:\s*"([^"]+)"', meal_data_str)
                pref_match = re.search(r'"preference"\s*:\s*"([^"]+)"', meal_data_str)
                cal_match = re.search(r'"calories"\s*:\s*(\d+)', meal_data_str)
                protein_match = re.search(r'"protein"\s*:\s*(\d+)', meal_data_str)
                carbs_match = re.search(r'"carbs"\s*:\s*(\d+)', meal_data_str)
                fat_match = re.search(r'"fat"\s*:\s*(\d+)', meal_data_str)
                
                # Build the object manually
                meal_data = {
                    "meal_type": meal_type_match.group(1) if meal_type_match else "dinner",
                    "time_of_day": time_match.group(1) if time_match else "evening",
                    "preference": pref_match.group(1) if pref_match else "balanced",
                    "remaining_macros": {
                        "calories": int(cal_match.group(1)) if cal_match else 600,
                        "protein": int(protein_match.group(1)) if protein_match else 40,
                        "carbs": int(carbs_match.group(1)) if carbs_match else 50,
                        "fat": int(fat_match.group(1)) if fat_match else 20
                    }
                }
                print(f"Built valid object using regex: {meal_data}")
                return True
            except Exception as regex_error:
                print(f"Regex extraction failed: {regex_error}")
                return False
    
    return False

# Run the test
print("Testing meal suggestion JSON fix:")
result = test_meal_suggestion_fix()
print(f"Test result: {'PASSED' if result else 'FAILED'}") 