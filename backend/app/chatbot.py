import os
import requests
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta, timezone
import re
import json

from app.models import (
    get_user_food_logs_by_date,
    get_user_active_goal,
    search_food_items,
    add_food_item,
    update_food_item,
    delete_food_item,
    get_food_item,
    log_food,
    update_food_log_entry,
    delete_food_log_entry,
    get_food_log_entry,
    create_goal,
    update_goal,
    delete_goal,
    get_goal,
    get_user_all_goals
)
from app.constants import USER_ID
from app.meal_suggestions import build_meal_suggestion_prompt
from app.meal_plans import MealPlanRequest, generate_meal_plan, generate_single_day_meal_plan, get_active_plan, log_meal_from_plan
from app.auth import get_current_user

router = APIRouter()

# Global state tracking 
food_db_has_data = None

# Conversation context tracking
conversation_contexts = {}

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    fetch_context: bool = True
    session_id: Optional[str] = None
    user_id: Optional[str] = None

@router.post("/chat")
async def chat_with_claude(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """Send a message to Anthropic Claude with user context and get a response"""
    # Reset global database state at the start of each new conversation
    global food_db_has_data
    food_db_has_data = None
    
    # Set user_id from the authenticated user if available
    user_id = None
    if current_user:
        user_id = current_user.get("uid")
    elif request.user_id:  # Fallback to request user_id for backward compatibility
        user_id = request.user_id
    else:
        user_id = USER_ID  # Default to constant if no user specified
    
    # Get API key
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    
    if not api_key:
        return {"error": "API key not found. Make sure ANTHROPIC_API_KEY is set in your environment."}
    
    # Get the last user message
    last_user_message = next((m for m in reversed(request.messages) if m.role == "user"), None)
    
    if not last_user_message:
        return {"error": "No user message found in the request"}
    
    # Check if user is asking about ingredients from suggestions
    is_asking_about_ingredients = False
    ingredient_patterns = [
        r"which ingredients (do|are) (i|you) have",
        r"what (foods|ingredients) (do|are|from) (i|you|my) (have|database|index)",
        r"(do|are) (i|you) have (the|these) ingredients",
        r"what's in my (food )?database",
        r"what foods (do|are) (i|you) have"
    ]
    
    for pattern in ingredient_patterns:
        if re.search(pattern, last_user_message.content.lower()):
            is_asking_about_ingredients = True
            print("User is asking about ingredients from suggestions")
            break
    
    # Get or create conversation context
    session_id = request.session_id or "default"
    if session_id not in conversation_contexts:
        conversation_contexts[session_id] = {
            "dietary_preferences": [],
            "mentioned_ingredients": set(),
            "meal_types_of_interest": set(),
            "last_suggestion": None
        }
    
    # Update conversation context based on user message
    context = conversation_contexts[session_id]
    
    # Check for dietary preferences
    dietary_keywords = {
        "vegetarian": ["vegetarian", "no meat", "meatless"],
        "vegan": ["vegan", "plant-based", "no animal products"],
        "gluten-free": ["gluten-free", "no gluten", "gluten intolerance"],
        "dairy-free": ["dairy-free", "no dairy", "lactose intolerant"],
        "keto": ["keto", "ketogenic", "low-carb high-fat"],
        "low-carb": ["low-carb", "low carb", "low carbohydrate"],
        "high-protein": ["high-protein", "high protein", "protein rich"]
    }
    
    # Extract mentioned ingredients
    ingredient_matches = re.findall(r'\b(chicken|beef|fish|salmon|rice|beans|broccoli|eggs|cheese|nuts|spinach|avocado|quinoa)\b', 
                                   last_user_message.content.lower())
    if ingredient_matches:
        context["mentioned_ingredients"].update(ingredient_matches)
    
    # Extract meal types
    meal_types = ["breakfast", "lunch", "dinner", "snack"]
    for meal in meal_types:
        if meal in last_user_message.content.lower():
            context["meal_types_of_interest"].add(meal)
    
    # Check for dietary preferences
    for preference, keywords in dietary_keywords.items():
        if any(keyword in last_user_message.content.lower() for keyword in keywords):
            if preference not in context["dietary_preferences"]:
                context["dietary_preferences"].append(preference)
    
    # Fetch user context
    user_context = ""
    if request.fetch_context:
        try:
            user_context = await get_user_context(last_user_message.content, user_id)
        except Exception as e:
            print(f"Error fetching context: {e}")
    
    # Create a system prompt with all the capabilities we want
    system_prompt = get_system_prompt()
    
    # Add conversation context to system prompt
    if context["dietary_preferences"] or context["mentioned_ingredients"] or context["meal_types_of_interest"]:
        context_str = "\nConversation Context:\n"
        if context["dietary_preferences"]:
            context_str += f"- Dietary Preferences: {', '.join(context['dietary_preferences'])}\n"
        if context["mentioned_ingredients"]:
            context_str += f"- Ingredients of Interest: {', '.join(context['mentioned_ingredients'])}\n"
        if context["meal_types_of_interest"]:
            context_str += f"- Meal Types of Interest: {', '.join(context['meal_types_of_interest'])}\n"
        system_prompt += context_str
    
    if user_context:
        system_prompt += f"\n\nUser's nutrition information:\n{user_context}"
    
    # Format messages for Claude API
    formatted_messages = []
    for msg in request.messages:
        if msg.role not in ['user', 'assistant']:
            continue
        formatted_messages.append({
            "role": msg.role,
            "content": msg.content
        })
    
    try:
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": "claude-3-7-sonnet-20250219",
                "messages": formatted_messages,
                "system": system_prompt,
                "max_tokens": 1000,
                "temperature": 0.7
            },
            timeout=60  # Increased timeout from 30 to 60 seconds
        )
        
        if response.status_code != 200:
            print(f"API Error: {response.status_code} - {response.text}")
            return {"error": f"API returned error: {response.status_code}", "details": response.text}
        
        result = response.json()
        assistant_response = result["content"][0]["text"]
        
        # Check for special food database operations
        processed_response = await process_food_operations(assistant_response, user_id)
        
        # After processing, check for contradictory statements
        if food_db_has_data is True:
            # Replace any statements saying the food database is empty
            processed_response = processed_response.replace(
                "your food database appears to be empty or I'm unable to access it", 
                "I've found items in your food database"
            )
            processed_response = processed_response.replace(
                "You don't have any foods in your database yet", 
                "Based on the foods in your database"
            )
            processed_response = processed_response.replace(
                "It looks like your food database is currently empty", 
                "As you can see from the list above"
            )
            processed_response = processed_response.replace(
                "You haven't added any food items yet", 
                "You have these food items in your database"
            )
            processed_response = re.sub(
                r"I notice (I don't have access to|your food database is empty)",
                "Based on the foods in your database",
                processed_response,
                flags=re.IGNORECASE
            )
            
            # Remove entire contradictory paragraphs that might follow a food list
            processed_response = re.sub(
                r"(Here are (?:some |the )foods in your database.*?\n\n)It looks like your food database is.*?(\n\nWould you like)",
                r"\1\2",
                processed_response,
                flags=re.DOTALL
            )
            
            # Special handling for questions about ingredients
            if is_asking_about_ingredients and "I don't have access to your food database" in processed_response:
                foods = search_food_items("", user_id=user_id)
                food_names = [food.get("name") for food in foods if "name" in food]
                
                if food_names:
                    processed_response = "Based on your food database, you have these ingredients: " + ", ".join(food_names[:10])
                    if len(food_names) > 10:
                        processed_response += f" and {len(food_names)-10} more."
        
        # Update conversation context with the last suggestion
        if "MEAL_SUGGESTION" in assistant_response:
            meal_match = re.search(r"MEAL_SUGGESTION:\s*({.*?})", assistant_response, re.DOTALL)
            if meal_match:
                context["last_suggestion"] = meal_match.group(1)
        
        return {"response": processed_response}
        
    except Exception as e:
        print(f"Exception: {str(e)}")
        return {"error": f"Error: {str(e)}"}

async def process_food_operations(response, user_id=None):
    """
    Process any food database operations in the response
    
    Args:
        response: The response text from the AI
        user_id: The authenticated user's ID, defaults to constant USER_ID if not provided
    """
    if not user_id:
        user_id = USER_ID
    
    import re
    import json
    
    # Declare global variables at the top of the function
    global food_db_has_data
    
    # Check for meal suggestion operation
    meal_match = re.search(r"MEAL_SUGGESTION:\s*({.*?})", response, re.DOTALL)
    if meal_match:
        try:
            # Extract and parse the meal data
            meal_data_str = meal_match.group(1).replace("'", '"')
            meal_data = json.loads(meal_data_str)
            
            # Validate required fields
            required_fields = ["meal_type", "time_of_day"]
            for field in required_fields:
                if field not in meal_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Set default values
            if "remaining_macros" not in meal_data:
                # Get user's active goal to calculate remaining macros
                goal = get_user_active_goal(user_id)
                if goal and goal.get("nutrition_targets"):
                    target = goal["nutrition_targets"][0]
                    meal_data["remaining_macros"] = {
                        "calories": target.get("daily_calories", 2000),
                        "protein": target.get("proteins", 100),
                        "carbs": target.get("carbs", 200),
                        "fat": target.get("fats", 70)
                    }
                else:
                    meal_data["remaining_macros"] = {
                        "calories": 600,
                        "protein": 30,
                        "carbs": 60,
                        "fat": 20
                    }
            
            # Handle use_food_index_only parameter
            if "use_food_index_only" not in meal_data:
                meal_data["use_food_index_only"] = True  # Default to using only food index
            
            # Add user_id
            meal_data["user_id"] = user_id
            
            # Handle specific ingredients request if present
            if "specific_ingredients" not in meal_data and "preference" in meal_data:
                # Extract ingredients from preference
                ingredient_matches = re.findall(r'\b(chicken|beef|fish|salmon|rice|beans|broccoli|eggs|cheese|nuts|spinach|avocado|quinoa)\b', 
                                    meal_data["preference"].lower())
                if ingredient_matches:
                    meal_data["specific_ingredients"] = ingredient_matches
            
            # Check food database status if we haven't already
            if food_db_has_data is None:
                # Query food database to check if it has items
                foods = search_food_items("")
                food_db_has_data = len(foods) > 0
                print(f"Meal suggestion: Set food_db_has_data to {food_db_has_data}")
            
            # Create the request object
            from app.meal_suggestions import MealSuggestionRequest, RemainingMacros
            remaining = RemainingMacros(
                calories=meal_data["remaining_macros"]["calories"],
                protein=meal_data["remaining_macros"]["protein"],
                carbs=meal_data["remaining_macros"]["carbs"],
                fat=meal_data["remaining_macros"]["fat"]
            )
            
            request = MealSuggestionRequest(
                user_id=meal_data["user_id"],
                meal_type=meal_data["meal_type"],
                time_of_day=meal_data["time_of_day"],
                preference=meal_data.get("preference"),
                remaining_macros=remaining,
                use_food_index_only=meal_data.get("use_food_index_only", True),
                specific_ingredients=meal_data.get("specific_ingredients", [])
            )
            
            # Get meal suggestions
            from app.meal_suggestions import get_meal_suggestions
            suggestions_response = await get_meal_suggestions(request)
            
            # Format the suggestions for display
            # Update the message based on whether we're using food index only
            if meal_data.get("use_food_index_only", True):
                suggestions_text = "Here are some meal suggestions using items from your food database:\n\n"
            else:
                suggestions_text = "Here are some nutritious meal suggestions that might interest you:\n\n"
            
            # Determine how many suggestions to show based on specificity
            # If specific ingredients were requested, focus on fewer, more targeted suggestions
            max_suggestions = 1 if meal_data.get("specific_ingredients") else 3
            suggestions_to_show = suggestions_response.suggestions[:max_suggestions]
            
            for i, suggestion in enumerate(suggestions_to_show):
                suggestions_text += f"**{i+1}. {suggestion.name}**\n"
                suggestions_text += f"- **Serving:** {suggestion.serving_info}\n"
                suggestions_text += f"- Calories: {suggestion.macros.calories:.0f}, Protein: {suggestion.macros.protein:.1f}g, Carbs: {suggestion.macros.carbs:.1f}g, Fat: {suggestion.macros.fat:.1f}g\n"
                suggestions_text += f"- {suggestion.description}\n\n"
                
                # For specific ingredient requests, also show preparation instructions
                if meal_data.get("specific_ingredients") and i == 0:
                    suggestions_text += "**Preparation:**\n"
                    suggestions_text += "1. Prepare your ingredients by washing and chopping as needed\n"
                    suggestions_text += "2. Cook the main protein component first (if applicable)\n"
                    suggestions_text += "3. Add vegetables and other ingredients\n"
                    suggestions_text += "4. Season to taste and serve\n\n"
                    
                    # Add a tip for meal prep if it's a dinner or lunch
                    if meal_data["meal_type"] in ["dinner", "lunch"]:
                        suggestions_text += "> **Meal Prep Tip:** This dish can be prepared in advance and stored in the refrigerator for up to 3 days.\n\n"
            
            # Replace the command with the meal suggestions
            clean_response = re.sub(r"MEAL_SUGGESTION:\s*({.*?})", suggestions_text, response, flags=re.DOTALL)
            return clean_response
        except Exception as e:
            print(f"Error processing meal suggestion: {e}")
            # Replace the command with an error message
            clean_response = re.sub(r"MEAL_SUGGESTION:\s*({.*?})", "I couldn't generate meal suggestions due to an error.", response, flags=re.DOTALL)
            return clean_response
    
    # Check for food index operation
    index_match = re.search(r"FOOD_INDEX:\s*({.*?})", response, re.DOTALL)
    if index_match:
        try:
            # Extract and parse the food data
            food_data_str = index_match.group(1).replace("'", '"')
            food_data = json.loads(food_data_str)
            
            # Add required fields
            food_data["created_by"] = user_id
            food_data["source"] = "user-chat"
            
            # Convert string values to correct types
            for field in ["serving_size", "calories", "proteins", "carbs", "fats", "fiber"]:
                if field in food_data and food_data[field] is not None:
                    food_data[field] = float(food_data[field])
            
            # Add to database
            food_id = add_food_item(food_data)
            
            # Replace the command with a confirmation message
            clean_response = re.sub(r"FOOD_INDEX:\s*({.*?})", f"I've added {food_data['name']} to your food database.", response, flags=re.DOTALL)
            return clean_response
        except Exception as e:
            print(f"Error processing food index: {e}")
            # Replace the command with an error message
            clean_response = re.sub(r"FOOD_INDEX:\s*({.*?})", "I couldn't add the food to your database due to an error.", response, flags=re.DOTALL)
            return clean_response
    
    # Check for food modify operation
    modify_match = re.search(r"FOOD_MODIFY:\s*({.*?})", response, re.DOTALL)
    if modify_match:
        try:
            # Extract and parse the food data
            food_data_str = modify_match.group(1).replace("'", '"')
            food_data = json.loads(food_data_str)
            
            # Find the food by name
            food_name = food_data.pop("name", "")
            if not food_name:
                return "I couldn't identify which food to modify."
            
            matching_foods = search_food_items(food_name)
            if not matching_foods:
                clean_response = re.sub(r"FOOD_MODIFY:\s*({.*?})", f"I couldn't find a food named '{food_name}' in your database.", response, flags=re.DOTALL)
                return clean_response
            
            # Modify the first matching food
            food_id = matching_foods[0]["_id"]
            
            # Convert string values to correct types
            for field in ["serving_size", "calories", "proteins", "carbs", "fats", "fiber"]:
                if field in food_data and food_data[field] is not None:
                    food_data[field] = float(food_data[field])
            
            # Update in database
            success = update_food_item(food_id, food_data)
            
            # Replace the command with a confirmation message
            if success:
                clean_response = re.sub(r"FOOD_MODIFY:\s*({.*?})", f"I've updated {food_name} in your food database.", response, flags=re.DOTALL)
            else:
                clean_response = re.sub(r"FOOD_MODIFY:\s*({.*?})", f"I couldn't update {food_name} in your database.", response, flags=re.DOTALL)
            return clean_response
        except Exception as e:
            print(f"Error processing food modify: {e}")
            # Replace the command with an error message
            clean_response = re.sub(r"FOOD_MODIFY:\s*({.*?})", "I couldn't modify the food due to an error.", response, flags=re.DOTALL)
            return clean_response
    
    # Check for food delete operation
    delete_match = re.search(r"FOOD_DELETE:\s*({.*?})", response, re.DOTALL)
    if delete_match:
        try:
            # Extract and parse the food data
            food_data_str = delete_match.group(1).replace("'", '"')
            food_data = json.loads(food_data_str)
            
            # Find the food by name
            food_name = food_data.get("name", "")
            if not food_name:
                return "I couldn't identify which food to delete."
            
            matching_foods = search_food_items(food_name)
            if not matching_foods:
                clean_response = re.sub(r"FOOD_DELETE:\s*({.*?})", f"I couldn't find a food named '{food_name}' in your database.", response, flags=re.DOTALL)
                return clean_response
            
            # Delete the first matching food
            food_id = matching_foods[0]["_id"]
            success = delete_food_item(food_id)
            
            # Replace the command with a confirmation message
            if success:
                clean_response = re.sub(r"FOOD_DELETE:\s*({.*?})", f"I've deleted {food_name} from your food database.", response, flags=re.DOTALL)
            else:
                clean_response = re.sub(r"FOOD_DELETE:\s*({.*?})", f"I couldn't delete {food_name} from your database.", response, flags=re.DOTALL)
            return clean_response
        except Exception as e:
            print(f"Error processing food delete: {e}")
            # Replace the command with an error message
            clean_response = re.sub(r"FOOD_DELETE:\s*({.*?})", "I couldn't delete the food due to an error.", response, flags=re.DOTALL)
            return clean_response
    
    # Check for food list operation
    list_match = re.search(r"FOOD_LIST:([^\n]*)", response)
    if list_match:
        try:
            # Extract search term if any
            search_term = list_match.group(1).strip()
            
            print(f"Food list search term: '{search_term}'")
            
            # Search foods in database
            foods = search_food_items(search_term)
            print(f"Found {len(foods)} foods matching term: '{search_term}'")
            
            # Set global tracker for database state
            food_db_has_data = len(foods) > 0
            print(f"Set global food_db_has_data to {food_db_has_data}")
            
            if not foods:
                list_text = "You don't have any foods in your database yet."
                if search_term:
                    list_text = f"I couldn't find any foods matching '{search_term}' in your database."
            else:
                # Format the food list
                if len(foods) > 10:
                    list_text = f"Here are some foods in your database (showing 10 of {len(foods)}):\n\n"
                else:
                    list_text = "Here are the foods in your database:\n\n"
                
                for i, food in enumerate(foods[:10]):
                    food_name = food.get('name', 'Unnamed food')
                    serving_size = food.get('serving_size', 0)
                    serving_unit = food.get('serving_unit', 'g')
                    calories = food.get('calories', 0)
                    proteins = food.get('proteins', 0)
                    carbs = food.get('carbs', 0)
                    fats = food.get('fats', 0)
                    
                    # Enhanced formatting with more nutritional info
                    list_text += f"**{i+1}. {food_name}**\n"
                    list_text += f"   - Serving: {serving_size} {serving_unit}\n"
                    list_text += f"   - Calories: {calories} cal\n"
                    list_text += f"   - Macros: {proteins}g protein, {carbs}g carbs, {fats}g fat\n\n"
                
                # Explicitly state that the database is not empty to prevent contradictions
                if search_term:
                    list_text += f"These are the items in your database matching '{search_term}'.\n\n"
                else:
                    list_text += "These items are available in your food database.\n\n"
            
            # Replace the command with the food list
            clean_response = re.sub(r"FOOD_LIST:[^\n]*(\n|$)", list_text, response)
            return clean_response
        except Exception as e:
            print(f"Error processing food list: {e}")
            # Replace the command with an error message
            clean_response = re.sub(r"FOOD_LIST:[^\n]*(\n|$)", "I couldn't retrieve your food list due to an error.", response)
            return clean_response
    
    # Check for food log operation
    log_match = re.search(r"FOOD_LOG:\s*({.*?})", response, re.DOTALL)
    if log_match:
        try:
            # Extract and parse the food log data
            log_data_str = log_match.group(1).replace("'", '"')
            log_data = json.loads(log_data_str)
            
            # Find the food by name if food_id is not provided
            if "food_id" not in log_data and "name" in log_data:
                food_name = log_data["name"]
                matching_foods = search_food_items(food_name)
                if not matching_foods:
                    clean_response = re.sub(r"FOOD_LOG:\s*({.*?})", f"I couldn't find a food named '{food_name}' in your database to log.", response, flags=re.DOTALL)
                    return clean_response
                
                # Use the first matching food
                food = matching_foods[0]
                log_data["food_id"] = str(food["_id"])
                
                # Use food data if not provided in log_data
                if "amount" not in log_data:
                    log_data["amount"] = food.get("serving_size", 1)
                if "unit" not in log_data:
                    log_data["unit"] = food.get("serving_unit", "serving")
                if "calories" not in log_data:
                    log_data["calories"] = food.get("calories", 0)
                if "proteins" not in log_data:
                    log_data["proteins"] = food.get("proteins", 0)
                if "carbs" not in log_data:
                    log_data["carbs"] = food.get("carbs", 0)
                if "fats" not in log_data:
                    log_data["fats"] = food.get("fats", 0)
                if "fiber" not in log_data:
                    log_data["fiber"] = food.get("fiber", 0)
            
            # Add required fields
            log_data["user_id"] = user_id
            
            # Use current date if not provided
            if "date" not in log_data:
                log_data["date"] = datetime.now()
            
            # Use default meal type if not provided
            if "meal_type" not in log_data:
                # Determine meal type based on current time
                hour = datetime.now().hour
                if 5 <= hour < 10:
                    log_data["meal_type"] = "Breakfast"
                elif 10 <= hour < 14:
                    log_data["meal_type"] = "Lunch"
                elif 17 <= hour < 21:
                    log_data["meal_type"] = "Dinner"
                else:
                    log_data["meal_type"] = "Snack"
            
            # Add to food log
            log_id = log_food(log_data)
            
            # Replace the command with a confirmation message
            food_name = log_data.get("name", "Food item")
            clean_response = re.sub(r"FOOD_LOG:\s*({.*?})", f"I've logged {food_name} ({log_data.get('amount')} {log_data.get('unit')}) to your {log_data.get('meal_type')} for today.", response, flags=re.DOTALL)
            return clean_response
        except Exception as e:
            print(f"Error processing food log: {e}")
            # Replace the command with an error message
            clean_response = re.sub(r"FOOD_LOG:\s*({.*?})", "I couldn't log the food due to an error.", response, flags=re.DOTALL)
            return clean_response
            
    # Check for food log modify operation
    log_modify_match = re.search(r"FOOD_LOG_MODIFY:\s*({.*?})", response, re.DOTALL)
    if log_modify_match:
        try:
            # Extract and parse the food log data
            log_data_str = log_modify_match.group(1).replace("'", '"')
            log_data = json.loads(log_data_str)
            
            # Need log_entry_id to modify
            if "log_entry_id" not in log_data:
                clean_response = re.sub(r"FOOD_LOG_MODIFY:\s*({.*?})", "I need a log_entry_id to modify a food log entry.", response, flags=re.DOTALL)
                return clean_response
            
            log_entry_id = log_data.pop("log_entry_id")
            
            # Convert string values to correct types
            for field in ["amount", "calories", "proteins", "carbs", "fats", "fiber"]:
                if field in log_data and log_data[field] is not None:
                    log_data[field] = float(log_data[field])
            
            # Update the food log entry
            success = update_food_log_entry(log_entry_id, log_data, user_id)
            
            # Replace the command with a confirmation message
            if success:
                clean_response = re.sub(r"FOOD_LOG_MODIFY:\s*({.*?})", f"I've updated the food log entry.", response, flags=re.DOTALL)
            else:
                clean_response = re.sub(r"FOOD_LOG_MODIFY:\s*({.*?})", f"I couldn't update the food log entry.", response, flags=re.DOTALL)
            return clean_response
        except Exception as e:
            print(f"Error processing food log modify: {e}")
            # Replace the command with an error message
            clean_response = re.sub(r"FOOD_LOG_MODIFY:\s*({.*?})", "I couldn't modify the food log entry due to an error.", response, flags=re.DOTALL)
            return clean_response
            
    # Check for food log delete operation
    log_delete_match = re.search(r"FOOD_LOG_DELETE:\s*({.*?})", response, re.DOTALL)
    if log_delete_match:
        try:
            # Extract and parse the food log data
            log_data_str = log_delete_match.group(1).replace("'", '"')
            log_data = json.loads(log_data_str)
            
            # Need log_entry_id to delete
            if "log_entry_id" not in log_data:
                clean_response = re.sub(r"FOOD_LOG_DELETE:\s*({.*?})", "I need a log_entry_id to delete a food log entry.", response, flags=re.DOTALL)
                return clean_response
            
            log_entry_id = log_data["log_entry_id"]
            
            # Delete the food log entry
            success = delete_food_log_entry(log_entry_id, user_id)
            
            # Replace the command with a confirmation message
            if success:
                clean_response = re.sub(r"FOOD_LOG_DELETE:\s*({.*?})", f"I've deleted the food log entry.", response, flags=re.DOTALL)
            else:
                clean_response = re.sub(r"FOOD_LOG_DELETE:\s*({.*?})", f"I couldn't delete the food log entry.", response, flags=re.DOTALL)
            return clean_response
        except Exception as e:
            print(f"Error processing food log delete: {e}")
            # Replace the command with an error message
            clean_response = re.sub(r"FOOD_LOG_DELETE:\s*({.*?})", "I couldn't delete the food log entry due to an error.", response, flags=re.DOTALL)
            return clean_response
            
    # Check for goal add operation
    goal_add_match = re.search(r"GOAL_ADD:\s*({.*?})", response, re.DOTALL)
    if goal_add_match:
        try:
            # Extract and parse the goal data
            goal_data_str = goal_add_match.group(1).replace("'", '"')
            goal_data = json.loads(goal_data_str)
            
            # Add user_id to goal data
            goal_data["user_id"] = user_id
            
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
            
            # Create the goal
            goal_id = create_goal(goal_data)
            
            # Replace the command with a confirmation message
            goal_type = goal_data.get("type", "nutrition")
            clean_response = re.sub(r"GOAL_ADD:\s*({.*?})", f"I've added your new {goal_type} goal.", response, flags=re.DOTALL)
            return clean_response
        except Exception as e:
            print(f"Error processing goal add: {e}")
            # Replace the command with an error message
            clean_response = re.sub(r"GOAL_ADD:\s*({.*?})", "I couldn't add the goal due to an error.", response, flags=re.DOTALL)
            return clean_response
            
    # Check for goal modify operation
    goal_modify_match = re.search(r"GOAL_MODIFY:\s*({.*?})", response, re.DOTALL)
    if goal_modify_match:
        try:
            # Extract and parse the goal data
            goal_data_str = goal_modify_match.group(1).replace("'", '"')
            goal_data = json.loads(goal_data_str)
            
            # Need goal_id to modify
            if "goal_id" not in goal_data:
                clean_response = re.sub(r"GOAL_MODIFY:\s*({.*?})", "I need a goal_id to modify a goal.", response, flags=re.DOTALL)
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
            success = update_goal(goal_id, goal_data, user_id)
            
            # Replace the command with a confirmation message
            if success:
                clean_response = re.sub(r"GOAL_MODIFY:\s*({.*?})", f"I've updated your goal.", response, flags=re.DOTALL)
            else:
                clean_response = re.sub(r"GOAL_MODIFY:\s*({.*?})", f"I couldn't update your goal.", response, flags=re.DOTALL)
            return clean_response
        except Exception as e:
            print(f"Error processing goal modify: {e}")
            # Replace the command with an error message
            clean_response = re.sub(r"GOAL_MODIFY:\s*({.*?})", "I couldn't modify the goal due to an error.", response, flags=re.DOTALL)
            return clean_response
            
    # Check for goal delete operation
    goal_delete_match = re.search(r"GOAL_DELETE:\s*({.*?})", response, re.DOTALL)
    if goal_delete_match:
        try:
            # Extract and parse the goal data
            goal_data_str = goal_delete_match.group(1).replace("'", '"')
            goal_data = json.loads(goal_data_str)
            
            # Need goal_id to delete
            if "goal_id" not in goal_data:
                clean_response = re.sub(r"GOAL_DELETE:\s*({.*?})", "I need a goal_id to delete a goal.", response, flags=re.DOTALL)
                return clean_response
            
            goal_id = goal_data["goal_id"]
            
            # Delete the goal
            success = delete_goal(goal_id, user_id)
            
            # Replace the command with a confirmation message
            if success:
                clean_response = re.sub(r"GOAL_DELETE:\s*({.*?})", f"I've deleted your goal.", response, flags=re.DOTALL)
            else:
                clean_response = re.sub(r"GOAL_DELETE:\s*({.*?})", f"I couldn't delete your goal.", response, flags=re.DOTALL)
            return clean_response
        except Exception as e:
            print(f"Error processing goal delete: {e}")
            # Replace the command with an error message
            clean_response = re.sub(r"GOAL_DELETE:\s*({.*?})", "I couldn't delete the goal due to an error.", response, flags=re.DOTALL)
            return clean_response
            
    # Check for goal list operation
    goal_list_match = re.search(r"GOAL_LIST:", response)
    if goal_list_match:
        try:
            # Get all goals for the user
            goals = get_user_all_goals(user_id)
            
            # Format the goal list
            if not goals:
                list_text = "You don't have any goals set yet."
            else:
                active_goal = next((goal for goal in goals if goal.get("active", False)), None)
                
                list_text = "Here are your nutrition goals:\n\n"
                
                # List active goal first if there is one
                if active_goal:
                    list_text += f"**Active Goal: {active_goal.get('type', 'Nutrition')} Goal**\n"
                    if "weight_target" in active_goal:
                        wt = active_goal["weight_target"]
                        list_text += f"- Weight: {wt.get('current', 0):.1f} kg → {wt.get('goal', 0):.1f} kg\n"
                        list_text += f"- Rate: {wt.get('weekly_rate', 0):.1f} kg per week\n"
                    
                    if "nutrition_targets" in active_goal and active_goal["nutrition_targets"]:
                        target = active_goal["nutrition_targets"][0]
                        list_text += f"- Daily calories: {target.get('daily_calories', 0):.0f} calories\n"
                        list_text += f"- Protein: {target.get('proteins', 0):.1f}g\n"
                        list_text += f"- Carbs: {target.get('carbs', 0):.1f}g\n"
                        list_text += f"- Fat: {target.get('fats', 0):.1f}g\n"
                        if target.get('fiber', 0) > 0:
                            list_text += f"- Fiber: {target.get('fiber', 0):.1f}g\n"
                    
                    list_text += f"\nGoal ID: {active_goal.get('_id')}\n\n"
                
                # List other goals
                inactive_goals = [goal for goal in goals if not goal.get("active", False)]
                if inactive_goals:
                    if active_goal:
                        list_text += "**Other Goals:**\n\n"
                    
                    for goal in inactive_goals:
                        list_text += f"**{goal.get('type', 'Nutrition')} Goal**\n"
                        if "weight_target" in goal:
                            wt = goal["weight_target"]
                            list_text += f"- Weight: {wt.get('current', 0):.1f} kg → {wt.get('goal', 0):.1f} kg\n"
                        
                        if "nutrition_targets" in goal and goal["nutrition_targets"]:
                            target = goal["nutrition_targets"][0]
                            list_text += f"- Daily calories: {target.get('daily_calories', 0):.0f} calories\n"
                        
                        list_text += f"Goal ID: {goal.get('_id')}\n\n"
            
            # Replace the command with the goal list
            clean_response = re.sub(r"GOAL_LIST:", list_text, response)
            return clean_response
        except Exception as e:
            print(f"Error processing goal list: {e}")
            # Replace the command with an error message
            clean_response = re.sub(r"GOAL_LIST:", "I couldn't retrieve your goals due to an error.", response)
            return clean_response
    
    # Check for meal plan generation operation
    meal_plan_match = re.search(r"MEAL_PLAN_GENERATE:\s*({.*?})", response, re.DOTALL)
    if meal_plan_match:
        try:
            # Extract and parse the meal plan data
            meal_plan_data_str = meal_plan_match.group(1).replace("'", '"')
            meal_plan_data = json.loads(meal_plan_data_str)
            
            # Add user_id to meal plan data
            meal_plan_data["user_id"] = user_id
            
            # Create the meal plan request
            meal_plan_request = MealPlanRequest(**meal_plan_data)
            
            # Generate the meal plan
            meal_plan = await generate_meal_plan(meal_plan_request)
            
            # Format the meal plan summary
            summary_text = f"I've generated a {meal_plan.get('name', 'Weekly Meal Plan')} for you.\n\n"
            summary_text += f"The plan covers {len(meal_plan.get('days', []))} days from {meal_plan.get('start_date')} to {meal_plan.get('end_date')}.\n\n"
            summary_text += "**Nutrition Summary:**\n"
            if 'plan_totals' in meal_plan:
                totals = meal_plan['plan_totals']
                summary_text += f"- Total calories: {totals.get('calories', 0):.0f} calories\n"
                summary_text += f"- Total protein: {totals.get('protein', 0):.0f}g\n"
                summary_text += f"- Total carbs: {totals.get('carbs', 0):.0f}g\n"
                summary_text += f"- Total fat: {totals.get('fat', 0):.0f}g\n\n"
            
            summary_text += "**Sample Day (Day 1):**\n"
            if 'days' in meal_plan and len(meal_plan['days']) > 0:
                day = meal_plan['days'][0]
                for meal_type in ['breakfast', 'lunch', 'dinner', 'snack']:
                    if meal_type in day.get('meals', {}) and day['meals'][meal_type]:
                        meal = day['meals'][meal_type]
                        summary_text += f"- **{meal_type.capitalize()}:** {meal.get('name', 'Meal')} ({meal.get('macros', {}).get('calories', 0):.0f} calories)\n"
            
            summary_text += "\nYou can view the full meal plan in the Meal Planner section of the app."
            
            # Replace the command with the meal plan summary
            clean_response = re.sub(r"MEAL_PLAN_GENERATE:\s*({.*?})", summary_text, response, flags=re.DOTALL)
            return clean_response
        except Exception as e:
            print(f"Error processing meal plan generation: {e}")
            # Replace the command with an error message
            clean_response = re.sub(r"MEAL_PLAN_GENERATE:\s*({.*?})", "I couldn't generate the meal plan due to an error.", response, flags=re.DOTALL)
            return clean_response
    
    # Check for meal plan view request
    meal_plan_view_match = re.search(r"MEAL_PLAN_VIEW:", response)
    if meal_plan_view_match:
        try:
            # Use the new function to get meal plan info
            plan_text = await get_meal_plan_info("active")
            clean_response = re.sub(r"MEAL_PLAN_VIEW:", plan_text, response)
            return clean_response
        except Exception as e:
            print(f"Error processing meal plan view: {e}")
            clean_response = re.sub(r"MEAL_PLAN_VIEW:", "I couldn't retrieve your meal plan due to an error.", response)
            return clean_response
    
    # Check for log meal from plan operation
    log_meal_match = re.search(r"MEAL_PLAN_LOG:\s*({.*?})", response, re.DOTALL)
    if log_meal_match:
        try:
            # Extract and parse the log meal data
            log_meal_data_str = log_meal_match.group(1).replace("'", '"')
            log_meal_data = json.loads(log_meal_data_str)
            
            # Validate required fields
            required_fields = ["meal_plan_id", "day_index", "meal_type"]
            for field in required_fields:
                if field not in log_meal_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Add user_id to log meal data
            log_meal_data["user_id"] = user_id
            
            # Log the meal from the plan
            result = await log_meal_from_plan(
                user_id=log_meal_data["user_id"],
                meal_plan_id=log_meal_data["meal_plan_id"],
                day_index=log_meal_data["day_index"],
                meal_type=log_meal_data["meal_type"]
            )
            
            # Replace the command with a confirmation message
            meal_name = "meal"
            if result and isinstance(result, dict) and "name" in result:
                meal_name = result["name"]
            clean_response = re.sub(r"MEAL_PLAN_LOG:\s*({.*?})", f"I've logged {meal_name} to your food log.", response, flags=re.DOTALL)
            return clean_response
        except Exception as e:
            print(f"Error processing log meal from plan: {e}")
            # Replace the command with an error message
            clean_response = re.sub(r"MEAL_PLAN_LOG:\s*({.*?})", "I couldn't log the meal from your plan due to an error.", response, flags=re.DOTALL)
            return clean_response
    # If no special operations, return the original response
    return response

async def get_user_context(query: str, user_id: str = None) -> str:
    """
    Get relevant context about the user's nutrition data based on their query.
    
    Args:
        query: The user's query
        user_id: The authenticated user's ID, defaults to constant USER_ID if not provided
    """
    try:
        context_parts = []
        
        if not user_id:
            user_id = USER_ID
            
        print(f"Starting get_user_context for query: {query} and user_id: {user_id}")
        
        # Check if user is asking for meal suggestions
        meal_suggestion = detect_meal_suggestion(query)
        if meal_suggestion:
            meal_context = await get_meal_suggestion_context(meal_suggestion, user_id)
            context_parts.append(meal_context)
    
        # Get today's date in UTC to match how we store dates
        today = datetime.now(timezone.utc).date()
        print(f"Using today's date (UTC): {today}")
        
        # Check for date references in the query
        query_lower = query.lower()
        
        # Check for specific date references
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)
        this_week_start = today - timedelta(days=today.weekday())
        this_week_end = this_week_start + timedelta(days=6)
        last_week_end = this_week_start - timedelta(days=1)
        last_week_start = last_week_end - timedelta(days=6)
        
        date_to_check = today  # Default to today
        
        # Define date patterns to look for
        date_patterns = {
            "yesterday": yesterday,
            "last night": yesterday,
            "the day before": yesterday,
            "previous day": yesterday,
            "tomorrow": tomorrow,
            "next day": tomorrow,
            "last week": last_week_start,  # We'll handle this differently for a range
            "previous week": last_week_start,  # We'll handle this differently for a range
            "this week": this_week_start,  # We'll handle this differently for a range
            "this month": today.replace(day=1),  # First day of current month
            "last month": (today.replace(day=1) - timedelta(days=1)).replace(day=1)  # First day of previous month
        }
        
        # Add patterns for "X days ago"
        days_ago_match = re.search(r"(\d+)\s+days?\s+ago", query_lower)
        if days_ago_match:
            days = int(days_ago_match.group(1))
            date_to_check = today - timedelta(days=days)
            print(f"Detected '{days} days ago' pattern: {date_to_check}")

        # Add pattern for general date range like "April 5 to April 10" or "January 1 through March 15"
        date_range_pattern = re.search(r"(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d+)(?:st|nd|rd|th)?\s+(?:to|through|until|thru|[-–—])\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d+)(?:st|nd|rd|th)?", query_lower)
        
        if date_range_pattern:
            print(f"Detected custom date range pattern: {date_range_pattern.group(0)}")
            start_month = date_range_pattern.group(1)
            start_day = int(date_range_pattern.group(2))
            end_month = date_range_pattern.group(3)
            end_day = int(date_range_pattern.group(4))
            
            # Convert month names to indices (1-12)
            months = ["january", "february", "march", "april", "may", "june", "july", 
                     "august", "september", "october", "november", "december",
                     "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
            
            start_month_idx = (months.index(start_month) % 12) + 1
            end_month_idx = (months.index(end_month) % 12) + 1
            
            # Use current year as default
            year = today.year
            
            # Create date objects
            try:
                start_date = datetime(year, start_month_idx, start_day).date()
                end_date = datetime(year, end_month_idx, end_day).date()
                
                # If end date is before start date, it might cross a year boundary
                if end_date < start_date:
                    if end_month_idx < start_month_idx:
                        # End date is likely in the next year
                        end_date = datetime(year + 1, end_month_idx, end_day).date()
                    else:
                        # Start date might be from last year
                        start_date = datetime(year - 1, start_month_idx, start_day).date()
                
                # If both dates are far in the future, assume they're from last year
                if start_date > today and (start_date - today).days > 31:
                    start_date = datetime(year - 1, start_month_idx, start_day).date()
                    end_date = datetime(year - 1, end_month_idx, end_day).date()
                    if end_date < start_date:
                        end_date = datetime(year, end_month_idx, end_day).date()
                
                is_date_range = True
                print(f"Parsed date range: {start_date} to {end_date}")
            except ValueError as e:
                print(f"Invalid date in range: {e}, falling back to today")
                date_to_check = today

        # Check for specific date mentions (e.g., "April 21st", "May 3")
        # Common date patterns with months
        months = ["january", "february", "march", "april", "may", "june", "july", 
                 "august", "september", "october", "november", "december",
                 "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
        
        # Look for pattern like "April 21st" or "April 21"
        for month in months:
            month_pattern = re.compile(rf"{month}\s+(\d+)(?:st|nd|rd|th)?", re.IGNORECASE)
            match = month_pattern.search(query_lower)
            if match:
                day = int(match.group(1))
                month_idx = months.index(month) % 12 + 1  # Get month number (1-12)
                
                # Use current year as default, but if the resulting date is in the future,
                # and more than 1 month ahead, assume it's from last year
                year = today.year
                potential_date = datetime(year, month_idx, min(day, 28)).date()  # Use 28 to avoid month boundary issues
                
                if potential_date > today and (potential_date - today).days > 31:
                    year -= 1
                
                try:
                    date_to_check = datetime(year, month_idx, day).date()
                    print(f"Detected specific date: {month} {day} ({date_to_check})")
                    break
                except ValueError:
                    # If date is invalid (like Feb 30), fall back to today
                    print(f"Invalid date detected: {month} {day}, using today instead")
                    date_to_check = today

        # Check for date references in the query
        for pattern, date_value in date_patterns.items():
            if pattern in query_lower:
                if pattern in ["last week", "previous week"]:
                    is_date_range = True
                    start_date = last_week_start
                    end_date = last_week_end
                    print(f"Detected date range: last week ({start_date} to {end_date})")
                    break
                elif pattern in ["this week"]:
                    is_date_range = True
                    start_date = this_week_start
                    end_date = this_week_end
                    print(f"Detected date range: this week ({start_date} to {end_date})")
                    break
                elif pattern in ["this month"]:
                    is_date_range = True
                    start_date = today.replace(day=1)
                    # Last day of current month
                    if today.month == 12:
                        end_date = datetime(today.year + 1, 1, 1).date() - timedelta(days=1)
                    else:
                        end_date = datetime(today.year, today.month + 1, 1).date() - timedelta(days=1)
                    print(f"Detected date range: this month ({start_date} to {end_date})")
                    break
                elif pattern in ["last month"]:
                    is_date_range = True
                    # First day of previous month
                    if today.month == 1:
                        start_date = datetime(today.year - 1, 12, 1).date()
                    else:
                        start_date = datetime(today.year, today.month - 1, 1).date()
                    # Last day of previous month
                    end_date = today.replace(day=1) - timedelta(days=1)
                    print(f"Detected date range: last month ({start_date} to {end_date})")
                    break
                else:
                    date_to_check = date_value
                    print(f"Detected date pattern '{pattern}': {date_to_check}")
                    break

        # Check for "last X days" pattern
        last_x_days_match = re.search(r"last\s+(\d+)\s+days", query_lower)
        if last_x_days_match:
            days = int(last_x_days_match.group(1))
            is_date_range = True
            end_date = today
            start_date = today - timedelta(days=days-1)  # inclusive of today
            print(f"Detected 'last {days} days' pattern: {start_date} to {end_date}")

        # Get food logs based on detected dates
        print(f"Using user_id: {user_id}")
        
        # Initialize variables for date range handling
        if not 'is_date_range' in locals():
            is_date_range = False
        if not 'start_date' in locals():
            start_date = None
        if not 'end_date' in locals():
            end_date = None
        
        # Fetch logs based on date pattern detected
        if is_date_range and start_date and end_date:
            print(f"Fetching logs for date range: {start_date} to {end_date}")
            # Get logs for each day in the range
            current_date = start_date
            all_logs = []
            while current_date <= end_date:
                daily_logs = await get_user_food_logs_by_date(user_id, current_date.strftime("%Y-%m-%d"))
                if daily_logs:
                    for log in daily_logs:
                        log["date"] = current_date.strftime("%A, %B %d, %Y")  # Add formatted date
                    all_logs.extend(daily_logs)
                current_date += timedelta(days=1)
            
            if all_logs:
                # Group logs by date for better readability
                logs_by_date = {}
                for log in all_logs:
                    date_str = log["date"]
                    if date_str not in logs_by_date:
                        logs_by_date[date_str] = []
                    logs_by_date[date_str].append(log)
                
                # Format logs for each day
                for date_str, logs in logs_by_date.items():
                    daily_calories = sum(log.get("calories", 0) for log in logs)
                    daily_proteins = sum(log.get("proteins", 0) for log in logs)
                    daily_carbs = sum(log.get("carbs", 0) for log in logs)
                    daily_fats = sum(log.get("fats", 0) for log in logs)
                    
                    # Format the logs for this day
                    day_context = f"Food log for {date_str}:\n"
                    day_context += f"Total: {daily_calories:.0f} calories, {daily_proteins:.1f}g protein, {daily_carbs:.1f}g carbs, {daily_fats:.1f}g fat\n"
                    
                    # Group logs by meal
                    logs_by_meal = {}
                    for log in logs:
                        meal = log.get("meal", "Other")
                        if meal not in logs_by_meal:
                            logs_by_meal[meal] = []
                        logs_by_meal[meal].append(log)
                    
                    # Add each meal to the context
                    for meal, meal_logs in logs_by_meal.items():
                        meal_calories = sum(log.get("calories", 0) for log in meal_logs)
                        day_context += f"\n{meal}: {meal_calories:.0f} calories\n"
                        for log in meal_logs:
                            day_context += f"- {log.get('name', 'Unknown food')}: {log.get('calories', 0):.0f} cal"
                            if log.get("serving_size") and log.get("serving_unit"):
                                day_context += f" ({log.get('serving_size')} {log.get('serving_unit')})"
                            day_context += "\n"
                    
                    context_parts.append(day_context)
                
                # Add summary for the entire range
                total_calories = sum(log.get("calories", 0) for log in all_logs)
                total_proteins = sum(log.get("proteins", 0) for log in all_logs)
                total_carbs = sum(log.get("carbs", 0) for log in all_logs)
                total_fats = sum(log.get("fats", 0) for log in all_logs)
                
                range_summary = f"\nSummary for {start_date.strftime('%B %d')} to {end_date.strftime('%B %d')}:\n"
                range_summary += f"Total: {total_calories:.0f} calories, {total_proteins:.1f}g protein, {total_carbs:.1f}g carbs, {total_fats:.1f}g fat\n"
                range_summary += f"Daily Average: {total_calories / (end_date - start_date).days + 1:.0f} calories\n"
                
                context_parts.append(range_summary)
            else:
                context_parts.append(f"No food logs found for the period from {start_date.strftime('%B %d')} to {end_date.strftime('%B %d')}.")
        else:
            # Get logs for the specific date detected
            print(f"Fetching logs for date: {date_to_check}")
            logs = await get_user_food_logs_by_date(user_id, date_to_check.strftime("%Y-%m-%d"))
            date_str = date_to_check.strftime("%A, %B %d, %Y")
            
            if logs:
                # Calculate daily totals
                daily_calories = sum(log.get("calories", 0) for log in logs)
                daily_proteins = sum(log.get("proteins", 0) for log in logs)
                daily_carbs = sum(log.get("carbs", 0) for log in logs)
                daily_fats = sum(log.get("fats", 0) for log in logs)
                
                # Format logs by meal
                date_context = f"Food log for {date_str}:\n"
                date_context += f"Total: {daily_calories:.0f} calories, {daily_proteins:.1f}g protein, {daily_carbs:.1f}g carbs, {daily_fats:.1f}g fat\n"
                
                # Group logs by meal
                logs_by_meal = {}
                for log in logs:
                    meal = log.get("meal", "Other")
                    if meal not in logs_by_meal:
                        logs_by_meal[meal] = []
                    logs_by_meal[meal].append(log)
                
                # Add each meal to the context
                for meal, meal_logs in logs_by_meal.items():
                    meal_calories = sum(log.get("calories", 0) for log in meal_logs)
                    date_context += f"\n{meal}: {meal_calories:.0f} calories\n"
                    for log in meal_logs:
                        date_context += f"- {log.get('name', 'Unknown food')}: {log.get('calories', 0):.0f} cal"
                        if log.get("serving_size") and log.get("serving_unit"):
                            date_context += f" ({log.get('serving_size')} {log.get('serving_unit')})"
                        date_context += "\n"
                
                context_parts.append(date_context)
            else:
                context_parts.append(f"No food logs found for {date_str}.")
        
        # Get active goal (always add this for context)
        try:
            active_goal = get_user_active_goal(user_id)
            
            if active_goal:
                context_parts.append("\nYour Current Goals:")
                
                # Weight targets
                if "weight_target" in active_goal:
                    weight_target = active_goal["weight_target"]
                    context_parts.append(f"- Weight goal: {weight_target.get('current', 0):.1f}kg → {weight_target.get('goal', 0):.1f}kg")
                    context_parts.append(f"- Rate: {weight_target.get('weekly_rate', 0):.1f}kg per week")
                
                # Nutrition targets
                if "nutrition_targets" in active_goal and active_goal["nutrition_targets"]:
                    target = active_goal["nutrition_targets"][0]
                    target_calories = target.get('daily_calories', 0)
                    context_parts.append(f"- Daily calorie target: {target_calories:.0f} calories")
                    
                    # Calculate remaining calories if we're looking at today's logs
                    if date_to_check == today and 'total_calories' in locals():
                        remaining = max(0, target_calories - total_calories)
                        context_parts.append(f"- Remaining calories for today: {remaining:.0f}")
                    
                    context_parts.append(f"- Protein target: {target.get('proteins', 0):.1f}g")
                    context_parts.append(f"- Carbs target: {target.get('carbs', 0):.1f}g")
                    context_parts.append(f"- Fat target: {target.get('fats', 0):.1f}g")
            else:
                context_parts.append("\nYou don't have any active nutrition goals set.")
        except Exception as e:
            print(f"Error getting goals: {e}")
            context_parts.append("I can't access your nutrition goals right now.")
        
        # Return formatted context
        context = "\n".join(context_parts)
        print(f"Final context length: {len(context)}")
        return context
    except Exception as e:
        print(f"Error in get_user_context: {e}")
        return "I'm having trouble accessing your nutrition data right now."

def detect_meal_suggestion(query: str) -> Optional[dict]:
    """
    Detect if the user is asking for meal suggestions and extract relevant information.
    Returns a dict with meal_type and preferences if detected, None otherwise.
    """
    query = query.lower()
    
    # Check for meal suggestion intent
    suggestion_patterns = [
        r"suggest (a|some) (.*?)(breakfast|lunch|dinner|snack|meal)",
        r"what (should|can|could) (i|we) (eat|have) for (breakfast|lunch|dinner|snack)",
        r"idea[s]? for (breakfast|lunch|dinner|snack)",
        r"recommend (a|some) (.*?)(breakfast|lunch|dinner|snack|meal)",
        r"(breakfast|lunch|dinner|snack) (idea|suggestion|recommendation)[s]?",
        r"what (to|should i) (eat|have) (for|as) (breakfast|lunch|dinner|snack)",
        r"help me (plan|with) (my|a) (breakfast|lunch|dinner|snack)"
    ]
    
    meal_type = None
    for pattern in suggestion_patterns:
        match = re.search(pattern, query)
        if match:
            # Extract meal type from the match
            for group in match.groups():
                if group in ["breakfast", "lunch", "dinner", "snack", "meal"]:
                    meal_type = group
                    break
            break
    
    if not meal_type:
        return None
        
    # If meal type is "meal", try to infer from time of day
    if meal_type == "meal":
        hour = datetime.now().hour
        if 5 <= hour < 10:
            meal_type = "breakfast"
        elif 10 <= hour < 14:
            meal_type = "lunch"
        elif 17 <= hour < 21:
            meal_type = "dinner"
        else:
            meal_type = "snack"
    
    # Extract preferences
    preferences = []
    preference_keywords = {
        "healthy": ["healthy", "nutritious", "balanced", "wholesome"],
        "quick": ["quick", "fast", "easy", "simple", "rapid"],
        "high-protein": ["protein", "high-protein", "muscle", "gains"],
        "low-carb": ["low-carb", "low carb", "keto", "carb-free"],
        "vegetarian": ["vegetarian", "plant-based", "meatless"],
        "vegan": ["vegan", "plant-based", "dairy-free", "no animal"],
        "light": ["light", "low-calorie", "low calorie", "diet"],
        "filling": ["filling", "hearty", "satisfying", "substantial"],
        "sweet": ["sweet", "sugary", "dessert"],
        "savory": ["savory", "salty", "umami"]
    }
    
    for preference, keywords in preference_keywords.items():
        if any(keyword in query for keyword in keywords):
            preferences.append(preference)
    
    return {
        "meal_type": meal_type,
        "preferences": preferences
    }

async def get_meal_suggestion_context(meal_info: dict, user_id: str = None) -> str:
    """
    Generate context for meal suggestions based on the detected meal type and preferences.
    
    Args:
        meal_info: Information about the meal being requested
        user_id: The authenticated user's ID, defaults to constant USER_ID if not provided
    """
    try:
        if not user_id:
            user_id = USER_ID
            
        # Get active goal to determine nutritional targets
        active_goal = get_user_active_goal(user_id)
        
        # Get today's food logs to calculate remaining macros
        today = datetime.now().date()
        logs = await get_user_food_logs_by_date(user_id, today)
        
        # Calculate nutrition from logs
        total_calories = sum(log.get("calories", 0) for log in logs)
        total_proteins = sum(log.get("proteins", 0) for log in logs)
        total_carbs = sum(log.get("carbs", 0) for log in logs)
        total_fats = sum(log.get("fats", 0) for log in logs)
        
        # Default targets if no goal is set
        target_calories = 2000
        target_proteins = 100
        target_carbs = 200
        target_fats = 70
        
        # If goal exists, use its targets
        if active_goal and "nutrition_targets" in active_goal and active_goal["nutrition_targets"]:
            target = active_goal["nutrition_targets"][0]
            target_calories = target.get("daily_calories", 2000)
            target_proteins = target.get("proteins", 100)
            target_carbs = target.get("carbs", 200)
            target_fats = target.get("fats", 70)
        
        # Calculate remaining macros
        remaining_calories = max(0, target_calories - total_calories)
        remaining_proteins = max(0, target_proteins - total_proteins)
        remaining_carbs = max(0, target_carbs - total_carbs)
        remaining_fats = max(0, target_fats - total_fats)
        
        # Get user's recently logged foods (for preferences)
        recent_foods = set()
        for log in logs:
            food_name = log.get("name", "").lower()
            if food_name:
                recent_foods.add(food_name)
        
        # Get some foods from the user's food index
        foods = search_food_items("", user_id=user_id)[:20]  # Limit to 20 items
        has_food_data = len(foods) > 0
        
        # Build context message
        context = f"MEAL SUGGESTION CONTEXT (for {meal_info['meal_type']}):\n"
        context += f"Time of request: {datetime.now().strftime('%H:%M')}\n\n"
        
        context += "Remaining daily nutrition:\n"
        context += f"- Calories: {remaining_calories:.0f} cal\n"
        context += f"- Protein: {remaining_proteins:.1f}g\n"
        context += f"- Carbs: {remaining_carbs:.1f}g\n"
        context += f"- Fat: {remaining_fats:.1f}g\n\n"
        
        if meal_info["preferences"]:
            context += "User preferences: " + ", ".join(meal_info["preferences"]) + "\n\n"
        
        if recent_foods:
            context += "Recently consumed foods: " + ", ".join(list(recent_foods)[:5]) + "\n\n"
        
        # Don't include the available food items in the user-visible context
        # but tell the model whether they have food data available
        if has_food_data:
            context += f"Food database status: User has {len(foods)} food items in their database.\n"
        else:
            context += "Food database status: User's food database is empty.\n"
        
        return context
    
    except Exception as e:
        print(f"Error preparing meal suggestion context: {e}")
        return "I don't have enough information about your nutrition to make personalized meal suggestions."

def get_system_prompt(use_food_db=True):
    """
    Generate the system prompt for the chatbot.
    """
    system_prompt = """
You are NutriBot, a nutritional assistant chatbot for the Nutrivize app. Your role is to provide helpful, accurate information about nutrition, food tracking, and health-related topics.

- Offer concise, scientifically-backed advice about nutrition, diet planning, and health optimization
- Answer questions about specific foods, vitamins, minerals, macronutrients, and diet styles
- Be supportive and non-judgmental, focusing on health rather than appearance
- Keep responses brief but informative, using bullet points for readability when appropriate
- Use a friendly, encouraging tone

If a question is outside your expertise, clearly state this and avoid making up information.

IMPORTANT FORMATTING GUIDELINES:
Your responses will be rendered with Markdown. Use Markdown formatting to create well-structured, easy-to-read messages:

1. Use headings and subheadings to organize information:
   # Main Heading
   ## Subheading
   ### Smaller subheading

2. Use bold and italics for emphasis:
   **important information**
   *emphasized text*

3. Use bullet points and numbered lists:
   - Point one
   - Point two
   1. First step
   2. Second step

4. For meal suggestions and recipes:
   - Use headings for the meal name
   - Use bold for section names like "Ingredients" and "Instructions"
   - Use bullet points for ingredients
   - Use numbered lists for steps
   - ALWAYS include serving size information (e.g., "Makes 2 servings (300g each)")

5. Create tables for nutritional information:
   | Food | Calories | Protein | Carbs | Fat |
   |------|----------|---------|-------|-----|
   | Egg  | 70       | 6g      | 0g    | 5g  |

6. Use blockquotes for notes or tips:
   > Note: This is important information

7. Use horizontal rules to separate sections where appropriate:
   ---

Always organize your responses in a clear, visually appealing way. Good formatting makes information easier to understand and act upon.
"""

    if use_food_db:
        food_db_operations = """
ADVANCED OPERATIONS:
You can perform several special operations for the user by including specific commands in your response:

1. To search for a food in the database:
   FOOD_LIST: apple
   
   This will search for foods containing "apple" in the name.

2. To add a new food to the database:
   FOOD_INDEX: {'name': 'Greek Yogurt', 'serving_size': 100, 'serving_unit': 'g', 'calories': 59, 'proteins': 10, 'carbs': 3.6, 'fats': 0.4}
   
   Parameters explained:
   - name: Food name (required)
   - serving_size: Standard serving size (required)
   - serving_unit: Unit for serving (g, ml, oz, etc.) (required)
   - calories: Calories per serving (required)
   - proteins: Protein in grams (required)
   - carbs: Carbohydrates in grams (required)
   - fats: Fat in grams (required)
   - fiber: Fiber in grams (optional)

3. To modify an existing food in the database:
   FOOD_MODIFY: {'name': 'Greek Yogurt', 'serving_size': 150, 'calories': 88.5}
   
   Parameters explained:
   - name: The name of the food to modify (required)
   - Other parameters: Any fields you want to update

4. To delete a food from the database:
   FOOD_DELETE: {'name': 'Greek Yogurt'}
   
   Parameters explained:
   - name: The name of the food to delete (required)

5. To list all foods from the database:
   FOOD_LIST:
   
   This will show up to 10 foods from the database.

6. To log a food:
   FOOD_LOG: {'name': 'Greek Yogurt', 'amount': 150, 'meal_type': 'Breakfast'}
   
   Parameters explained:
   - name: The name of the food to log (required)
   - amount: Amount consumed in food's serving unit (required)
   - meal_type: Breakfast, Lunch, Dinner, or Snack (required)
   - date: The date to log the food for (optional, defaults to today)
  
7. To modify a food log entry:
   FOOD_LOG_MODIFY: {'log_entry_id': '12345abc', 'amount': 200, 'meal_type': 'Dinner'}
   
   Parameters explained:
   - log_entry_id: The ID of the log entry to modify (required)
   - Other parameters: Any fields you want to update (amount, meal_type, etc.)

8. To delete a food log entry:
   FOOD_LOG_DELETE: {'log_entry_id': '12345abc'}
   
   Parameters explained:
   - log_entry_id: The ID of the log entry to delete (required)

9. To add a new goal:
   GOAL_ADD: {'type': 'weight loss', 'weight_target': {'current': 75, 'goal': 70, 'weekly_rate': 0.5}, 'nutrition_targets': [{'name': 'Default', 'daily_calories': 2000, 'proteins': 150, 'carbs': 200, 'fats': 65, 'fiber': 25}]}
   
   Parameters explained:
   - type: The goal type, e.g., 'weight loss', 'muscle gain', 'maintenance' (required)
   - weight_target: Weight target information (optional)
   - nutrition_targets: Array of nutrition targets (optional)

10. To modify a goal:
    GOAL_MODIFY: {'goal_id': '12345abc', 'weight_target': {'current': 74, 'goal': 68}}
    
    Parameters explained:
    - goal_id: The ID of the goal to modify (required)
    - Other parameters: Any fields you want to update

11. To delete a goal:
    GOAL_DELETE: {'goal_id': '12345abc'}
    
    Parameters explained:
    - goal_id: The ID of the goal to delete (required)

12. To list all goals:
    GOAL_LIST:
    
    This will show your active goal and any other saved goals.

13. To generate a meal plan:
    MEAL_PLAN_GENERATE: {'days': 7, 'start_date': '2023-06-01', 'preferences': ['high-protein', 'vegetarian']}
    
    Parameters explained:
    - days: Number of days for the plan (optional, defaults to 7)
    - start_date: Starting date for the plan (optional, defaults to today)
    - preferences: Dietary preferences (optional)
    - target_calories: Daily calorie target (optional)
    - name: Name for the meal plan (optional)

14. To view your active meal plan:
    MEAL_PLAN_VIEW:
    
    This will show details of your currently active meal plan.

15. To log a meal from your meal plan:
    MEAL_PLAN_LOG: {'meal_plan_id': '12345abc', 'day_index': 0, 'meal_type': 'breakfast'}
    
    Parameters explained:
    - meal_plan_id: ID of the meal plan (required)
    - day_index: Index of the day in the plan (required, 0-based)
    - meal_type: Type of meal to log (required, one of: breakfast, lunch, dinner, snack)
"""
        system_prompt += food_db_operations
    
    # Add instructions for meal suggestions
    system_prompt += """

MEAL SUGGESTIONS:
You can suggest meals based on the user's preferences and nutritional needs. When suggesting meals, use:

MEAL_SUGGESTION: {'meal_type': 'breakfast', 'time_of_day': 'morning', 'preference': 'high-protein and quick', 'remaining_macros': {'calories': 500, 'protein': 30, 'carbs': 40, 'fat': 15}}

The system will replace this with appropriate meal suggestions based on the user's food database and nutritional requirements.
"""
    
    return system_prompt

async def get_meal_plan_info(query_parts, user_id=None):
    """Get information about the user's meal plans"""
    if not user_id:
        user_id = USER_ID
        
    try:
        # Get active meal plan
        active_plan = get_active_plan(user_id)
        
        # Format the meal plan information
        if not active_plan:
            plan_text = "You don't have an active meal plan right now."
        else:
            # Convert to dict if it's a MealPlan object
            if hasattr(active_plan, 'dict'):
                active_plan = active_plan.dict()
                
            plan_text = f"**{active_plan.get('name', 'Weekly Meal Plan')}**\n\n"
            
            # Add date range
            start_date = active_plan.get('start_date', '')
            end_date = active_plan.get('end_date', '')
            plan_text += f"**Date Range:** {start_date} to {end_date}\n\n"
            
            # Add nutritional summary
            if 'plan_totals' in active_plan:
                totals = active_plan['plan_totals']
                plan_text += "**Nutrition Summary:**\n"
                plan_text += f"- Daily average: {totals.get('calories', 0) / 7:.0f} calories\n"
                plan_text += f"- Daily protein: {totals.get('protein', 0) / 7:.0f}g\n"
                plan_text += f"- Daily carbs: {totals.get('carbs', 0) / 7:.0f}g\n"
                plan_text += f"- Daily fat: {totals.get('fat', 0) / 7:.0f}g\n\n"
            
            # Add days information
            plan_text += "**Meal Schedule:**\n\n"
            
            # Show maximum of 3 days to avoid excessive text
            days_to_show = min(3, len(active_plan.get('days', [])))
            for i in range(days_to_show):
                day = active_plan['days'][i]
                day_date = day.get('date', f"Day {i+1}")
                plan_text += f"**{day_date}**\n"
                
                for meal_type, meal in day.get('meals', {}).items():
                    if not meal:
                        continue
                        
                    # Convert from dict if needed
                    if isinstance(meal, dict):
                        meal_name = meal.get('name', '')
                        meal_calories = meal.get('macros', {}).get('calories', 0)
                    else:
                        meal_name = meal.name if hasattr(meal, 'name') else ''
                        meal_calories = meal.macros.calories if hasattr(meal, 'macros') else 0
                        
                    plan_text += f"- {meal_type.capitalize()}: {meal_name} ({meal_calories} cal)\n"
                
                plan_text += "\n"
            
            if days_to_show < len(active_plan.get('days', [])):
                plan_text += f"...(showing {days_to_show} out of {len(active_plan.get('days', []))} days)\n\n"
            
            return plan_text
                
    except Exception as e:
        print(f"Error retrieving meal plan info: {e}")
        return "I couldn't retrieve your meal plan information due to an error."

async def handle_meal_plan_queries(query_lower, user_id=None):
    """
    Handle meal plan queries
    
    Args:
        query_lower: The user's query in lowercase
        user_id: The authenticated user's ID, defaults to constant USER_ID if not provided
    """
    if not user_id:
        user_id = USER_ID
        
    # Handle meal plan queries
    if "meal plan" in query_lower and any(word in query_lower for word in ["view", "show", "what", "my", "see", "active"]):
        try:
            plan_info = await get_meal_plan_info(query_lower, user_id)
            return {
                "answer": plan_info,
                "sources": ["Meal Plan Database"],
                "confidence": "high",
                "query_type": "meal_plan"
            }
        except Exception as e:
            print(f"Error processing meal plan query: {e}")
            return {
                "answer": "I had trouble retrieving your meal plan information. Please try again or check if you have an active meal plan.",
                "sources": [],
                "confidence": "low",
                "query_type": "meal_plan"
            }
    
    # Also handle "all meal plans" queries
    elif "meal plans" in query_lower and any(word in query_lower for word in ["all", "list", "show"]):
        try:
            all_plans = get_user_meal_plans(user_id)
            return {
                "answer": f"**Your Meal Plans ({len(all_plans)}):**\n\n" + "\n".join([f"{i+1}. {plan.get('name', f'Meal Plan {i+1}')}" for i, plan in enumerate(all_plans)]),
                "sources": ["Meal Plan Database"],
                "confidence": "high",
                "query_type": "meal_plan"
            }
        except Exception as e:
            print(f"Error processing meal plan query: {e}")
            return {
                "answer": "I had trouble retrieving your meal plan information. Please try again or check if you have any meal plans.",
                "sources": [],
                "confidence": "low",
                "query_type": "meal_plan"
            }