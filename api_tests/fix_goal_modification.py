"""
Fix goal modification with malformed JSON.

This script patches the chatbot.py file to fix the issue where goal modification with malformed JSON
returns a dictionary instead of a string.
"""
import os
import sys
import re
import shutil
import traceback

# Ensure we're in the right directory
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), 'backend')
chatbot_path = os.path.join(backend_dir, 'app', 'chatbot.py')

# Check if chatbot.py exists
if not os.path.exists(chatbot_path):
    print(f"Error: {chatbot_path} not found")
    sys.exit(1)

# Create a backup
backup_path = f"{chatbot_path}.bak.goal"
shutil.copy2(chatbot_path, backup_path)
print(f"Created backup at {backup_path}")

# Read the file content
with open(chatbot_path, 'r') as f:
    content = f.readlines()

# Find the goal modification code
goal_modify_line_start = None
goal_modify_line_end = None

for i, line in enumerate(content):
    if "# Check for goal modify operation" in line:
        goal_modify_line_start = i
    elif goal_modify_line_start is not None and "# Check for goal delete operation" in line:
        goal_modify_line_end = i
        break

if goal_modify_line_start is None or goal_modify_line_end is None:
    print("Could not find goal modification code section")
    sys.exit(1)

print(f"Found goal modification code from line {goal_modify_line_start} to {goal_modify_line_end}")

# Add a fix to ensure string responses
goal_modification_return_lines = []
found_fix_needed = False

for i in range(goal_modify_line_start, goal_modify_line_end):
    line = content[i]
    
    # Check if we need to fix a dictionary returned directly
    if "return goal_data" in line:
        found_fix_needed = True
        # Replace with a proper string response
        goal_modification_return_lines.append("            # Return a string response, not the dictionary\n")
        goal_modification_return_lines.append("            if success:\n")
        goal_modification_return_lines.append('                clean_response = re.sub(r"GOAL_MODIFY:\\\\s*({.*?})", "I\'ve updated your goal.", response, flags=re.DOTALL)\n')
        goal_modification_return_lines.append("                return clean_response\n")
        goal_modification_return_lines.append("            else:\n")
        goal_modification_return_lines.append('                clean_response = re.sub(r"GOAL_MODIFY:\\\\s*({.*?})", "I couldn\'t update your goal.", response, flags=re.DOTALL)\n')
        goal_modification_return_lines.append("                return clean_response\n")
    else:
        goal_modification_return_lines.append(line)

# If we found a fix needed, apply it
if found_fix_needed:
    content[goal_modify_line_start:goal_modify_line_end] = goal_modification_return_lines
    
    # Write the updated content
    with open(chatbot_path, 'w') as f:
        f.writelines(content)
    
    print("Successfully updated goal modification code to return strings instead of dictionaries")
else:
    print("No dictionary return issues found in goal modification code")

# Also fix the meal plan view issue
try:
    meal_plan_view_line_start = None
    meal_plan_view_line_end = None

    for i, line in enumerate(content):
        if "# Check for meal plan view request" in line:
            meal_plan_view_line_start = i
        elif meal_plan_view_line_start is not None and "# Check for log meal from plan operation" in line:
            meal_plan_view_line_end = i
            break

    if meal_plan_view_line_start is not None and meal_plan_view_line_end is not None:
        print(f"Found meal plan view code from line {meal_plan_view_line_start} to {meal_plan_view_line_end}")
        
        # Add a fix to handle None responses
        meal_plan_view_lines = []
        
        for i in range(meal_plan_view_line_start, meal_plan_view_line_end):
            line = content[i]
            
            if "plan_text = await get_meal_plan_info(" in line:
                # Replace with a version that handles None
                meal_plan_view_lines.append("            # Fix for None response\n")
                meal_plan_view_lines.append("            plan_text = await get_meal_plan_info(\"active\") or \"You don't have any active meal plans.\"\n")
            else:
                meal_plan_view_lines.append(line)
        
        content[meal_plan_view_line_start:meal_plan_view_line_end] = meal_plan_view_lines
        
        # Write the updated content
        with open(chatbot_path, 'w') as f:
            f.writelines(content)
        
        print("Successfully updated meal plan view code to handle None responses")
    else:
        print("Could not find meal plan view code section")
except Exception as e:
    print(f"Error updating meal plan view: {e}")
    traceback.print_exc() 