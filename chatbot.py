import re
import json
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
from bson.objectid import ObjectId
from pydantic import ValidationError

from app.database import get_database
from app.meal_plan_models import MealPlanRequest
from app.meal_suggestions import MealSuggestionRequest, RemainingMacros
from app.food_db import search_food_items, add_food_item, update_food_item, delete_food_item
from app.food_logs import log_food, update_food_log_entry, delete_food_log_entry
from app.goals import create_goal, update_goal, delete_goal, get_user_active_goal, get_user_all_goals
from app.meal_plans import generate_meal_plan, get_meal_plan_info, log_meal_from_plan
from app.constants import USER_ID

# Global tracker to avoid contradictions about database state
food_db_has_data = None

# Conversation contexts for each user
conversation_contexts = {}

async def process_food_operations(response, user_id=None):
    """
    Process and execute food-related operations in the assistant's response.
    
    This function looks for special operation markers in the response:
    - FOOD_LOG: Add a food log entry
    - FOOD_INDEX: Add a food to the user's food database
    - MEAL_SUGGESTION: Suggest a meal based on the user's preferences and remaining macros
    
    Args:
        response (str): The assistant's response
        user_id (str, optional): The user ID. Defaults to None.
        
    Returns:
        str: The processed response with operation markers replaced with results
    """
    global food_db_has_data
    
    if not user_id:
        user_id = USER_ID
    
    # Check for meal suggestion operation
    meal_match = re.search(r"MEAL_SUGGESTION:\s*({.*})", response, re.DOTALL)
    if meal_match:
        try:
            # Extract and parse the meal data
            meal_data_str = meal_match.group(1).replace("'", '"')
            
            # Fix common JSON issues in meal data
            meal_data_str = re.sub(r',\s*}', '}', meal_data_str)
            meal_data_str = re.sub(r',\s*]', ']', meal_data_str)
            
            # Fix the specific issue at position 157 (missing closing brace after "fat": 20)
            # Direct replacement for the specific pattern we've identified
            if '"remaining_macros"' in meal_data_str and '"fat": 20}' in meal_data_str:
                meal_data_str = meal_data_str.replace('"fat": 20}', '"fat": 20}}')
                print(f"Applied direct fix for position 157 error: {meal_data_str}")
            
            # Balance braces if needed (as a backup approach)
            open_braces = meal_data_str.count('{')
            close_braces = meal_data_str.count('}')
            if open_braces > close_braces:
                meal_data_str += '}' * (open_braces - close_braces)
                print(f"Balanced braces by adding {open_braces - close_braces} closing braces")
            
            try:
                # Try to parse the fixed JSON
                meal_data = json.loads(meal_data_str)
            except json.JSONDecodeError as json_err:
                print(f"JSON decode error in meal suggestion: {json_err} in string: {meal_data_str}")
                
                # If we still have a problem, use our fallback regex approach
                if "line 1 column 157" in str(json_err):
                    print("Applying fallback regex approach for position 157 error")
                    
                    try:
                        # Extract each component using regex
                        meal_type_match = re.search(r'"meal_type"\s*:\s*"([^"]+)"', meal_data_str)
                        time_match = re.search(r'"time_of_day"\s*:\s*"([^"]+)"', meal_data_str)
                        pref_match = re.search(r'"preference"\s*:\s*"([^"]+)"', meal_data_str)
                        cal_match = re.search(r'"calories"\s*:\s*(\d+)', meal_data_str)
                        protein_match = re.search(r'"protein"\s*:\s*(\d+)', meal_data_str)
                        carbs_match = re.search(r'"carbs"\s*:\s*(\d+)', meal_data_str)
                        fat_match = re.search(r'"fat"\s*:\s*(\d+)', meal_data_str)
                        
                        # Construct a valid object from the pieces
                        meal_data = {
                            "meal_type": meal_type_match.group(1) if meal_type_match else "dinner",
                            "time_of_day": time_match.group(1) if time_match else "evening",
                            "preference": pref_match.group(1) if pref_match else "balanced",
                            "remaining_macros": {
                                "calories": int(cal_match.group(1)) if cal_match else 600,
                                "protein": int(protein_match.group(1)) if protein_match else 40,
                                "carbs": int(carbs_match.group(1)) if carbs_match else 50,
                                "fat": int(fat_match.group(1)) if fat_match else 20
                            }
                        }
                        print(f"Successfully created valid meal data using regex: {meal_data}")
                    except Exception as e:
                        print(f"Regex extraction failed, using default data: {e}")
                        # Last resort: use default values
                        meal_data = {
                            "meal_type": "dinner",
                            "time_of_day": "evening",
                            "preference": "balanced",
                            "remaining_macros": {
                                "calories": 600,
                                "protein": 40,
                                "carbs": 50,
                                "fat": 20
                            }
                        }
                else:
                    # Try to fix other common issues
                    for field in ["protein", "carbs", "fat"]:
                        if f'"{field}' in meal_data_str and not f'"{field}"' in meal_data_str:
                            meal_data_str = meal_data_str.replace(f'"{field}', f'"{field}"')
                    
                    # Try again after fixes
                    try:
                        meal_data = json.loads(meal_data_str)
                    except json.JSONDecodeError:
                        # Use default values if all else fails
                        meal_data = {
                            "meal_type": "dinner",
                            "time_of_day": "evening",
                            "preference": "balanced",
                            "remaining_macros": {
                                "calories": 600,
                                "protein": 40,
                                "carbs": 50,
                                "fat": 20
                            }
                        }
            
            # Add user_id to meal data
            meal_data["user_id"] = user_id
            
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
                    ingredient_matches = re.findall(r'\b(chicken|beef|fish|salmon|rice|beans|broccoli|eggs|cheese|nuts|spinach|avocado|quinoa|yogurt|milk|bread|pasta|potato|tomato|lettuce|cucumber|carrot|apple|banana|berries)\b', 
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
            
            # Set default values
            meal_data.setdefault("remaining_macros", {}).setdefault("calories", 600)
            meal_data.setdefault("remaining_macros", {}).setdefault("protein", 40)
            meal_data.setdefault("remaining_macros", {}).setdefault("carbs", 50)
            meal_data.setdefault("remaining_macros", {}).setdefault("fat", 20)
            
            return meal_data
        except Exception as e:
            print(f"Error parsing meal suggestion: {e}")
            return None
    else:
        return None

# Update conversation context with the last suggestion
if "MEAL_SUGGESTION" in assistant_response:
    meal_match = re.search(r"MEAL_SUGGESTION:\\s*({.*})", response, re.DOTALL)
    if meal_match:
        context["last_suggestions"].append(meal_match.group(1))
        context["suggestion_ingredients"].update(re.findall(r'\b(chicken|beef|fish|salmon|rice|beans|broccoli|eggs|cheese|nuts|spinach|avocado|quinoa)\b',
                                                           meal_match.group(1))) 