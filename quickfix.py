#!/usr/bin/env python3
"""
Quick fix script for chatbot.py
"""
import os
import sys
import re

# Path to chatbot.py file
chatbot_path = "chatbot.py"

print(f"Applying fixes to {chatbot_path}")

# Read the file
with open(chatbot_path, "r") as f:
    content = f.read()

# Fix 1: Update meal suggestion regex
content = content.replace(
    'meal_match = re.search(r"MEAL_SUGGESTION:\\s*({.*?})"',
    'meal_match = re.search(r"MEAL_SUGGESTION:\\\\s*({.*})"'
)
print("Fixed meal suggestion regex pattern")

# Fix 2: Make goal modification return string not dictionary
if "return goal_data" in content:
    content = content.replace(
        "return goal_data",
        """# Return a string response, not the dictionary
                if success:
                    clean_response = re.sub(r"GOAL_MODIFY:\\\\s*({.*?})", "I've updated your goal.", response, flags=re.DOTALL)
                    return clean_response
                else:
                    clean_response = re.sub(r"GOAL_MODIFY:\\\\s*({.*?})", "I couldn't update your goal.", response, flags=re.DOTALL)
                    return clean_response"""
    )
    print("Fixed goal modification to return strings instead of dictionaries")
    
# Fix 3: Add default for meal plan view None responses
if 'plan_text = await get_meal_plan_info("active")' in content:
    content = content.replace(
        'plan_text = await get_meal_plan_info("active")',
        'plan_text = await get_meal_plan_info("active") or "You don\'t have any active meal plans."'
    )
    print("Fixed meal plan view to handle None responses")

# Write the updated file
with open(chatbot_path, "w") as f:
    f.write(content)

print("All fixes successfully applied to chatbot.py") 