"""
Fix meal suggestion processing.

This script patches the chatbot.py file to fix the regex pattern for meal suggestions
so they can be properly processed.
"""
import os
import sys
import re
import shutil

# Ensure we're in the right directory
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), 'backend')
chatbot_path = os.path.join(backend_dir, 'app', 'chatbot.py')

# Check if chatbot.py exists
if not os.path.exists(chatbot_path):
    print(f"Error: {chatbot_path} not found")
    sys.exit(1)

# Create a backup
backup_path = f"{chatbot_path}.bak.meal_regex"
shutil.copy2(chatbot_path, backup_path)
print(f"Created backup at {backup_path}")

# Read the file content
with open(chatbot_path, 'r') as f:
    content = f.read()

# Fix the meal suggestion regex to use a greedy pattern
old_regex = r'meal_match = re.search\(r"MEAL_SUGGESTION:\\s*\(\{.*?\}\)", response, re\.DOTALL\)'
new_regex = r'meal_match = re.search(r"MEAL_SUGGESTION:\\s*({.*})", response, re.DOTALL)'

# Check if the pattern exists
if re.search(old_regex, content):
    # Replace the regex
    content = re.sub(old_regex, new_regex, content)
    
    # Write the modified content
    with open(chatbot_path, 'w') as f:
        f.write(content)
    
    print("Successfully updated meal suggestion regex pattern")
else:
    print("Could not find the meal suggestion regex pattern")

# Also add the balance braces code
meal_suggestion_block = re.search(r'if meal_match:.*?try:.*?meal_data_str = meal_match.group\(1\).replace\("\'", \'"\'.*?meal_data = json.loads\(meal_data_str\)', content, re.DOTALL)
if meal_suggestion_block:
    meal_suggestion_code = meal_suggestion_block.group(0)
    
    # Check if it already has brace balancing
    if "open_braces = meal_data_str.count" not in meal_suggestion_code:
        # Add brace balancing
        brace_balance_code = """
            # Balance braces if needed
            open_braces = meal_data_str.count('{')
            close_braces = meal_data_str.count('}')
            if open_braces > close_braces:
                meal_data_str += '}' * (open_braces - close_braces)
                
            # Print for debugging
            print(f"Processed meal suggestion JSON: {meal_data_str}")
            """
        
        # Insert before the json.loads line
        updated_code = meal_suggestion_code.replace(
            'meal_data = json.loads(meal_data_str)',
            f'{brace_balance_code}\n            meal_data = json.loads(meal_data_str)'
        )
        
        content = content.replace(meal_suggestion_code, updated_code)
        
        # Write the modified content
        with open(chatbot_path, 'w') as f:
            f.write(content)
        
        print("Added brace balancing to meal suggestion processing")
    else:
        print("Brace balancing already exists in meal suggestion processing")

print("All meal suggestion fixes applied. You can now test the changes.") 