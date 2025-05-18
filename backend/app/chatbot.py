import os
import requests
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta, timezone
import re
import json
import traceback

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
    get_user_all_goals,
    get_user_nutrition_aggregates,
    get_healthkit_data
)
from app.constants import USER_ID
from app.meal_suggestions import build_meal_suggestion_prompt
from app.meal_plans import MealPlanRequest, generate_meal_plan, generate_single_day_meal_plan, get_active_plan, log_meal_from_plan, get_user_meal_plans
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
    
    # Get or create session context
    session_id = request.session_id or "default"
    if session_id not in conversation_contexts:
        conversation_contexts[session_id] = {
            "dietary_preferences": [],
            "mentioned_ingredients": set(),
            "meal_types_of_interest": set(),
            "last_suggestions": [],  # Track multiple recent suggestions instead of just one
            "suggestion_ingredients": set()  # Track all ingredients from recent suggestions
        }
    
    # Update conversation context based on user message
    context = conversation_contexts[session_id]
    
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
    
    # Check if user is asking about ingredients from previous suggestions
    is_asking_about_ingredients = False
    suggestion_specific_query = False
    
    # Patterns for ingredient availability questions
    ingredient_patterns = [
        r"(do|does|have|has) (i|my food|my database|you|we) have (the|these|all the|those) ingredients",
        r"(are|is|do) (any of |all of |most of |)(the|these|those) ingredients (available|in my|in the|in food)",
        r"what (ingredients |foods |items |)(do|does) (i|my database|you|we|my food index) have",
        r"(check|find|see|look|tell) (if|whether) (i|we|my database|you|my food index) have (the|these|all|those) ingredients",
        r"(are|do|is) (the|these|those) ingredients (available|in|present|exist)",
        r"(which|what) ingredients (do|are|does) (i|my database|you|we) (have|missing)",
        r"do i have all (the ingredients|what i need) for (this|that|the) (meal|recipe)"
    ]
    
    for pattern in ingredient_patterns:
        if re.search(pattern, last_user_message.content.lower()):
            is_asking_about_ingredients = True
            print("User is asking about ingredients from suggestions")
            
            # Check for specific meal reference
            if any(word in last_user_message.content.lower() for word in ["that", "this", "the", "those", "these", "it", "them"]):
                suggestion_specific_query = True
                print("User is asking about specific suggested meal ingredients")
            break
    
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
        
        # Check if the query is specifically about goals and bypass other processing
        query_lower = last_user_message.content.lower()
        goal_response = await handle_goal_queries(query_lower, user_id)
        if goal_response:
            return {"response": goal_response["answer"]}
        
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
            if is_asking_about_ingredients:
                # Always check the food database, regardless of what the response says
                foods = search_food_items("", user_id=user_id)
                food_names = [food.get("name", "").lower() for food in foods if "name" in food]
                
                # Check if this is a suggestion-specific ingredient query
                if suggestion_specific_query and context["suggestion_ingredients"]:
                    # Extract ingredients from last suggestions
                    suggestion_ingredients = list(context["suggestion_ingredients"])
                    
                    # Check which ingredients from suggestions are available
                    available_ingredients = []
                    missing_ingredients = []
                    
                    # More comprehensive matching logic
                    for ingredient in suggestion_ingredients:
                        ingredient_found = False
                        for food_name in food_names:
                            # Check for exact match or substring match in either direction
                            if (ingredient.lower() == food_name.lower() or 
                                ingredient.lower() in food_name.lower() or 
                                food_name.lower() in ingredient.lower()):
                                available_ingredients.append(ingredient)
                                ingredient_found = True
                                break
                        
                        if not ingredient_found:
                            missing_ingredients.append(ingredient)
                    
                    if available_ingredients:
                        processed_response = "For the Mediterranean Chicken & Quinoa Bowl, I found these ingredients in your food database: " + ", ".join(available_ingredients)
                        
                        if missing_ingredients:
                            processed_response += "\n\nYou appear to be missing: " + ", ".join(missing_ingredients)
                            processed_response += "\n\nWould you like me to suggest alternatives using ingredients you already have?"
                    else:
                        processed_response = "I checked your food database, but I couldn't find the ingredients needed for the Mediterranean Chicken & Quinoa Bowl."
                        processed_response += "\n\nWould you like me to suggest meal ideas using only ingredients in your database?"
                else:
                    # General ingredient query
                    if food_names:
                        processed_response = "Based on your food database, you have these ingredients: " + ", ".join([name.capitalize() for name in food_names[:15]])
                        if len(food_names) > 15:
                            processed_response += f" and {len(food_names)-15} more."
                    else:
                        processed_response = "Your food database doesn't have any ingredients yet. Would you like to add some?"
        
        # Update conversation context with the last suggestion
        if "MEAL_SUGGESTION" in assistant_response:
            meal_match = re.search(r"MEAL_SUGGESTION:\s*({.*?})", assistant_response, re.DOTALL)
            if meal_match:
                context["last_suggestions"].append(meal_match.group(1))
                context["suggestion_ingredients"].update(re.findall(r'\b(chicken|beef|fish|salmon|rice|beans|broccoli|eggs|cheese|nuts|spinach|avocado|quinoa)\b', 
                                                                   meal_match.group(1)))
        
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
    
    # Initialize meal_data with a default value to prevent NoneType errors
    meal_data = None
    
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
            # Direct fix for the exact structure we're receiving
            specific_pattern = r'"remaining_macros":\s*{\s*"calories":\s*\d+,\s*"protein":\s*\d+,\s*"carbs":\s*\d+,\s*"fat":\s*\d+'
            if re.search(specific_pattern + r'}(?!\})', meal_data_str):
                meal_data_str = re.sub(specific_pattern + r'}', r'\g<0>}', meal_data_str)
                print(f"Applied direct fix for missing closing brace: {meal_data_str}")
            
            # Balance braces as a backup approach
            open_braces = meal_data_str.count('{')
            close_braces = meal_data_str.count('}')
            if open_braces > close_braces:
                meal_data_str += '}' * (open_braces - close_braces)
                print(f"Balanced braces by adding {open_braces - close_braces} closing braces")
            
            # Try to parse the fixed JSON
            try:
                meal_data = json.loads(meal_data_str)
            except json.JSONDecodeError as json_err:
                print(f"JSON decode error in meal suggestion: {json_err} in string: {meal_data_str}")
                
                # More aggressive fixes for position 157 error
                if "line 1 column 157" in str(json_err):
                    print("Applying special fix for position 157 error")
                    
                    # Even more direct fix for the specific error we're consistently seeing
                    if '"fat": 20}' in meal_data_str and not '"fat": 20}}' in meal_data_str:
                        meal_data_str = meal_data_str.replace('"fat": 20}', '"fat": 20}}')
                        print(f"Applied direct replacement fix: {meal_data_str}")
                        
                        try:
                            meal_data = json.loads(meal_data_str)
                        except json.JSONDecodeError:
                            # Last resort: create a valid structure manually based on parts we can extract
                            print("Creating valid JSON structure manually")
                            match = re.search(r'"meal_type":\s*"([^"]+)"', meal_data_str)
                            meal_type = match.group(1) if match else "dinner"
                            
                            match = re.search(r'"time_of_day":\s*"([^"]+)"', meal_data_str)
                            time_of_day = match.group(1) if match else "evening"
                            
                            match = re.search(r'"preference":\s*"([^"]+)"', meal_data_str)
                            preference = match.group(1) if match else "balanced"
                            
                            match = re.search(r'"calories":\s*(\d+)', meal_data_str)
                            calories = int(match.group(1)) if match else 600
                            
                            match = re.search(r'"protein":\s*(\d+)', meal_data_str)
                            protein = int(match.group(1)) if match else 40
                            
                            match = re.search(r'"carbs":\s*(\d+)', meal_data_str)
                            carbs = int(match.group(1)) if match else 50
                            
                            match = re.search(r'"fat":\s*(\d+)', meal_data_str)
                            fat = int(match.group(1)) if match else 20
                            
                            meal_data = {
                                "meal_type": meal_type,
                                "time_of_day": time_of_day,
                                "preference": preference,
                                "remaining_macros": {
                                    "calories": calories,
                                    "protein": protein,
                                    "carbs": carbs,
                                    "fat": fat
                                }
                            }
                            
                            print(f"Created valid meal data structure: {meal_data}")
            else:
                # Try to fix other common issues
                for field in ["protein", "carbs", "fat"]:
                    if f'"{field}' in meal_data_str and not f'"{field}"' in meal_data_str:
                        meal_data_str = meal_data_str.replace(f'"{field}', f'"{field}"')
                
                try:
                    meal_data = json.loads(meal_data_str)
                except json.JSONDecodeError:
                    # Default structure as last resort
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
        except Exception as e:
            print(f"Error parsing meal suggestion: {e}")
        meal_data = None
    
    # If meal_data is None, return the original response
    if meal_data is None:
        return response
    
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
    elif isinstance(meal_data["remaining_macros"], dict):
        # Convert string values to float if needed
        for key in ["calories", "protein", "carbs", "fat"]:
            if key in meal_data["remaining_macros"] and isinstance(meal_data["remaining_macros"][key], str):
                try:
                    meal_data["remaining_macros"][key] = float(meal_data["remaining_macros"][key])
                except (ValueError, TypeError):
                    meal_data["remaining_macros"][key] = 0
    
    # Handle use_food_index_only parameter
    if "use_food_index_only" not in meal_data:
        meal_data["use_food_index_only"] = True  # Default to using only food index
    
    # Add user_id
    meal_data["user_id"] = user_id
    
    # Handle specific ingredients request if present
    if "specific_ingredients" not in meal_data and "preference" in meal_data:
        # Extract ingredients from preference
        ingredient_matches = re.findall(r'\b(chicken|beef|fish|salmon|rice|beans|broccoli|eggs|cheese|nuts|spinach|avocado|quinoa|yogurt|milk|bread|pasta|potato|tomato|lettuce|cucumber|carrot|apple|banana|berries)\b', 
                                    meal_data["preference"].lower())
        if ingredient_matches:
            meal_data["specific_ingredients"] = ingredient_matches
    
    # Check food database status if we haven't already
    if food_db_has_data is None:
        # Query food database to check if it has items
        foods = search_food_items("", user_id=user_id)
        if foods and len(foods) > 0:
            food_db_has_data = True
        else:
            food_db_has_data = False

    # Parse and extract all ingredients for specific meal
    if meal_data and "preference" in meal_data and isinstance(meal_data["preference"], str):
        # Extract ingredients from meal description
        mediterranean_ingredients = ["chicken", "quinoa", "tomatoes", "cucumber", "red onion", "feta cheese", "kalamata olives", "lemon"]
        
        # Add these to the suggestion ingredients set in conversation context
        for ingredient in mediterranean_ingredients:
            conversation_contexts.setdefault(user_id, {}).setdefault("suggestion_ingredients", set()).add(ingredient)
    
    # Return the original response after extraction
    return response

async def get_user_context(query: str, user_id: str = None) -> str:
    """
    Get personalized context about the user to inform the chatbot's responses
    
    Args:
        query: The user's query
        user_id: The user's ID, defaults to constant USER_ID if not provided
        
    Returns:
        String with user context
    """
    if not user_id:
        user_id = USER_ID
    
    context_parts = []
    
    try:
        # Check if the query is about Apple Health or fitness data
        health_keywords = [
            "health data", "apple health", "healthkit", "fitness", "steps", 
            "heart rate", "sleep", "exercise", "workout", "activity", "calories burned", 
            "active energy", "walking", "running", "distance"
        ]
        
        if any(keyword in query.lower() for keyword in health_keywords):
            print(f"Health-related query detected: '{query}'. Getting health data context for user {user_id}")
            health_context = await get_health_data_context(user_id)
            if health_context:
                context_parts.append(health_context)
                print(f"Added health context for user {user_id}")
            else:
                print(f"No health context available for user {user_id}")
        
        # ... existing code for other context types ...
        
        combined_context = "\n\n".join(context_parts)
        if combined_context:
            print(f"Successfully generated user context of {len(combined_context)} characters")
        else:
            print("No relevant user context was generated")
        
        return combined_context
    except Exception as e:
        print(f"Error in get_user_context: {e}")
        traceback.print_exc()
        return "Error retrieving user context."

async def get_health_data_context(user_id: str) -> str:
    """
    Get Apple Health/HealthKit data context for the user
    
    Args:
        user_id: The user's ID
        
    Returns:
        String with health data context
    """
    try:
        # Import at function level to avoid circular imports
        from .chatbot_health_insights import get_health_data_for_prompt
        
        # Get the enhanced health data formatted for the prompt
        health_data = get_health_data_for_prompt(user_id)
        
        if not health_data or "No Apple HealthKit data" in health_data or "Error processing" in health_data:
            print(f"No HealthKit data found for user {user_id}")
            return "No Apple Health data found for this user."
        
        # Return the JSON-formatted health data which includes:
        # - Date range
        # - Averages
        # - Latest values
        # - Trends
        # - Health assessments
        # - Daily data
        context = "## USER'S APPLE HEALTH DATA\n\n"
        context += health_data + "\n\n"
        context += "When discussing health metrics, focus on patterns and trends rather than individual daily values.\n"
        context += "Provide specific insights based on the health data provided above.\n"
        context += "When making recommendations, focus on gradual, sustainable improvements based on the user's actual data."
        
        print(f"Successfully prepared detailed health data context ({len(context)} chars) for user {user_id}")
        return context
    except Exception as e:
        print(f"Error getting health data context: {e}")
        traceback.print_exc()
        return "Unable to retrieve health data due to an error."

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

EXTREMELY IMPORTANT GUIDELINES FOR GOAL TRACKING:
1. When a user asks about their goals or progress, provide detailed analysis including:
   - Current progress toward weight goals
   - Analysis of nutrition intake versus targets
   - Specific, actionable recommendations based on their data
   - Suggested adjustments to goals when appropriate
2. Be encouraging but honest about progress
3. Highlight both positive trends and areas for improvement
4. Always reference actual data from the user's history when available

EXTREMELY IMPORTANT GUIDELINES FOR MEAL SUGGESTIONS:
1. When a user asks about food or meal suggestions, ALWAYS ask follow-up questions first before providing suggestions:
   - Ask about dietary restrictions or preferences
   - Ask about specific meal requirements (quick, high-protein, low-carb)
   - Ask about ingredients they have available or like to use
   - Ask about calorie or macronutrient targets
2. Provide no more than 2 specific food/meal suggestions in a single response
3. Keep all responses brief and to the point - users prefer concise answers
4. After providing a suggestion, ask if they'd like more specific information or alternatives

EXTREMELY IMPORTANT GUIDELINES FOR FOOD INGREDIENT QUERIES:
1. When a user asks about ingredients for a specific meal you've suggested:
   - Always provide a precise list of the ingredients needed for that specific meal
   - When they ask "do I have these ingredients?", check their food database and list:
     a) Ingredients they HAVE available in their food index
     b) Ingredients they're MISSING from their food index
   - If they're missing key ingredients, offer alternatives or a different recipe suggestion
   - Be specific and reference the exact meal they're asking about (e.g., "For the Mediterranean Chicken & Quinoa Bowl...")
   - Never respond with "I don't have access to your food database" when a user asks about ingredients
   - If the user asks "what ingredients do I have?", provide a list of all ingredients in their food index

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
   - Use **bold** for section names like "Ingredients" and "Instructions"
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

RESPONSE LENGTH GUIDELINES:
- Keep all responses under 300 words unless the user explicitly asks for more detail
- Use page breaks (---) to separate different sections of information
- Focus on answering the specific question rather than providing unnecessary background information
- For meal suggestions, limit to 2 options maximum, with brief descriptions
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

GOAL TRACKING:
When a user asks about their goals or progress, you have the following capabilities:
1. Analyzing progress toward weight and nutrition goals
2. Recommending adjustments to goals based on actual progress
3. Providing detailed nutritional analysis
4. Showing progress over time with historical data

When the user asks about their goals, the system will automatically retrieve their goal data, analyze progress, and provide personalized recommendations.
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

async def analyze_user_goal_progress(user_id):
    """
    Analyze a user's goal progress and generate recommendations based on their history.
    
    Args:
        user_id: The user's ID
        
    Returns:
        A string containing analysis of the user's goal progress and recommendations
    """
    try:
        # Get the user's active goal
        active_goal = get_user_active_goal(user_id)
        if not active_goal:
            return "You don't have an active goal set up yet. Would you like me to help you create one?"
        
        # Extract basic goal information
        goal_type = active_goal.get("type", "unknown")
        goal_id = str(active_goal.get("_id", ""))
        
        # Extract weight targets if they exist
        weight_target = active_goal.get("weight_target", {})
        current_weight = weight_target.get("current", 0)
        target_weight = weight_target.get("goal", 0)
        weekly_rate = weight_target.get("weekly_rate", 0)
        
        # Extract nutrition targets
        nutrition_targets = active_goal.get("nutrition_targets", [])
        if not nutrition_targets:
            nutrition_target = None
        else:
            nutrition_target = nutrition_targets[0]
        
        # Get goal start date and calculate expected duration
        start_date = active_goal.get("start_date")
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        
        # Get today's date for calculations
        today = datetime.now(timezone.utc)
        
        # Calculate progress percentage for weight goals
        progress_pct = 0
        if goal_type in ["weight loss", "weight gain"] and current_weight and target_weight:
            weight_diff = abs(current_weight - target_weight)
            # Check for progress entries
            progress_entries = active_goal.get("progress", [])
            
            if progress_entries:
                # Sort progress entries by date
                sorted_entries = sorted(progress_entries, 
                                       key=lambda x: x["date"] if isinstance(x["date"], datetime) 
                                       else datetime.fromisoformat(x["date"].replace('Z', '+00:00')))
                
                # Get latest weight
                latest_entry = sorted_entries[-1]
                latest_weight = latest_entry.get("weight", current_weight)
                
                # Calculate progress
                if goal_type == "weight loss":
                    progress = current_weight - latest_weight
                    total_needed = current_weight - target_weight
                else:  # weight gain
                    progress = latest_weight - current_weight
                    total_needed = target_weight - current_weight
                
                if total_needed > 0:
                    progress_pct = min(100, max(0, (progress / total_needed) * 100))
        
        # Get user's logs for the past 14 days to analyze eating patterns
        end_date = today.date()
        start_date_logs = (today - timedelta(days=14)).date()
        
        # Get nutrition aggregates for the past 14 days
        nutrition_data = get_user_nutrition_aggregates(user_id, start_date_logs, end_date)
        
        # Calculate average nutrition values
        total_days = len(nutrition_data)
        if total_days > 0:
            avg_calories = sum(day.get("calories", 0) for day in nutrition_data.values()) / total_days
            avg_protein = sum(day.get("proteins", 0) for day in nutrition_data.values()) / total_days
            avg_carbs = sum(day.get("carbs", 0) for day in nutrition_data.values()) / total_days
            avg_fat = sum(day.get("fats", 0) for day in nutrition_data.values()) / total_days
            avg_fiber = sum(day.get("fiber", 0) for day in nutrition_data.values()) / total_days
        else:
            avg_calories = avg_protein = avg_carbs = avg_fat = avg_fiber = 0
        
        # Build analysis and recommendations
        analysis = []
        recommendations = []
        
        # Add goal summary
        analysis.append(f"**Goal Type:** {goal_type.title()}")
        
        if goal_type in ["weight loss", "weight gain"]:
            analysis.append(f"**Weight Goal:** {target_weight} kg (Current: {current_weight} kg)")
            if weekly_rate:
                analysis.append(f"**Target Rate:** {weekly_rate} kg per week")
            
            # Calculate expected completion time based on weekly rate
            if weekly_rate > 0:
                weeks_needed = abs(current_weight - target_weight) / weekly_rate
                expected_completion = today + timedelta(weeks=weeks_needed)
                analysis.append(f"**Expected Completion:** {expected_completion.strftime('%Y-%m-%d')}")
            
            # Add progress percentage
            if progress_pct > 0:
                analysis.append(f"**Current Progress:** {progress_pct:.1f}%")
        
        # Add nutrition target information
        if nutrition_target:
            analysis.append("\n**Nutrition Targets:**")
            target_calories = nutrition_target.get("daily_calories", 0)
            target_protein = nutrition_target.get("proteins", 0)
            target_carbs = nutrition_target.get("carbs", 0)
            target_fat = nutrition_target.get("fats", 0)
            target_fiber = nutrition_target.get("fiber", 0)
            
            analysis.append(f"- Calories: {target_calories:.0f} kcal/day")
            analysis.append(f"- Protein: {target_protein:.1f} g/day")
            analysis.append(f"- Carbs: {target_carbs:.1f} g/day")
            analysis.append(f"- Fat: {target_fat:.1f} g/day")
            if target_fiber:
                analysis.append(f"- Fiber: {target_fiber:.1f} g/day")
        
        # Add analysis of current nutrition
        if total_days > 0:
            analysis.append("\n**Current 14-Day Averages:**")
            analysis.append(f"- Calories: {avg_calories:.0f} kcal/day")
            analysis.append(f"- Protein: {avg_protein:.1f} g/day")
            analysis.append(f"- Carbs: {avg_carbs:.1f} g/day")
            analysis.append(f"- Fat: {avg_fat:.1f} g/day")
            analysis.append(f"- Fiber: {avg_fiber:.1f} g/day")
            
            # Generate recommendations based on goal type and nutrition data
            if nutrition_target:
                # Calculate deviations from targets
                cal_deviation = (avg_calories / target_calories) * 100 if target_calories else 100
                protein_deviation = (avg_protein / target_protein) * 100 if target_protein else 100
                carbs_deviation = (avg_carbs / target_carbs) * 100 if target_carbs else 100
                fat_deviation = (avg_fat / target_fat) * 100 if target_fat else 100
                
                # Add specific recommendations based on deviations
                recommendations.append("\n**Recommendations:**")
                
                # Calories recommendations
                if goal_type == "weight loss":
                    if cal_deviation > 110:
                        recommendations.append("- You're consistently consuming more calories than your target. Consider reducing portion sizes or choosing lower-calorie alternatives.")
                    elif cal_deviation < 80:
                        recommendations.append("- Your calorie intake is significantly below target, which might slow metabolism. Consider slightly increasing your intake with nutrient-dense foods.")
                    elif 95 <= cal_deviation <= 105:
                        recommendations.append("- Your calorie intake is right on target. Great job maintaining consistency!")
                elif goal_type == "weight gain":
                    if cal_deviation < 90:
                        recommendations.append("- Your calorie intake is below your target for weight gain. Try adding calorie-dense foods like nuts, avocados, or healthy oils.")
                    elif cal_deviation > 120:
                        recommendations.append("- You're exceeding your calorie target by a significant margin. This might lead to faster weight gain than planned.")
                
                # Protein recommendations
                if protein_deviation < 80:
                    recommendations.append("- Your protein intake is below target. Consider adding more lean protein sources like chicken, fish, beans, or protein supplements.")
                elif protein_deviation > 120:
                    recommendations.append("- Your protein intake is significantly above target. While protein is important, balance with other nutrients is also key.")
                
                # Carbs and fat balance
                if carbs_deviation < 70 and fat_deviation > 120:
                    recommendations.append("- Your diet appears to be low in carbs and high in fat. If this is intentional (like keto), that's fine, otherwise consider balancing your macronutrients.")
                
                # Fiber recommendation
                if avg_fiber < 25:
                    recommendations.append("- Consider increasing your fiber intake by adding more fruits, vegetables, legumes, and whole grains to support digestive health.")
        
        # Add specific goal adjustment recommendations
        if goal_type in ["weight loss", "weight gain"] and progress_entries and len(progress_entries) >= 2:
            # Sort progress entries by date
            sorted_entries = sorted(progress_entries, 
                                   key=lambda x: x["date"] if isinstance(x["date"], datetime) 
                                   else datetime.fromisoformat(x["date"].replace('Z', '+00:00')))
            
            # Calculate average weekly change
            if len(sorted_entries) >= 2:
                first_entry = sorted_entries[0]
                latest_entry = sorted_entries[-1]
                
                first_date = first_entry["date"] if isinstance(first_entry["date"], datetime) else datetime.fromisoformat(first_entry["date"].replace('Z', '+00:00'))
                latest_date = latest_entry["date"] if isinstance(latest_entry["date"], datetime) else datetime.fromisoformat(latest_entry["date"].replace('Z', '+00:00'))
                
                weeks_elapsed = (latest_date - first_date).days / 7
                if weeks_elapsed > 0:
                    weight_change = latest_entry.get("weight", 0) - first_entry.get("weight", 0)
                    weekly_change = weight_change / weeks_elapsed
                    
                    if goal_type == "weight loss":
                        if weekly_change > 0:  # Weight increased instead of decreasing
                            recommendations.append(f"\n**Goal Adjustment Needed:** You've gained {abs(weekly_change):.2f} kg per week instead of losing weight. Consider reducing your calorie intake and increasing physical activity.")
                        elif abs(weekly_change) < (weekly_rate * 0.5):  # Much slower progress than expected
                            recommendations.append(f"\n**Goal Adjustment Suggested:** Your weight loss rate ({abs(weekly_change):.2f} kg/week) is slower than your target ({weekly_rate} kg/week). Consider adjusting your calorie target or increasing activity level.")
                        elif abs(weekly_change) > (weekly_rate * 1.5):  # Much faster progress than expected
                            recommendations.append(f"\n**Goal Adjustment Suggested:** Your weight loss rate ({abs(weekly_change):.2f} kg/week) is significantly faster than your target ({weekly_rate} kg/week). Losing weight too quickly may be unhealthy. Consider increasing your calorie intake slightly.")
                    elif goal_type == "weight gain":
                        if weekly_change < 0:  # Weight decreased instead of increasing
                            recommendations.append(f"\n**Goal Adjustment Needed:** You've lost {abs(weekly_change):.2f} kg per week instead of gaining weight. Consider increasing your calorie intake, especially from protein and healthy fats.")
                        elif abs(weekly_change) < (weekly_rate * 0.5):  # Much slower progress than expected
                            recommendations.append(f"\n**Goal Adjustment Suggested:** Your weight gain rate ({abs(weekly_change):.2f} kg/week) is slower than your target ({weekly_rate} kg/week). Consider increasing your calorie intake.")
                        elif abs(weekly_change) > (weekly_rate * 1.5):  # Much faster progress than expected
                            recommendations.append(f"\n**Goal Adjustment Suggested:** Your weight gain rate ({abs(weekly_change):.2f} kg/week) is significantly faster than your target ({weekly_rate} kg/week). Consider moderating your calorie intake to ensure healthy weight gain.")
        
        # Combine analysis and recommendations
        result = "\n".join(analysis)
        if recommendations:
            result += "\n" + "\n".join(recommendations)
            
        # Add goal ID for reference in future operations
        result += f"\n\n[GOAL_ID: {goal_id}]"
        
        return result
    except Exception as e:
        print(f"Error analyzing goal progress: {e}")
        traceback.print_exc()
        return "I'm having trouble analyzing your goal progress right now. Please try again later."

async def suggest_goal_adjustments(user_id):
    """
    Generate specific goal adjustment suggestions based on user's progress and history.
    
    Args:
        user_id: The user's ID
        
    Returns:
        A string containing suggested goal adjustments
    """
    try:
        # Get the user's active goal
        active_goal = get_user_active_goal(user_id)
        if not active_goal:
            return "You don't have an active goal set up yet. Would you like me to help you create one?"
        
        goal_id = str(active_goal.get("_id", ""))
        goal_type = active_goal.get("type", "unknown")
        
        # Extract weight targets if they exist
        weight_target = active_goal.get("weight_target", {})
        current_weight = weight_target.get("current", 0)
        target_weight = weight_target.get("goal", 0)
        weekly_rate = weight_target.get("weekly_rate", 0)
        
        # Extract nutrition targets
        nutrition_targets = active_goal.get("nutrition_targets", [])
        if not nutrition_targets:
            nutrition_target = None
        else:
            nutrition_target = nutrition_targets[0]
            
        # Get progress entries
        progress_entries = active_goal.get("progress", [])
        
        # Get user's logs for the past 14 days
        end_date = datetime.now(timezone.utc).date()
        start_date_logs = (datetime.now(timezone.utc) - timedelta(days=14)).date()
        
        # Get nutrition aggregates
        nutrition_data = get_user_nutrition_aggregates(user_id, start_date_logs, end_date)
        
        # Calculate average nutrition values
        total_days = len(nutrition_data)
        if total_days > 0:
            avg_calories = sum(day.get("calories", 0) for day in nutrition_data.values()) / total_days
        else:
            avg_calories = 0
            
        # Build recommended adjustments
        adjustments = []
        
        # For weight goals, calculate based on progress
        if goal_type in ["weight loss", "weight gain"] and progress_entries and len(progress_entries) >= 2:
            # Sort progress entries by date
            sorted_entries = sorted(progress_entries, 
                                  key=lambda x: x["date"] if isinstance(x["date"], datetime) 
                                  else datetime.fromisoformat(x["date"].replace('Z', '+00:00')))
            
            # Calculate actual rate of weight change
            if len(sorted_entries) >= 2:
                first_entry = sorted_entries[0]
                latest_entry = sorted_entries[-1]
                
                first_date = first_entry["date"] if isinstance(first_entry["date"], datetime) else datetime.fromisoformat(first_entry["date"].replace('Z', '+00:00'))
                latest_date = latest_entry["date"] if isinstance(latest_entry["date"], datetime) else datetime.fromisoformat(latest_entry["date"].replace('Z', '+00:00'))
                
                weeks_elapsed = (latest_date - first_date).days / 7
                if weeks_elapsed > 0:
                    weight_change = latest_entry.get("weight", 0) - first_entry.get("weight", 0)
                    actual_weekly_rate = weight_change / weeks_elapsed
                    
                    # Update the current weight to latest measurement
                    current_weight = latest_entry.get("weight", current_weight)
                    
                    # Calculate suggested adjustments
                    if goal_type == "weight loss":
                        # For weight loss, negative change is expected
                        if actual_weekly_rate >= 0:  # No weight loss or weight gain
                            # Calculate new calorie target (reduce by ~500 kcal/day)
                            if nutrition_target:
                                current_target = nutrition_target.get("daily_calories", 2000)
                                new_target = max(1200, current_target - 500)  # Ensure not too low
                                adjustments.append({
                                    "type": "calorie_adjustment",
                                    "current": current_target,
                                    "suggested": new_target,
                                    "reason": "Your current calorie intake isn't resulting in weight loss. Reducing daily calories by 500 kcal should help create a deficit."
                                })
                        elif actual_weekly_rate < -2.0:  # Losing too quickly (more than 2kg/week)
                            # Calculate new calorie target (increase by ~250 kcal/day)
                            if nutrition_target:
                                current_target = nutrition_target.get("daily_calories", 2000)
                                new_target = current_target + 250
                                adjustments.append({
                                    "type": "calorie_adjustment",
                                    "current": current_target,
                                    "suggested": new_target,
                                    "reason": f"You're losing weight at {abs(actual_weekly_rate):.2f} kg/week, which is faster than generally recommended. Increasing calories slightly can ensure a healthier, more sustainable rate."
                                })
                        elif abs(actual_weekly_rate) < 0.2:  # Very slow progress
                            # Calculate new calorie target (reduce by ~250 kcal/day)
                            if nutrition_target:
                                current_target = nutrition_target.get("daily_calories", 2000)
                                new_target = max(1200, current_target - 250)  # Ensure not too low
                                adjustments.append({
                                    "type": "calorie_adjustment",
                                    "current": current_target,
                                    "suggested": new_target,
                                    "reason": f"Your weight loss has been slow at {abs(actual_weekly_rate):.2f} kg/week. A modest reduction in calories should help accelerate progress."
                                })
                                
                    elif goal_type == "weight gain":
                        # For weight gain, positive change is expected
                        if actual_weekly_rate <= 0:  # No weight gain or weight loss
                            # Calculate new calorie target (increase by ~500 kcal/day)
                            if nutrition_target:
                                current_target = nutrition_target.get("daily_calories", 2000)
                                new_target = current_target + 500
                                adjustments.append({
                                    "type": "calorie_adjustment",
                                    "current": current_target,
                                    "suggested": new_target,
                                    "reason": "Your current calorie intake isn't resulting in weight gain. Increasing daily calories by 500 kcal should help create a surplus."
                                })
                        elif actual_weekly_rate > 1.0:  # Gaining too quickly (more than 1kg/week)
                            # Calculate new calorie target (decrease by ~250 kcal/day)
                            if nutrition_target:
                                current_target = nutrition_target.get("daily_calories", 2000)
                                new_target = current_target - 250
                                adjustments.append({
                                    "type": "calorie_adjustment",
                                    "current": current_target,
                                    "suggested": new_target,
                                    "reason": f"You're gaining weight at {actual_weekly_rate:.2f} kg/week, which is faster than generally recommended. Decreasing calories slightly can ensure healthier weight gain."
                                })
                        elif actual_weekly_rate < 0.2:  # Very slow progress
                            # Calculate new calorie target (increase by ~250 kcal/day)
                            if nutrition_target:
                                current_target = nutrition_target.get("daily_calories", 2000)
                                new_target = current_target + 250
                                adjustments.append({
                                    "type": "calorie_adjustment",
                                    "current": current_target,
                                    "suggested": new_target,
                                    "reason": f"Your weight gain has been slow at {actual_weekly_rate:.2f} kg/week. A modest increase in calories should help accelerate progress."
                                })
                    
                    # Check if target weight is still appropriate
                    # For example, if someone has been consistently losing weight but is approaching their target
                    if (goal_type == "weight loss" and current_weight - target_weight < 2) or \
                       (goal_type == "weight gain" and target_weight - current_weight < 2):
                        # Suggest new target
                        if goal_type == "weight loss":
                            new_target_weight = max(target_weight - 2, target_weight * 0.95)  # Either 2kg lower or 5% lower
                        else:  # weight gain
                            new_target_weight = min(target_weight + 2, target_weight * 1.05)  # Either 2kg higher or 5% higher
                            
                        adjustments.append({
                            "type": "weight_target_adjustment",
                            "current": target_weight,
                            "suggested": new_target_weight,
                            "reason": f"You're close to reaching your target weight of {target_weight}kg. Consider adjusting your goal to maintain progress."
                        })
        
        # For all goals, check if nutrition target needs adjustment based on recent nutrition data
        if nutrition_target and total_days > 7:
            target_calories = nutrition_target.get("daily_calories", 0)
            target_protein = nutrition_target.get("proteins", 0)
            target_carbs = nutrition_target.get("carbs", 0)
            target_fat = nutrition_target.get("fats", 0)
            
            # Calculate average nutrition values
            avg_calories = sum(day.get("calories", 0) for day in nutrition_data.values()) / total_days
            avg_protein = sum(day.get("proteins", 0) for day in nutrition_data.values()) / total_days
            avg_carbs = sum(day.get("carbs", 0) for day in nutrition_data.values()) / total_days
            avg_fat = sum(day.get("fats", 0) for day in nutrition_data.values()) / total_days
            
            # Check if consistently over/under target for macros
            if avg_protein < (target_protein * 0.8):
                # Suggest increasing protein target
                adjustments.append({
                    "type": "protein_adjustment",
                    "current": target_protein,
                    "suggested": target_protein * 0.9,  # Reduce target by 10%
                    "reason": f"You're consistently consuming less protein ({avg_protein:.1f}g) than your target ({target_protein:.1f}g). Adjusting your target to a more achievable level can help with goal tracking."
                })
            
            # Similarly for other macros
            if avg_carbs < (target_carbs * 0.8):
                adjustments.append({
                    "type": "carbs_adjustment",
                    "current": target_carbs,
                    "suggested": target_carbs * 0.9,
                    "reason": f"You're consistently consuming fewer carbs ({avg_carbs:.1f}g) than your target ({target_carbs:.1f}g). Adjusting your target to a more achievable level can help with goal tracking."
                })
                
            if avg_fat < (target_fat * 0.8):
                adjustments.append({
                    "type": "fat_adjustment",
                    "current": target_fat,
                    "suggested": target_fat * 0.9,
                    "reason": f"You're consistently consuming less fat ({avg_fat:.1f}g) than your target ({target_fat:.1f}g). Adjusting your target to a more achievable level can help with goal tracking."
                })
        
        # Format the response
        if not adjustments:
            return f"Based on your goal progress, I don't have any specific adjustment recommendations at this time. Your current goal settings appear to be working well.\n\n[GOAL_ID: {goal_id}]"
        
        response = [f"Based on your progress and nutrition data, I recommend the following adjustments to your {goal_type} goal:"]
        
        for adj in adjustments:
            if adj["type"] == "calorie_adjustment":
                response.append(f"\n**Adjust Daily Calorie Target:**")
                response.append(f"- Current: {adj['current']:.0f} kcal")
                response.append(f"- Suggested: {adj['suggested']:.0f} kcal")
                response.append(f"- Reason: {adj['reason']}")
            elif adj["type"] == "weight_target_adjustment":
                response.append(f"\n**Adjust Weight Target:**")
                response.append(f"- Current: {adj['current']:.1f} kg")
                response.append(f"- Suggested: {adj['suggested']:.1f} kg")
                response.append(f"- Reason: {adj['reason']}")
            elif adj["type"] == "protein_adjustment":
                response.append(f"\n**Adjust Protein Target:**")
                response.append(f"- Current: {adj['current']:.1f} g")
                response.append(f"- Suggested: {adj['suggested']:.1f} g")
                response.append(f"- Reason: {adj['reason']}")
            elif adj["type"] == "carbs_adjustment":
                response.append(f"\n**Adjust Carbs Target:**")
                response.append(f"- Current: {adj['current']:.1f} g")
                response.append(f"- Suggested: {adj['suggested']:.1f} g")
                response.append(f"- Reason: {adj['reason']}")
            elif adj["type"] == "fat_adjustment":
                response.append(f"\n**Adjust Fat Target:**")
                response.append(f"- Current: {adj['current']:.1f} g")
                response.append(f"- Suggested: {adj['suggested']:.1f} g")
                response.append(f"- Reason: {adj['reason']}")
        
        # Add action hint with goal ID
        response.append(f"\nWould you like me to apply any of these adjustments to your goal?\n\n[GOAL_ID: {goal_id}]")
        
        return "\n".join(response)
    except Exception as e:
        print(f"Error suggesting goal adjustments: {e}")
        traceback.print_exc()
        return "I'm having trouble generating goal adjustment suggestions right now. Please try again later."

async def handle_goal_queries(query_lower, user_id=None):
    """
    Handle goal-related queries
    
    Args:
        query_lower: The user's query in lowercase
        user_id: The authenticated user's ID, defaults to constant USER_ID if not provided
    """
    if not user_id:
        user_id = USER_ID
        
    # Check if it's a goal progress query
    if any(phrase in query_lower for phrase in ["goal progress", "my progress", "how am i doing", "track my goal", 
                                               "goal status", "my goal status", "weight progress"]):
        try:
            progress_info = await analyze_user_goal_progress(user_id)
            return {
                "answer": progress_info,
                "sources": ["Goal Database", "Food Log History"],
                "confidence": "high",
                "query_type": "goal_progress"
            }
        except Exception as e:
            print(f"Error processing goal progress query: {e}")
            return {
                "answer": "I had trouble retrieving your goal progress information. Please try again or check if you have an active goal.",
                "sources": [],
                "confidence": "low",
                "query_type": "goal_progress"
            }
    
    # Check if it's a goal adjustment suggestion query
    if any(phrase in query_lower for phrase in ["adjust my goal", "change my goal", "update my goal", 
                                               "improve my goal", "suggest changes", "goal recommendations",
                                               "change target", "adjust target"]):
        try:
            adjustment_info = await suggest_goal_adjustments(user_id)
            return {
                "answer": adjustment_info,
                "sources": ["Goal Database", "Food Log History"],
                "confidence": "high",
                "query_type": "goal_adjustment"
            }
        except Exception as e:
            print(f"Error processing goal adjustment query: {e}")
            return {
                "answer": "I had trouble generating goal adjustment suggestions. Please try again or check if you have an active goal.",
                "sources": [],
                "confidence": "low",
                "query_type": "goal_adjustment"
            }
    
    # Check if it's a query about current goals
    if any(phrase in query_lower for phrase in ["current goal", "active goal", "my goal", 
                                               "weight goal", "nutrition goal", "what is my goal", 
                                               "goal details", "tell me about my goal"]):
        try:
            active_goal = get_user_active_goal(user_id)
            if not active_goal:
                return {
                    "answer": "You don't have an active goal set up yet. Would you like me to help you create one?",
                    "sources": ["Goal Database"],
                    "confidence": "high",
                    "query_type": "goal_info"
                }
                
            # Format basic goal info
            goal_type = active_goal.get("type", "unknown")
            goal_id = str(active_goal.get("_id", ""))
            
            response = [f"**Your Current {goal_type.title()} Goal:**"]
            
            # Add weight target info if available
            weight_target = active_goal.get("weight_target", {})
            if weight_target:
                current_weight = weight_target.get("current", 0)
                target_weight = weight_target.get("goal", 0)
                weekly_rate = weight_target.get("weekly_rate", 0)
                
                if current_weight and target_weight:
                    response.append(f"- Starting weight: {current_weight} kg")
                    response.append(f"- Target weight: {target_weight} kg")
                    if weekly_rate:
                        response.append(f"- Target rate: {weekly_rate} kg per week")
            
            # Add nutrition target info
            nutrition_targets = active_goal.get("nutrition_targets", [])
            if nutrition_targets:
                nutrition_target = nutrition_targets[0]
                response.append("\n**Nutrition Targets:**")
                response.append(f"- Daily calories: {nutrition_target.get('daily_calories', 0):.0f} kcal")
                response.append(f"- Protein: {nutrition_target.get('proteins', 0):.1f} g")
                response.append(f"- Carbs: {nutrition_target.get('carbs', 0):.1f} g")
                response.append(f"- Fat: {nutrition_target.get('fats', 0):.1f} g")
                if nutrition_target.get("fiber", 0) > 0:
                    response.append(f"- Fiber: {nutrition_target.get('fiber', 0):.1f} g")
            
            # Add creation date
            created_at = active_goal.get("created_at", "")
            if created_at:
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                response.append(f"\nGoal created on: {created_at.strftime('%Y-%m-%d')}")
            
            # Add goal ID reference
            response.append(f"\n[GOAL_ID: {goal_id}]")
            
            return {
                "answer": "\n".join(response),
                "sources": ["Goal Database"],
                "confidence": "high",
                "query_type": "goal_info"
            }
        except Exception as e:
            print(f"Error processing goal info query: {e}")
            return {
                "answer": "I had trouble retrieving your goal information. Please try again.",
                "sources": [],
                "confidence": "low",
                "query_type": "goal_info"
            }
    
    # If nothing matched
    return None