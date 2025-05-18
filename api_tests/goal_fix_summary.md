# Goal Modification Fix Summary

## Problem Identified

The AI chatbot was unable to correctly modify user goal data, particularly when updating the daily calorie target. The issue manifested as:

1. Error message: "I couldn't modify the goal due to an error"
2. Followed by a contradictory message: "Your weight gain goal has been updated with a new daily calorie target of 2000 calories"

## Root Causes

Through systematic testing, we identified three key issues:

1. **JSON Parsing Problems**: The regex pattern used to extract JSON data from the `GOAL_MODIFY` command was too restrictive and would cut off nested JSON objects.

2. **No Robust Error Recovery**: When JSON was malformed (e.g., had unbalanced braces or used single quotes), there was no mechanism to recover and extract the essential information.

3. **Type Mismatch**: The goal_id was passed as a string to the update_goal function, but MongoDB expected an ObjectId.

## Solutions Implemented

1. **Improved JSON Extraction**:
   - Enhanced the regex pattern to better handle complex JSON structures
   - Added a fallback pattern for unbalanced JSON objects

2. **Advanced JSON Recovery**:
   - Implemented multiple strategies for JSON recovery:
     - Direct regex extraction to pull out goal_id and daily_calories values
     - Bracket balancing for syntax issues
     - Structured rebuilding of valid JSON from partial data

3. **Type Conversion**:
   - Added conversion of string goal_id to ObjectId before calling the update_goal function
   - Added error handling for the conversion process

4. **Better Error Handling**:
   - Added more detailed error logging and tracebacks
   - Included data validation before attempting updates

## Test Verification

We created multiple test scripts to verify the fixes:

1. **test_goal_modification.py**: Tested the basic functionality
2. **simple_json_fix.py**: Tested various JSON fixing approaches
3. **test_goal_modification_final.py**: Comprehensive testing of all scenarios
4. **test_update_goal_direct.py**: Direct testing of the update_goal function

The final test results confirmed that:
- Well-formed JSON updates work correctly
- Malformed JSON (unbalanced braces) is properly fixed and processed
- Single-quoted JSON is properly converted and processed

## Key Implementation Details

```python
# 1. Improved regex pattern for JSON extraction
goal_modify_match = re.search(r"GOAL_MODIFY:\s*({.*})", response, re.DOTALL)
if not goal_modify_match:
    # Fallback for unbalanced JSON
    goal_modify_match = re.search(r"GOAL_MODIFY:\s*({.*)", response, re.DOTALL)

# 2. Advanced JSON recovery
if 'goal_id' in goal_data_str and 'daily_calories' in goal_data_str:
    pattern = r'"goal_id":\s*"([^"]+)".*?"daily_calories":\s*(\d+)'
    match = re.search(pattern, goal_data_str, re.DOTALL)
    if match:
        goal_id_value = match.group(1)
        daily_calories_value = int(match.group(2))
        goal_data = {
            "goal_id": goal_id_value,
            "nutrition_targets": [{"daily_calories": daily_calories_value}]
        }

# 3. Type conversion
from bson.objectid import ObjectId
try:
    goal_id_obj = ObjectId(goal_id)
except Exception as e:
    print(f"Could not convert goal_id to ObjectId: {e}")
    goal_id_obj = goal_id  # fallback to string if conversion fails

success = update_goal(goal_id_obj, goal_data, user_id)
```

## Conclusion

The goal modification functionality now works reliably across a variety of input formats, making the Nutrivize AI chatbot more robust and user-friendly. The fix handles both properly formed inputs and malformed inputs that would previously cause errors, providing a seamless experience for users managing their nutrition goals. 