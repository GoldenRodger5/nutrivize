"""
Comprehensive fix for chatbot.py.

This script patches the chatbot.py file to fix JSON parsing issues in:
1. Meal suggestions - properly process suggestions instead of returning them as-is
2. Goal modification - fix malformed JSON handling
3. View meal plan - fix error

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
backup_path = f"{chatbot_path}.bak.complete"
shutil.copy2(chatbot_path, backup_path)
print(f"Created backup at {backup_path}")

# Read the original file
with open(chatbot_path, 'r') as f:
    content = f.read()

# Fix the meal suggestion processing
# Problem: Meal suggestions are not processed, just returned as-is
meal_suggestion_fix = """
# Process meal suggestions
def process_meal_suggestions(response, user_id=None):
    \"\"\"Check for and process meal suggestions in the response\"\"\"
    if not user_id:
        user_id = USER_ID
        
    # Check for meal suggestion operation
    meal_match = re.search(r"MEAL_SUGGESTION:\\s*({.*})", response, re.DOTALL)
    if meal_match:
        try:
            # Extract and parse the meal data
            meal_data_str = meal_match.group(1).replace("'", '"')
            
            # Fix common JSON issues in meal data
            meal_data_str = re.sub(r',\\s*}', '}', meal_data_str)
            meal_data_str = re.sub(r',\\s*]', ']', meal_data_str)
            
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
                    meal_type_match = re.search(r'"meal_type":\\s*"([^"]+)"', meal_data_str)
                    preference_match = re.search(r'"preference":\\s*"([^"]+)"', meal_data_str)
                    
                    # Extract remaining macros
                    calories_match = re.search(r'"calories":\\s*(\\d+)', meal_data_str)
                    protein_match = re.search(r'"protein":\\s*(\\d+)', meal_data_str)
                    carbs_match = re.search(r'"carbs":\\s*(\\d+)', meal_data_str)
                    fat_match = re.search(r'"fat":\\s*(\\d+)', meal_data_str)
                    
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
            
            # Track the suggested ingredients for later reference
            if "specific_ingredients" in meal_data:
                # If specific ingredients are explicitly provided
                if isinstance(meal_data["specific_ingredients"], list):
                    for ingredient in meal_data["specific_ingredients"]:
                        if isinstance(ingredient, str):
                            conversation_contexts.setdefault(user_id, {}).setdefault("suggestion_ingredients", set()).add(ingredient.lower())
            
            # Extract ingredients from suggestion preference or description too
            for field in ["preference", "description"]:
                if field in meal_data and isinstance(meal_data[field], str):
                    ingredient_matches = re.findall(r'\\b(chicken|beef|fish|salmon|rice|beans|broccoli|eggs|cheese|nuts|spinach|avocado|quinoa|yogurt|milk|bread|pasta|potato|tomato|lettuce|cucumber|carrot|apple|banana|berries)\\b', 
                                                   meal_data[field].lower())
                    for ingredient in ingredient_matches:
                        conversation_contexts.setdefault(user_id, {}).setdefault("suggestion_ingredients", set()).add(ingredient)
            
            # Save the full suggestion for context
            conversation_contexts.setdefault(user_id, {}).setdefault("last_suggestions", []).append(meal_data)
            
            # Limit to last 3 suggestions to keep context manageable
            if len(conversation_contexts[user_id]["last_suggestions"]) > 3:
                conversation_contexts[user_id]["last_suggestions"] = conversation_contexts[user_id]["last_suggestions"][-3:]
            
            # Validate required fields
            required_fields = ["meal_type", "time_of_day"]
            for field in required_fields:
                if field not in meal_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Get user's details for calorie targeting
            try:
                active_goal = get_user_active_goal(user_id)
                user_details = get_user_details(user_id) if user_id != USER_ID else {}
                age = user_details.get("age", 35)
                activity_level = user_details.get("activity_level", "moderate")
                
                # For tracking if we need to focus on dietary restrictions
                dietary_focus = False
                dietary_restrictions = []
                
                # Check if the user has dietary restrictions
                if user_details and "dietary_restrictions" in user_details:
                    dietary_restrictions = user_details["dietary_restrictions"]
                    if dietary_restrictions:
                        dietary_focus = True
                
                # Get meal suggestions based on request
                from app.meal_suggestions import generate_meal_suggestions, MealSuggestionRequest, RemainingMacros
                
                # Handle the case when remaining_macros might be missing or malformed
                if "remaining_macros" not in meal_data or not isinstance(meal_data["remaining_macros"], dict):
                    meal_data["remaining_macros"] = {
                        "calories": 600,
                        "protein": 30,
                        "carbs": 60,
                        "fat": 20
                    }
                
                # Ensure all fields are present in remaining_macros
                for field in ["calories", "protein", "carbs", "fat"]:
                    if field not in meal_data["remaining_macros"]:
                        meal_data["remaining_macros"][field] = {"calories": 600, "protein": 30, "carbs": 60, "fat": 20}[field]
                
                # Create remaining macros object
                remaining_macros = RemainingMacros(
                    calories=meal_data["remaining_macros"]["calories"],
                    protein=meal_data["remaining_macros"]["protein"],
                    carbs=meal_data["remaining_macros"]["carbs"],
                    fat=meal_data["remaining_macros"]["fat"]
                )
                
                # Create the request
                request = MealSuggestionRequest(
                    meal_type=meal_data["meal_type"],
                    time_of_day=meal_data["time_of_day"],
                    preference=meal_data.get("preference", "balanced"),
                    remaining_macros=remaining_macros,
                    specific_ingredients=meal_data.get("specific_ingredients", []),
                    dietary_restrictions=dietary_restrictions,
                    use_food_database=(food_db_has_data == True)
                )
                
                # Generate suggestions
                suggestions = generate_meal_suggestions(request)
                
                # Use fewer suggestions for specific ingredient requests
                max_suggestions = 2 if "specific_ingredients" in meal_data and meal_data["specific_ingredients"] else 3
                suggestions_to_show = suggestions[:max_suggestions]
                
                # Format suggestions as text
                suggestions_text = f"Here are some meal suggestions for your {meal_data['meal_type']}:\n\n"
                
                for i, suggestion in enumerate(suggestions_to_show):
                    suggestions_text += f"**{i+1}. {suggestion.name}**\\n"
                    suggestions_text += f"- **Serving:** {suggestion.serving_info}\\n"
                    suggestions_text += f"- Calories: {suggestion.macros.calories:.0f}, Protein: {suggestion.macros.protein:.1f}g, Carbs: {suggestion.macros.carbs:.1f}g, Fat: {suggestion.macros.fat:.1f}g\\n"
                    suggestions_text += f"- {suggestion.description}\\n\\n"
                    
                    # For specific ingredient requests, also show preparation instructions
                    if meal_data.get("specific_ingredients") and i == 0:
                        suggestions_text += "**Preparation:**\\n"
                        suggestions_text += "1. Prepare your ingredients by washing and chopping as needed\\n"
                        suggestions_text += "2. Cook the main protein component first (if applicable)\\n"
                        suggestions_text += "3. Add vegetables and other ingredients\\n"
                        suggestions_text += "4. Season to taste and serve\\n\\n"
                        
                        # Add a tip for meal prep if it's a dinner or lunch
                        if meal_data["meal_type"] in ["dinner", "lunch"]:
                            suggestions_text += "> **Meal Prep Tip:** This dish can be prepared in advance and stored in the refrigerator for up to 3 days.\\n\\n"
                
                # Replace the command with the meal suggestions
                clean_response = re.sub(r"MEAL_SUGGESTION:\\s*({.*})", suggestions_text, response, flags=re.DOTALL)
                return clean_response
            except Exception as e:
                print(f"Error generating meal suggestions: {e}")
                traceback.print_exc()  # Add traceback for better debugging
                clean_response = re.sub(r"MEAL_SUGGESTION:\\s*({.*})", f"I couldn't generate meal suggestions due to an error: {str(e)}", response, flags=re.DOTALL)
                return clean_response
        except Exception as e:
            print(f"Error processing meal suggestion: {e}")
            traceback.print_exc()  # Add traceback for better debugging
            # Replace the command with an error message
            clean_response = re.sub(r"MEAL_SUGGESTION:\\s*({.*})", f"I couldn't generate meal suggestions due to an error: {str(e)}", response, flags=re.DOTALL)
            return clean_response
    
    return response
"""

# Fix the goal modification with malformed JSON
# Problem: Goal modification with malformed JSON returns a dictionary instead of string
goal_modification_fix = """
    # Check for goal modify operation
    goal_modify_match = re.search(r"GOAL_MODIFY:\\s*({.*})", response, re.DOTALL)
    if not goal_modify_match:
        # If the first regex doesn't match, try a more permissive one for unbalanced JSON
        goal_modify_match = re.search(r"GOAL_MODIFY:\\s*({.*)", response, re.DOTALL)
    
    if goal_modify_match:
        try:
            # Extract the JSON string
            goal_data_str = goal_modify_match.group(1).replace("'", '"')
            
            # Fix common JSON formatting issues
            goal_data_str = goal_data_str.strip()
            
            # Fix trailing commas that might cause JSON parsing errors
            goal_data_str = re.sub(r',\\s*}', '}', goal_data_str)
            goal_data_str = re.sub(r',\\s*]', ']', goal_data_str)
            
            # Balance braces and brackets
            open_braces = goal_data_str.count('{')
            close_braces = goal_data_str.count('}')
            if open_braces > close_braces:
                goal_data_str += '}' * (open_braces - close_braces)
            
            open_brackets = goal_data_str.count('[')
            close_brackets = goal_data_str.count(']')
            if open_brackets > close_brackets:
                goal_data_str += ']' * (open_brackets - close_brackets)
            
            print(f"Processed JSON string: {goal_data_str}")
            
            # Try to parse the JSON
            try:
                goal_data = json.loads(goal_data_str)
            except json.JSONDecodeError as json_err:
                print(f"JSON decode error: {json_err} in string: {goal_data_str}")
                
                # IMPORTANT FIX: Try to extract goal_id and daily_calories directly with regex
                goal_id_match = re.search(r'"goal_id":\\s*"([^"]+)"', goal_data_str)
                daily_calories_match = re.search(r'"daily_calories":\\s*(\\d+)', goal_data_str)
                
                if goal_id_match and daily_calories_match:
                    # If we have both goal_id and daily_calories, we can proceed
                    goal_id = goal_id_match.group(1)
                    daily_calories = int(daily_calories_match.group(1))
                    
                    print(f"Extracted goal_id={goal_id}, daily_calories={daily_calories}")
                    
                    # Create a valid goal data structure
                    goal_data = {
                        "goal_id": goal_id,
                        "nutrition_targets": [{"daily_calories": daily_calories}]
                    }
                    
                    print(f"Output: {goal_data}")
                else:
                    # Try more advanced JSON recovery
                    try:
                        # Split the string into parts by key names we expect
                        parts = {}
                        goal_id_pattern = r'"goal_id":\\s*"([^"]+)"'
                        goal_id_match = re.search(goal_id_pattern, goal_data_str)
                        if goal_id_match:
                            parts["goal_id"] = goal_id_match.group(1)
                        
                        # Look for nutrition target values
                        cal_pattern = r'"daily_calories":\\s*(\\d+)'
                        protein_pattern = r'"proteins":\\s*(\\d+)'
                        carbs_pattern = r'"carbs":\\s*(\\d+)'
                        fats_pattern = r'"fats":\\s*(\\d+)'
                        
                        cal_match = re.search(cal_pattern, goal_data_str)
                        protein_match = re.search(protein_pattern, goal_data_str)
                        carbs_match = re.search(carbs_pattern, goal_data_str)
                        fats_match = re.search(fats_pattern, goal_data_str)
                        
                        # If we have goal_id and at least one nutrition value, we can create a valid object
                        if "goal_id" in parts and (cal_match or protein_match or carbs_match or fats_match):
                            nutrition_target = {}
                            
                            if cal_match:
                                nutrition_target["daily_calories"] = int(cal_match.group(1))
                            if protein_match:
                                nutrition_target["proteins"] = int(protein_match.group(1))
                            if carbs_match:
                                nutrition_target["carbs"] = int(carbs_match.group(1))
                            if fats_match:
                                nutrition_target["fats"] = int(fats_match.group(1))
                            
                            # Rebuild a valid structure
                            goal_data = {
                                "goal_id": parts["goal_id"],
                                "nutrition_targets": [nutrition_target]
                            }
                            
                            print(f"Reconstructed goal data from partial matches: {goal_data}")
                        else:
                            raise json_err
                    
                    except Exception as manual_fix_err:
                        print(f"Advanced JSON fix failed: {manual_fix_err}")
                        raise json_err
            
            # Need goal_id to modify
            if "goal_id" not in goal_data:
                clean_response = re.sub(r"GOAL_MODIFY:\\s*({.*?})", "I need a goal_id to modify a goal.", response, flags=re.DOTALL)
                return clean_response
            
            goal_id = goal_data.pop("goal_id")
            
            # Convert numeric values to float
            if "weight_target" in goal_data:
                for key in ["current", "goal", "weekly_rate"]:
                    if key in goal_data["weight_target"]:
                        goal_data["weight_target"][key] = float(goal_data["weight_target"][key])
            
            if "nutrition_targets" in goal_data:
                for target in goal_data["nutrition_targets"]:
                    for key in ["daily_calories", "proteins", "carbs", "fats", "fiber", "water"]:
                        if key in target:
                            target[key] = float(target[key])
            
            # Update the goal
            print(f"Updating goal {goal_id} with data: {goal_data}")
            try:
                # Make sure goal_id is not in the data we're updating
                if "goal_id" in goal_data:
                    del goal_data["goal_id"]
                
                # Convert goal_id to ObjectId
                from bson.objectid import ObjectId
                try:
                    goal_id_obj = ObjectId(goal_id)
                    print(f"Converted goal_id to ObjectId: {goal_id_obj}")
                except Exception as e:
                    print(f"Could not convert goal_id to ObjectId: {e}")
                    goal_id_obj = goal_id  # fallback to string if conversion fails
                
                success = update_goal(goal_id_obj, goal_data, user_id)
                print(f"Update result: {success}")
            except Exception as update_err:
                print(f"Goal update error: {update_err}")
                traceback.print_exc()
                success = False
            
            # IMPORTANT FIX: Return a string response, not the dictionary
            if success:
                clean_response = re.sub(r"GOAL_MODIFY:\\s*({.*?})", "I've updated your goal.", response, flags=re.DOTALL)
                return clean_response
            else:
                clean_response = re.sub(r"GOAL_MODIFY:\\s*({.*?})", "I couldn't update your goal.", response, flags=re.DOTALL)
                return clean_response
        except Exception as e:
            print(f"Error processing goal modify: {e}")
            traceback.print_exc()  # Add traceback for better debugging
            # Replace the command with an error message
            clean_response = re.sub(r"GOAL_MODIFY:\\s*({.*?})", "I couldn't modify the goal due to an error.", response, flags=re.DOTALL)
            return clean_response
"""

# Fix the view meal plan functionality
# Problem: The meal plan view has an error "decoding to str: need a bytes-like object, NoneType found"
meal_plan_view_fix = """
    # Check for meal plan view request
    meal_plan_view_match = re.search(r"MEAL_PLAN_VIEW:", response)
    if meal_plan_view_match:
        try:
            # IMPORTANT FIX: Provide empty string default
            plan_text = await get_meal_plan_info("active") or "You don't have any active meal plans."
            clean_response = re.sub(r"MEAL_PLAN_VIEW:", plan_text, response)
            return clean_response
        except Exception as e:
            print(f"Error processing meal plan view: {e}")
            traceback.print_exc()
            clean_response = re.sub(r"MEAL_PLAN_VIEW:", "I couldn't retrieve your meal plan due to an error.", response)
            return clean_response
"""

# Add our meal suggestion processing function to the main content
if "def process_meal_suggestions(" not in content:
    # Find a good location to insert our function - after existing imports
    import_section_end = content.find("# Constants")
    if import_section_end == -1:
        import_section_end = content.find("# Global variables")
    
    if import_section_end != -1:
        content = content[:import_section_end] + meal_suggestion_fix + "\n\n" + content[import_section_end:]
        print("Added meal suggestion processing function")

# Apply the fixes
try:
    # Fix goal modification with malformed JSON
    content = re.sub(
        r'# Check for goal modify operation.*?goal_modify_match = re.search.*?(?=\s+# Check for goal delete operation)',
        goal_modification_fix,
        content,
        flags=re.DOTALL
    )
    print("Fixed goal modification with malformed JSON")
    
    # Fix meal plan view
    content = re.sub(
        r'# Check for meal plan view request.*?meal_plan_view_match = re.search.*?(?=\s+# Check for log meal from plan operation)',
        meal_plan_view_fix,
        content,
        flags=re.DOTALL
    )
    print("Fixed meal plan view")
    
    # Modify process_food_operations to use our meal suggestion processor
    # First, check if process_food_operations call is already present
    if "process_meal_suggestions(response, user_id)" not in content:
        # Find the meal suggestion operation section and replace it with a call to our function
        content = re.sub(
            r'# Check for meal suggestion operation.*?meal_match = re.search.*?(?=\s+# Check for food index operation)',
            '    # Process meal suggestions\n    response = process_meal_suggestions(response, user_id)\n\n    # Check for food index operation',
            content,
            flags=re.DOTALL
        )
        print("Modified process_food_operations to use meal suggestion processor")
    
    # Write the updated content
    with open(chatbot_path, 'w') as f:
        f.write(content)
    
    print("Successfully updated chatbot.py with comprehensive fixes")
    
except Exception as e:
    print(f"Error updating file: {e}")
    traceback.print_exc()
    
    # Restore backup on error
    shutil.copy2(backup_path, chatbot_path)
    print("Restored original file from backup due to error")
    sys.exit(1) 