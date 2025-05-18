"""
Create a clean fixes to the chatbot.py file.

This is a simpler approach that just replaces the entire file with a working version.
"""

import shutil
import os

# Restore the original from the first backup
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), 'backend')
chatbot_path = os.path.join(backend_dir, 'app', 'chatbot.py')
original_backup = f"{chatbot_path}.bak"

if os.path.exists(original_backup):
    print(f"Restoring original file from {original_backup}")
    shutil.copy2(original_backup, chatbot_path)
    print("Successfully restored original file")
else:
    print(f"Could not find original backup at {original_backup}")

# Now let's just add the few specific changes we need

# Read the file
with open(chatbot_path, 'r') as f:
    content = f.read()

# Fix 1: Goal Modification - Ensure malformed JSON returns strings, not dictionaries
goal_modification_fix = """
                # If we find goal_id and calorie values, create a valid goal_data
                if goal_id_match and daily_calories_match:
                    goal_id = goal_id_match.group(1)
                    daily_calories = int(daily_calories_match.group(1))
                    
                    # Create properly structured goal data
                    goal_data = {
                        "goal_id": goal_id,
                        "nutrition_targets": [{"daily_calories": daily_calories}]
                    }
                    
                    # Now update the goal
                    from bson.objectid import ObjectId
                    try:
                        goal_id_obj = ObjectId(goal_id)
                        print(f"Converted goal_id to ObjectId: {goal_id_obj}")
                    except Exception as e:
                        print(f"Could not convert goal_id to ObjectId: {e}")
                        goal_id_obj = goal_id  # fallback to string if conversion fails
                    
                    # The actual update
                    goal_update_data = {"nutrition_targets": [{"daily_calories": float(daily_calories)}]}
                    success = update_goal(goal_id_obj, goal_update_data, user_id)
                    
                    # Return a properly formatted response
                    if success:
                        clean_response = re.sub(r"GOAL_MODIFY:\\s*({.*?})", "I've updated your goal.", response, flags=re.DOTALL)
                        return clean_response
                    else:
                        clean_response = re.sub(r"GOAL_MODIFY:\\s*({.*?})", "I couldn't update your goal.", response, flags=re.DOTALL)
                        return clean_response
"""

# Fix the goal_modify handling to properly extract daily_calories even with malformed JSON
if "JSON decode error:" in content and "goal_id_match" in content:
    new_content = ""
    lines = content.splitlines()
    in_goal_modify = False
    in_json_error = False
    skip_lines = False
    
    for line in lines:
        if "# Check for goal modify operation" in line:
            in_goal_modify = True
            new_content += line + "\n"
        elif in_goal_modify and "JSON decode error:" in line:
            in_json_error = True
            new_content += line + "\n"
        elif in_goal_modify and in_json_error and "goal_id_match" in line and "daily_calories_match" in line:
            # We found the spot to insert our fix
            new_content += line + "\n"
            new_content += goal_modification_fix
            skip_lines = True
        elif in_goal_modify and in_json_error and skip_lines and "return goal_data" in line:
            # Skip the problematic line and reset flags
            skip_lines = False
        elif skip_lines:
            # Skip these lines as we're replacing them with our fix
            pass
        else:
            new_content += line + "\n"
            if "# Check for goal delete operation" in line:
                in_goal_modify = False
                in_json_error = False
                skip_lines = False

    # Write the modified content
    with open(chatbot_path, 'w') as f:
        f.write(new_content)
    print("Fixed goal modification")

# Fix 2: Meal plan view fix - add default value if None is returned
if "await get_meal_plan_info(\"active\")" in content:
    content = content.replace(
        "plan_text = await get_meal_plan_info(\"active\")",
        "plan_text = await get_meal_plan_info(\"active\") or \"You don't have any active meal plans.\""
    )
    
    # Write the modified content
    with open(chatbot_path, 'w') as f:
        f.write(content)
    print("Fixed meal plan view to handle None responses")

print("All fixes applied. You can now test the changes.") 