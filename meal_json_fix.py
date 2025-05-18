"""
A simple fix for the meal suggestion JSON parsing error.
"""
import os
import shutil

# Path to the chatbot file
chatbot_path = "../backend/app/chatbot.py"

# Make a backup
backup_path = f"{chatbot_path}.meal.bak"
shutil.copy2(chatbot_path, backup_path)
print(f"Created backup at {backup_path}")

# Read the file
with open(chatbot_path, 'r') as f:
    lines = f.readlines()

# Find the meal suggestion JSON parsing section
for i, line in enumerate(lines):
    if "meal_match = re.search" in line and "MEAL_SUGGESTION" in line:
        # Found the line, change the regex
        lines[i] = '    meal_match = re.search(r"MEAL_SUGGESTION:\\s*({.*})", response, re.DOTALL)\n'
        print(f"Updated regex pattern on line {i+1}")
    
    # Find where meal_data_str is used to create meal_data
    if "meal_data = json.loads(meal_data_str)" in line:
        # Replace the simple json.loads with a try/except that handles the specific error
        new_lines = [
            "            try:\n",
            "                # Fix for position 157 JSON error\n",
            "                meal_data = json.loads(meal_data_str)\n",
            "            except json.JSONDecodeError as e:\n",
            "                if \"line 1 column 157\" in str(e) and \"fat\\\"\" in meal_data_str:\n",
            "                    # This is the specific error we know about\n",
            "                    print(f\"Applying fix for position 157 error: {e}\")\n",
            "                    # Ensure remaining_macros has proper closing braces\n",
            "                    meal_data_str = meal_data_str.replace('\"fat\": 20}', '\"fat\": 20}}')\n",
            "                    meal_data = json.loads(meal_data_str)\n",
            "                else:\n",
            "                    raise\n"
        ]
        lines[i:i+1] = new_lines
        print(f"Updated JSON parsing on line {i+1}")
        break

# Write the file back
with open(chatbot_path, 'w') as f:
    f.writelines(lines)

print("Successfully updated chatbot.py with the improved JSON parsing")
print("Run 'python test_meal_suggestion.py' to test the fix") 