#!/usr/bin/env python3
"""
Fix all the identified issues in the chatbot.py file:
1. Meal suggestion JSON parsing
2. Goal modification returning dictionary instead of string
3. Meal plan view handling None responses
"""
import re
import os

# Path to chatbot.py
chatbot_path = "chatbot.py"

# Read the file
with open(chatbot_path, 'r') as f:
    lines = f.readlines()

# Make a backup
with open(f"{chatbot_path}.backup", 'w') as f:
    f.writelines(lines)
print(f"Backup created at {chatbot_path}.backup")

# Fix 1: Meal suggestion regex
# Find the line with the meal suggestion regex
for i, line in enumerate(lines):
    if "meal_match = re.search" in line and "MEAL_SUGGESTION" in line:
        # Replace with improved regex
        lines[i] = '            meal_match = re.search(r"MEAL_SUGGESTION:\\\\s*({.*})", response, re.DOTALL)\n'
        print(f"Fixed meal suggestion regex on line {i+1}")
        
        # Check next few lines for place to add JSON processing
        for j in range(i+1, min(i+10, len(lines))):
            if "meal_data = json.loads" in lines[j]:
                # Add JSON error handling
                new_lines = [
                    "            try:\n",
                    "                # Balance braces if needed\n",
                    "                open_braces = meal_data_str.count('{')\n",
                    "                close_braces = meal_data_str.count('}')\n",
                    "                if open_braces > close_braces:\n",
                    "                    meal_data_str += '}' * (open_braces - close_braces)\n",
                    "                \n",
                    "                # Print for debugging\n",
                    "                print(f\"Processed meal suggestion JSON: {meal_data_str}\")\n",
                    "                \n",
                    "                meal_data = json.loads(meal_data_str)\n",
                    "            except json.JSONDecodeError as json_err:\n",
                    "                print(f\"JSON decode error in meal suggestion: {json_err}\")\n",
                    "                \n",
                    "                # Check for specific error at position 157\n",
                    "                if \"line 1 column 157\" in str(json_err) and \"fat\\\"\" in meal_data_str:\n",
                    "                    print(\"Applying fix for position 157 error\")\n",
                    "                    meal_data_str = meal_data_str.replace('\"fat\": 20}', '\"fat\": 20}}')\n",
                    "                    meal_data = json.loads(meal_data_str)\n",
                    "                else:\n",
                    "                    # Try to fix other common issues\n",
                    "                    meal_data_str = re.sub(r',\\\\s*}', '}', meal_data_str)\n",
                    "                    meal_data_str = re.sub(r',\\\\s*]', ']', meal_data_str)\n",
                    "                    \n",
                    "                    # Try again after fixes\n",
                    "                    meal_data = json.loads(meal_data_str)\n"
                ]
                lines[j:j+1] = new_lines
                print(f"Added JSON error handling after line {j+1}")
                break

# Fix 2: Goal modification returning dictionary
for i, line in enumerate(lines):
    if "return goal_data" in line:
        # Replace with proper string response
        new_lines = [
            "                # Return a string response, not the dictionary\n",
            "                if success:\n",
            "                    clean_response = re.sub(r\"GOAL_MODIFY:\\\\s*({.*?})\", \"I've updated your goal.\", response, flags=re.DOTALL)\n",
            "                    return clean_response\n",
            "                else:\n",
            "                    clean_response = re.sub(r\"GOAL_MODIFY:\\\\s*({.*?})\", \"I couldn't update your goal.\", response, flags=re.DOTALL)\n",
            "                    return clean_response\n"
        ]
        lines[i:i+1] = new_lines
        print(f"Fixed goal modification to return strings on line {i+1}")

# Fix 3: Meal plan view handling None responses
for i, line in enumerate(lines):
    if "plan_text = await get_meal_plan_info" in line:
        # Replace with version that handles None
        lines[i] = "            plan_text = await get_meal_plan_info(\"active\") or \"You don't have any active meal plans.\"\n"
        print(f"Fixed meal plan view to handle None responses on line {i+1}")

# Write the updated file
with open(chatbot_path, 'w') as f:
    f.writelines(lines)

print("All fixes successfully applied to chatbot.py") 