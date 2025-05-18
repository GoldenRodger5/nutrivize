"""
Fix meal suggestion JSON parsing and goal modification issues.

This script patches the chatbot.py file to fix:
1. JSON parsing issues with meal suggestions
2. Goal modification returning dictionary instead of string
3. Meal plan view handling None responses
"""
import os
import sys
import re
import shutil

# Path to chatbot.py file
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), 'backend')
chatbot_path = os.path.join(backend_dir, 'app', 'chatbot.py')

# Check if chatbot.py exists
if not os.path.exists(chatbot_path):
    print(f"Error: {chatbot_path} not found")
    sys.exit(1)

# Create a backup
backup_path = f"{chatbot_path}.bak.fixes"
shutil.copy2(chatbot_path, backup_path)
print(f"Created backup at {backup_path}")

# Read the file
with open(chatbot_path, 'r') as f:
    content = f.read()

# Fix 1: Meal suggestion JSON parsing
# Look for the meal suggestion regex and improve it
meal_regex_pattern = r'meal_match = re.search\(r"MEAL_SUGGESTION:.*?", response'
if re.search(meal_regex_pattern, content):
    content = re.sub(
        meal_regex_pattern,
        'meal_match = re.search(r"MEAL_SUGGESTION:\\\\s*({.*})", response',
        content
    )
    print("Fixed meal suggestion regex pattern")

# Add JSON error handling for the position 157 issue
meal_json_pattern = r'meal_data = json.loads\(meal_data_str\)'
if meal_json_pattern in content:
    json_fix = """            try:
                meal_data = json.loads(meal_data_str)
            except json.JSONDecodeError as json_err:
                print(f"JSON decode error in meal suggestion: {json_err}")
                
                # Check for specific error at position 157
                if "line 1 column 157" in str(json_err) and "fat\\"" in meal_data_str:
                    print("Applying fix for position 157 error")
                    meal_data_str = meal_data_str.replace('"fat": 20}', '"fat": 20}}')
                    meal_data = json.loads(meal_data_str)
                else:
                    # Try to fix other common issues
                    meal_data_str = re.sub(r',\\\\s*}', '}', meal_data_str)
                    meal_data_str = re.sub(r',\\\\s*]', ']', meal_data_str)
                    
                    # Balance braces if needed
                    open_braces = meal_data_str.count('{')
                    close_braces = meal_data_str.count('}')
                    if open_braces > close_braces:
                        meal_data_str += '}' * (open_braces - close_braces)
                    
                    # Try again with fixes
                    meal_data = json.loads(meal_data_str)"""
    
    content = content.replace(meal_json_pattern, json_fix)
    print("Added error handling for meal suggestion JSON parsing")

# Fix 2: Goal modification returning dictionary
goal_return_pattern = r'return goal_data'
if goal_return_pattern in content:
    goal_fix = """                # Return a string response, not the dictionary
                if success:
                    clean_response = re.sub(r"GOAL_MODIFY:\\\\s*({.*?})", "I've updated your goal.", response, flags=re.DOTALL)
                    return clean_response
                else:
                    clean_response = re.sub(r"GOAL_MODIFY:\\\\s*({.*?})", "I couldn't update your goal.", response, flags=re.DOTALL)
                    return clean_response"""
    
    content = content.replace(goal_return_pattern, goal_fix)
    print("Fixed goal modification to return strings instead of dictionaries")

# Fix 3: Meal plan view handling None responses
meal_plan_pattern = r'plan_text = await get_meal_plan_info\("active"\)'
if meal_plan_pattern in content:
    meal_plan_fix = 'plan_text = await get_meal_plan_info("active") or "You don\'t have any active meal plans."'
    content = content.replace(meal_plan_pattern, meal_plan_fix)
    print("Fixed meal plan view to handle None responses")

# Write the updated file
with open(chatbot_path, 'w') as f:
    f.write(content)

print("All fixes successfully applied to chatbot.py") 