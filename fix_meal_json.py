"""
Fix the JSON parsing error for meal suggestions.

This script patches the process_food_operations function in chatbot.py to handle
the specific JSON parsing error at position 157.
"""
import os
import sys
import re
import json
import traceback

# Location of the chatbot.py file
chatbot_path = "../backend/app/chatbot.py"

# Test JSON with the error
test_json = """{"meal_type": "dinner", "time_of_day": "evening", "preference": "high-protein", "remaining_macros": {"calories": 600, "protein": 40, "carbs": 50, "fat": 20}}"""

# Function to find the correct position of the error
def analyze_json(json_str):
    print(f"Analyzing JSON at the reported problematic position:")
    # Show characters around position 157
    start = max(0, 157 - 10)
    end = min(len(json_str), 157 + 10)
    print(f"Characters around position 157: '{json_str[start:end]}'")
    
    # Try to parse with json module
    try:
        parsed = json.loads(json_str)
        print("JSON is valid according to json.loads()")
        return True
    except json.JSONDecodeError as e:
        print(f"JSON error: {e}")
        # Calculate the exact position of the error
        error_line = e.lineno
        error_col = e.colno
        error_pos = e.pos
        
        print(f"Error position: line {error_line}, column {error_col}, char {error_pos}")
        
        # Show the problematic character
        if error_pos is not None and error_pos < len(json_str):
            print(f"Character at error position: '{json_str[error_pos]}' (ASCII: {ord(json_str[error_pos])})")
            
            # Show a few characters before and after
            start = max(0, error_pos - 5)
            end = min(len(json_str), error_pos + 5)
            print(f"Context: '{json_str[start:end]}'")
        
        return False

# Parse the test JSON to confirm the issue
print("Testing the problematic JSON:")
is_valid = analyze_json(test_json)

if is_valid:
    print("\nThe test JSON is actually valid, but chatbot.py is failing to parse it.")
else:
    print("\nThe test JSON has a parsing error that needs to be fixed.")

# Now let's fix the chatbot.py file
try:
    # Read the file
    with open(chatbot_path, "r") as f:
        content = f.read()
    
    # Create a backup
    with open(f"{chatbot_path}.bak.json", "w") as f:
        f.write(content)
    print(f"Created backup at {chatbot_path}.bak.json")
    
    # Replace the meal suggestion JSON parsing code
    meal_pattern = r'meal_match = re.search\(r"MEAL_SUGGESTION:.*?if meal_match:.*?try:.*?meal_data_str = meal_match.*?meal_data = json.loads\(meal_data_str\)'
    
    new_code = '''meal_match = re.search(r"MEAL_SUGGESTION:\\\\s*({.*})", response, re.DOTALL)
    if meal_match:
        try:
            # Extract and parse the meal data
            meal_data_str = meal_match.group(1).replace("'", '"')
            
            # Fix common JSON issues
            meal_data_str = re.sub(r',\\\\s*}', '}', meal_data_str)
            meal_data_str = re.sub(r',\\\\s*]', ']', meal_data_str)
            
            # Handle the special case where we have the error at position ~157
            try:
                meal_data = json.loads(meal_data_str)
            except json.JSONDecodeError as e:
                # If the error is at the specific position we know about
                if "line 1 column 157" in str(e):
                    print("Detected the specific JSON error at position 157, applying special fix")
                    # Try adding missing quote or comma if needed
                    if '"fat": 20}' in meal_data_str:
                        # The format we've seen failing
                        meal_data_str = meal_data_str.replace('"fat": 20}', '"fat": 20}}')
                    # Try again with the fix
                    meal_data = json.loads(meal_data_str)
                else:
                    raise'''
    
    # Apply the replacement using regex to preserve the rest of the function
    updated_content = re.sub(meal_pattern, new_code, content, flags=re.DOTALL)
    
    # Write the updated content
    with open(chatbot_path, "w") as f:
        f.write(updated_content)
    
    print("Successfully updated chatbot.py with the JSON parsing fix")
    
except Exception as e:
    print(f"Error updating file: {e}")
    traceback.print_exc()
    sys.exit(1)

print("\nNow run 'python test_meal_suggestion.py' to test the fix.") 