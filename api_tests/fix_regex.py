"""
Fix meal suggestion regex pattern directly.
"""
import os
import sys
import re

# Ensure we're in the right directory
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), 'backend')
chatbot_path = os.path.join(backend_dir, 'app', 'chatbot.py')

# Check if chatbot.py exists
if not os.path.exists(chatbot_path):
    print(f"Error: {chatbot_path} not found")
    sys.exit(1)

# Read the file as a list of lines
with open(chatbot_path, 'r') as f:
    lines = f.readlines()

# Find the meal suggestion regex line
meal_regex_line_index = None
for i, line in enumerate(lines):
    if "meal_match = re.search" in line and "MEAL_SUGGESTION" in line:
        meal_regex_line_index = i
        break

if meal_regex_line_index is not None:
    # Print the line we're going to modify
    print(f"Found meal suggestion regex at line {meal_regex_line_index + 1}:")
    print(f"  {lines[meal_regex_line_index].strip()}")
    
    # Replace the line with our improved regex
    lines[meal_regex_line_index] = '    meal_match = re.search(r"MEAL_SUGGESTION:\\\\s*({.*})", response, re.DOTALL)\n'
    
    # Write the modified file
    with open(chatbot_path, 'w') as f:
        f.writelines(lines)
    
    print("Successfully updated meal suggestion regex")
else:
    print("Could not find meal suggestion regex line") 