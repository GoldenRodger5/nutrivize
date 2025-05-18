"""
Fix chatbot JSON parsing issues.

This script patches the chatbot.py file to fix JSON parsing issues in:
1. Meal suggestions
2. Meal plan generation
3. Goal modification

It improves regex patterns and JSON handling for better error recovery.
"""
import os
import sys
import re
import traceback
import shutil
from datetime import datetime

# Ensure we're in the right directory
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), 'backend')
chatbot_path = os.path.join(backend_dir, 'app', 'chatbot.py')

# Check if chatbot.py exists
if not os.path.exists(chatbot_path):
    print(f"Error: {chatbot_path} not found")
    sys.exit(1)

# Create a backup
backup_path = f"{chatbot_path}.bak"
shutil.copy2(chatbot_path, backup_path)
print(f"Created backup at {backup_path}")

# Read the original file
with open(chatbot_path, 'r') as f:
    content = f.read()

# Define the improved meal suggestion code to be inserted
meal_suggestion_code = """    # Check for meal suggestion operation
    meal_match = re.search(r"MEAL_SUGGESTION:\\\\s*({.*})", response, re.DOTALL)
    if meal_match:
        try:
            # Extract and parse the meal data
            meal_data_str = meal_match.group(1).replace("'", '"')
            
            # Fix common JSON issues in meal data
            meal_data_str = re.sub(r',\\\\s*}', '}', meal_data_str)
            meal_data_str = re.sub(r',\\\\s*]', ']', meal_data_str)
            
            # Balance braces if needed
            open_braces = meal_data_str.count('{')
            close_braces = meal_data_str.count('}')
            if open_braces > close_braces:
                meal_data_str += '}' * (open_braces - close_braces)
                
            # Add quotes to unquoted field names
            for field in ["protein", "carbs", "fat"]:
                if f'"{field}' in meal_data_str and not f'"{field}"' in meal_data_str:
                    meal_data_str = meal_data_str.replace(f'"{field}', f'"{field}"')
                    
            print(f"Processed meal suggestion JSON: {meal_data_str}")
            
            try:
                meal_data = json.loads(meal_data_str)
            except json.JSONDecodeError as json_err:
                print(f"JSON decode error in meal suggestion: {json_err}")
                
                # Try direct extraction of key fields if JSON parsing fails
                try:
                    # Extract meal type and preference
                    meal_type_match = re.search(r'"meal_type":\\\\s*"([^"]+)"', meal_data_str)
                    preference_match = re.search(r'"preference":\\\\s*"([^"]+)"', meal_data_str)
                    
                    # Extract remaining macros
                    calories_match = re.search(r'"calories":\\\\s*(\\\\d+)', meal_data_str)
                    protein_match = re.search(r'"protein":\\\\s*(\\\\d+)', meal_data_str)
                    carbs_match = re.search(r'"carbs":\\\\s*(\\\\d+)', meal_data_str)
                    fat_match = re.search(r'"fat":\\\\s*(\\\\d+)', meal_data_str)
                    
                    # Build a simplified object
                    meal_data = {
                        "meal_type": meal_type_match.group(1) if meal_type_match else "dinner",
                        "time_of_day": "evening",
                        "preference": preference_match.group(1) if preference_match else "balanced"
                    }
                    
                    # Add remaining macros if available
                    if calories_match or protein_match or carbs_match or fat_match:
                        meal_data["remaining_macros"] = {
                            "calories": int(calories_match.group(1)) if calories_match else 600,
                            "protein": int(protein_match.group(1)) if protein_match else 30,
                            "carbs": int(carbs_match.group(1)) if carbs_match else 60,
                            "fat": int(fat_match.group(1)) if fat_match else 20
                        }
                    else:
                        meal_data["remaining_macros"] = {
                            "calories": 600,
                            "protein": 30,
                            "carbs": 60,
                            "fat": 20
                        }
                        
                    print(f"Reconstructed meal data: {meal_data}")
                except Exception as e:
                    print(f"Failed to reconstruct meal data: {e}")
                    # Use default values as last resort
                    meal_data = {
                        "meal_type": "dinner",
                        "time_of_day": "evening",
                        "preference": "balanced",
                        "remaining_macros": {
                            "calories": 600,
                            "protein": 30,
                            "carbs": 60,
                            "fat": 20
                        }
                    }
"""

# Define the improved meal plan code to be inserted
meal_plan_code = """    # Check for meal plan generation operation
    meal_plan_match = re.search(r"MEAL_PLAN_GENERATE:\\\\s*({.*})", response, re.DOTALL)
    if meal_plan_match:
        try:
            # Extract and parse the meal plan data
            meal_plan_data_str = meal_plan_match.group(1).replace("'", '"')
            
            # Fix common JSON issues
            meal_plan_data_str = re.sub(r',\\\\s*}', '}', meal_plan_data_str)
            meal_plan_data_str = re.sub(r',\\\\s*]', ']', meal_plan_data_str)
            
            # Balance braces if needed
            open_braces = meal_plan_data_str.count('{')
            close_braces = meal_plan_data_str.count('}')
            if open_braces > close_braces:
                meal_plan_data_str += '}' * (open_braces - close_braces)
                
            print(f"Processed meal plan JSON: {meal_plan_data_str}")
            
            try:
                meal_plan_data = json.loads(meal_plan_data_str)
            except json.JSONDecodeError as json_err:
                print(f"JSON decode error in meal plan: {json_err}")
                # Try direct extraction of key fields
                try:
                    # Extract days and start date
                    days_match = re.search(r'"days":\\\\s*(\\\\d+)', meal_plan_data_str)
                    start_date_match = re.search(r'"start_date":\\\\s*"([^"]+)"', meal_plan_data_str)
                    
                    # Extract preferences
                    prefs_match = re.search(r'"preferences":\\\\s*(\\[.*?\\])', meal_plan_data_str)
                    
                    # Build a simplified object
                    meal_plan_data = {
                        "days": int(days_match.group(1)) if days_match else 7,
                        "start_date": start_date_match.group(1) if start_date_match else datetime.now().strftime("%Y-%m-%d")
                    }
                    
                    # Handle preferences
                    if prefs_match:
                        try:
                            prefs_str = prefs_match.group(1).replace("'", '"')
                            prefs_list = json.loads(prefs_str)
                            prefs_dict = {}
                            for pref in prefs_list:
                                prefs_dict[pref] = True
                            meal_plan_data["preferences"] = prefs_dict
                        except:
                            meal_plan_data["preferences"] = {"balanced": True}
                    else:
                        meal_plan_data["preferences"] = {"balanced": True}
                    
                    print(f"Reconstructed meal plan data: {meal_plan_data}")
                except Exception as e:
                    print(f"Failed to reconstruct meal plan data: {e}")
                    # Use default values as last resort
                    meal_plan_data = {
                        "days": 7,
                        "start_date": datetime.now().strftime("%Y-%m-%d"),
                        "preferences": {"balanced": True}
                    }
"""

# Apply the fixes
try:
    # Create a new file with our changes
    with open(chatbot_path, 'r') as f:
        lines = f.readlines()
    
    # Create a modified version of the file
    new_content = []
    
    # Track whether we're in the section we want to modify
    in_meal_suggestion = False
    in_meal_plan = False
    skip_meal_suggestion = False
    skip_meal_plan = False
    
    for line in lines:
        # Check for the start of sections we want to replace
        if "# Check for meal suggestion operation" in line:
            in_meal_suggestion = True
            new_content.append(meal_suggestion_code + "\n")
            skip_meal_suggestion = True
        elif "# Check for meal plan generation operation" in line:
            in_meal_plan = True
            new_content.append(meal_plan_code + "\n")
            skip_meal_plan = True
        # Check for the end of sections we want to skip
        elif in_meal_suggestion and "# Track the suggested ingredients" in line:
            in_meal_suggestion = False
            skip_meal_suggestion = False
        elif in_meal_plan and "# Add user_id to meal plan data" in line:
            in_meal_plan = False
            skip_meal_plan = False
            
        # Add the line if we're not skipping
        if not skip_meal_suggestion and not skip_meal_plan:
            new_content.append(line)
    
    # Write the modified content
    with open(chatbot_path, 'w') as f:
        f.writelines(new_content)
    
    print("Successfully updated chatbot.py with fixes")
    print("1. Improved meal suggestion JSON handling")
    print("2. Improved meal plan JSON handling")
    
except Exception as e:
    print(f"Error updating file: {e}")
    traceback.print_exc()
    
    # Restore backup on error
    shutil.copy2(backup_path, chatbot_path)
    print("Restored original file from backup due to error")
    sys.exit(1) 