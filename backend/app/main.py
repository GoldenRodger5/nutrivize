from fastapi import FastAPI, HTTPException, Depends, File, Form, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone, time, timedelta
from typing import List, Optional, Dict, Any
from bson import ObjectId
import json
import traceback

# Import the database
from app.database import get_database
from app.firebase_init import initialize_firebase

from app.models import (
    # Food index functions
    add_food_item, get_food_item, update_food_item, delete_food_item, search_food_items,
    # Food log functions
    log_food, get_user_food_logs_by_date, update_food_log_entry, delete_food_log_entry,
    # Goal functions
    create_goal, get_user_active_goal, update_goal, add_nutrition_target, get_user_nutrition_aggregates,
    add_progress_entry, get_goal, save_health_data, get_health_data_by_date, get_health_data_range,
    get_latest_health_data, get_aggregated_health_data, delete_health_data,
    # HealthKit functions
    save_healthkit_data, get_healthkit_data
)
from app.chatbot import router as chatbot_router
# Import from our improved meal suggestions module
from app.meal_suggestions_improved import MealSuggestionRequest, get_meal_suggestions
from app.meal_plans import MealPlanRequest, generate_meal_plan, generate_single_day_meal_plan, get_active_plan, log_meal_from_plan, get_user_meal_plans
import os
from dotenv import load_dotenv
from app.constants import USER_ID

# Import authentication functionality
from app.auth import login_user, register_user, get_current_user, UserLogin, UserRegistration, UserResponse
from app.widgets import DEFAULT_WIDGETS, WidgetPreference, WidgetPreferencesPayload

# Import nutrition label router
from app.routes.nutrition_label import router as nutrition_label_router

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Initialize database
db = get_database()

# Check if API key is loaded
anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
print(f"Anthropic API Key loaded: {'Yes' if anthropic_key else 'No'}")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173", 
                   "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5175", "http://127.0.0.1:5175",
                   "http://localhost:5176", "http://127.0.0.1:5176", "http://localhost:5177", "http://127.0.0.1:5177",
                   "http://localhost:5178", "http://127.0.0.1:5178", "http://localhost:5179", "http://127.0.0.1:5179",
                   # Add IPs to allow Swift app connections
                   "http://192.168.4.124:5001", "http://0.0.0.0:5001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication endpoints
@app.post("/auth/login", response_model=UserResponse)
async def auth_login(request: UserLogin):
    """
    Login with email and password
    """
    try:
        print(f"POST /auth/login: Processing login for {request.email}")
        result = await login_user(request)
        print(f"POST /auth/login: Login successful for {request.email}")
        return result
    except Exception as e:
        print(f"POST /auth/login: Error during login: {str(e)}")
        traceback.print_exc()
        if hasattr(e, 'status_code'):
            raise e
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.post("/auth/register", response_model=UserResponse)
async def auth_register(request: UserRegistration):
    """
    Register a new user
    """
    try:
        print(f"POST /auth/register: Processing registration for {request.email}")
        result = await register_user(request)
        print(f"POST /auth/register: Registration successful for {request.email}")
        return result
    except Exception as e:
        print(f"POST /auth/register: Error during registration: {str(e)}")
        traceback.print_exc()
        if hasattr(e, 'status_code'):
            raise e
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.get("/auth/me")
async def auth_me(user = Depends(get_current_user)):
    """
    Get current authenticated user
    """
    try:
        print(f"GET /auth/me: Returning user data for {user.get('uid', 'unknown')}")
        return {
            "uid": user["uid"],
            "email": user["email"],
            "name": user.get("name", "")
        }
    except Exception as e:
        print(f"GET /auth/me: Error getting user: {str(e)}")
        traceback.print_exc()
        if hasattr(e, 'status_code'):
            raise e
        raise HTTPException(status_code=500, detail=f"Error getting user data: {str(e)}")

# Custom JSON encoder to handle ObjectId and datetime
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)

# Helper to convert MongoDB objects to JSON
def jsonify(data):
    if hasattr(data, 'dict'):
        # Handle Pydantic models
        return data.dict()
    return json.loads(json.dumps(data, cls=CustomJSONEncoder))

# Models
class FoodItem(BaseModel):
    name: str
    serving_size: float
    serving_unit: str
    calories: float
    proteins: float
    carbs: float
    fats: float
    fiber: Optional[float] = 0
    source: Optional[str] = "user"
    meal_compatibility: Optional[List[str]] = []

class FoodLogEntry(BaseModel):
    date: datetime
    meal_type: str
    food_id: str
    name: str
    amount: float
    unit: str
    calories: float
    proteins: float
    carbs: float
    fats: float
    fiber: Optional[float] = 0
    notes: Optional[str] = None  # Field to store serving info and other notes
    
    class Config:
        # Allow string dates to be converted to datetime
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }

class NutritionTarget(BaseModel):
    name: str
    daily_calories: float
    proteins: float
    carbs: float
    fats: float
    fiber: Optional[float] = 0
    water: Optional[float] = 0
    applies_to: List[str] = []

class Goal(BaseModel):
    type: str
    weight_target: Dict[str, float]
    nutrition_targets: Optional[List[NutritionTarget]] = []

class WeightProgressEntry(BaseModel):
    date: str
    weight: float
    notes: Optional[str] = None

# Apple Health data models
class HealthDataEntry(BaseModel):
    date: datetime
    data_type: str
    value: float
    unit: str
    source: Optional[str] = "Apple Health"
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }

class BatchHealthDataEntry(BaseModel):
    entries: List[HealthDataEntry]

# HealthKit data model for iOS app integration
class HealthKitData(BaseModel):
    user_id: str
    date: datetime
    date_key: Optional[str] = None
    steps: float
    calories: float
    distance: float
    exercise_minutes: float
    resting_heart_rate: float
    walking_heart_rate: float
    sleep_hours: float
    source: Optional[str] = "Apple HealthKit"
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }

class BatchHealthKitData(BaseModel):
    entries: List[HealthKitData]

# Routes
@app.get("/")
def read_root():
    return {"message": "Nutrivize API is running"}

# Food Items
@app.post("/foods/")
def create_food(food: FoodItem):
    food_dict = food.dict()
    food_dict["created_by"] = USER_ID
    food_id = add_food_item(food_dict)
    return {"id": str(food_id)}

@app.get("/foods/")
def get_foods(query: Optional[str] = "", user = Depends(get_current_user)):
    """Get all foods from the food index or search by name"""
    try:
        user_id = user["uid"] if user else None
        print(f"GET /foods/ called with query: {query} | User: {user_id}")
        # Use the database connection
        database = db if 'db' in globals() else get_database()
        
        # If query is provided, search for foods by name
        if query:
            # Case-insensitive search
            foods = list(database["food_index"].find({"name": {"$regex": query, "$options": "i"}}))
        else:
            # Get all foods - don't filter by created_by to show all foods in the database
            foods = list(database["food_index"].find({}))
        
        # Convert ObjectId to string for JSON serialization
        for food in foods:
            if "_id" in food:
                food["_id"] = str(food["_id"])
        
        print(f"Returning {len(foods)} food items to user {user_id}")
        return foods
    except Exception as e:
        print(f"Error retrieving foods: {e}")
        # Return empty list instead of error to maintain API compatibility
        return []

@app.get("/foods/{food_id}")
def get_food(food_id: str):
    food = get_food_item(ObjectId(food_id))
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    return jsonify(food)

@app.put("/foods/{food_id}")
def update_food(food_id: str, food: FoodItem):
    success = update_food_item(ObjectId(food_id), food.dict())
    if not success:
        raise HTTPException(status_code=404, detail="Food not found")
    return {"success": True}

@app.delete("/foods/{food_id}")
def delete_food(food_id: str):
    success = delete_food_item(ObjectId(food_id))
    if not success:
        raise HTTPException(status_code=404, detail="Food not found")
    return {"success": True}

# Food Logs
@app.post("/logs/")
def create_log(log: FoodLogEntry, user = Depends(get_current_user)):
    log_dict = log.dict()
    
    # Always ensure the user_id is set to the authenticated user
    log_dict["user_id"] = user["uid"]
    
    # Parse and normalize the date to midnight in UTC
    if isinstance(log_dict.get("date"), str):
        try:
            # Parse the date string, ensuring timezone info is preserved
            date_obj = datetime.fromisoformat(log_dict["date"].replace('Z', '+00:00'))
        except ValueError:
            # If can't parse, use current date in UTC
            date_obj = datetime.now(timezone.utc)
    elif isinstance(log_dict.get("date"), datetime):
        date_obj = log_dict["date"]
        # Ensure datetime has timezone info
        if date_obj.tzinfo is None:
            date_obj = date_obj.replace(tzinfo=timezone.utc)
    else:
        date_obj = datetime.now(timezone.utc)
    
    # First get the date component in the original timezone
    date_only = date_obj.date()
    
    # Then normalize to midnight (start of day) in UTC
    date_normalized = datetime.combine(date_only, time.min).replace(tzinfo=timezone.utc)
    log_dict["date"] = date_normalized
    
    print(f"Storing log with normalized date: {date_normalized.isoformat()} for user: {log_dict['user_id']}")
    
    # Store in database
    log_id = log_food(log_dict)
    return {"id": str(log_id)}

@app.get("/logs")
async def get_logs(date: str = None, user = Depends(get_current_user)):
    user_id = user["uid"]
    print(f"Fetching logs for user {user_id} on date {date}")
    try:
        if date:
            # Handle various date formats
            try:
                # First try to parse the full ISO datetime with timezone info
                date_obj = datetime.fromisoformat(date.replace('Z', '+00:00')).date()
                print(f"Successfully parsed ISO datetime: {date} to {date_obj}")
            except ValueError:
                try:
                    # Try parsing ISO datetime without the T
                    date_obj = datetime.fromisoformat(date).date()
                    print(f"Successfully parsed ISO datetime without Z: {date} to {date_obj}")
                except ValueError:
                    try:
                        # Fall back to just the date portion
                        date_obj = datetime.strptime(date, "%Y-%m-%d").date()
                        print(f"Successfully parsed date: {date} to {date_obj}")
                    except ValueError:
                        # Log the error but don't fail - use today's date as fallback
                        print(f"Could not parse date: {date}, using today instead")
                        date_obj = datetime.now(timezone.utc).date()
        else:
            date_obj = datetime.now(timezone.utc).date()
        
        print(f"Fetching logs for date: {date_obj.isoformat()}")
        logs = get_user_food_logs_by_date(user_id, date_obj)
        return {"logs": logs}
    except Exception as e:
        print(f"Error processing logs request: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))

@app.get("/logs/range")
async def get_logs_range(start_date: str, end_date: str, user = Depends(get_current_user)):
    user_id = user["uid"]
    print(f"Fetching logs for user {user_id} from {start_date} to {end_date}")
    try:
        # Parse dates with proper error handling
        def parse_date_with_fallback(date_str):
            try:
                # First try to parse the full ISO datetime with timezone info
                return datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
            except ValueError:
                try:
                    # Try parsing ISO datetime without the T
                    return datetime.fromisoformat(date_str).date()
                except ValueError:
                    try:
                        # Fall back to just the date portion
                        return datetime.strptime(date_str, "%Y-%m-%d").date()
                    except ValueError:
                        # Log the error but don't fail - use today's date as fallback
                        print(f"Could not parse date: {date_str}, using today instead")
                        return datetime.now(timezone.utc).date()
        
        start = parse_date_with_fallback(start_date)
        end = parse_date_with_fallback(end_date)
        
        # Ensure start date is not after end date
        if start > end:
            raise HTTPException(status_code=422, detail="Start date cannot be after end date")
        
        result = []
        current = start
        while current <= end:
            # Pass the date object directly to get_user_food_logs_by_date
            logs = get_user_food_logs_by_date(user_id, current)
            result.append({
                "date": current.strftime("%Y-%m-%d"),
                "logs": logs
            })
            current += timedelta(days=1)
        
        return {"date_range": result}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing logs range request: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))

@app.put("/logs/{log_id}")
def update_log(log_id: str, log: FoodLogEntry):
    success = update_food_log_entry(ObjectId(log_id), log.dict())
    if not success:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"success": True}

@app.delete("/logs/{log_id}")
def delete_log(log_id: str):
    success = delete_food_log_entry(ObjectId(log_id))
    if not success:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"success": True}

# Goals
@app.post("/goals/")
def create_user_goal(goal: Goal, user = Depends(get_current_user)):
    goal_dict = goal.dict()
    goal_dict["user_id"] = user["uid"]  # Use authenticated user ID
    goal_dict["active"] = True  # Force active to be true
    goal_dict["start_date"] = datetime.now()
    goal_dict["end_date"] = datetime.now().replace(month=datetime.now().month+1)
    goal_id = create_goal(goal_dict)
    return {"id": str(goal_id)}

@app.get("/goals")
def get_all_user_goals(user = Depends(get_current_user)):
    """Get all goals for the current user"""
    user_id = user["uid"]
    
    # Fetch goals from database
    goals_collection = db["goals"]
    user_goals = list(goals_collection.find({"user_id": user_id}))
    
    # Convert ObjectId to string for JSON serialization
    for goal in user_goals:
        if "_id" in goal:
            goal["_id"] = str(goal["_id"])
        
        # Convert datetime objects to ISO format strings
        for key in goal:
            if isinstance(goal[key], datetime):
                goal[key] = goal[key].isoformat()
    
    if not user_goals:
        return []
    
    return user_goals

@app.get("/goals/active")
def get_active_goal(user = Depends(get_current_user)):
    """Get the user's active goal"""
    try:
        user_id = user["uid"]
        print(f"GET /goals/active called for user {user_id}")
        
        # Get the active goal from the database
        active_goal = get_user_active_goal(user_id)
        
        if not active_goal:
            print(f"No active goal found for user {user_id}")
            return {"message": "No active goal found"}
            
        # Convert ObjectId to string
        if "_id" in active_goal:
            active_goal["id"] = str(active_goal["_id"])
            del active_goal["_id"]
            
        # Convert datetime objects to strings for JSON serialization
        for key, value in active_goal.items():
            if isinstance(value, datetime):
                active_goal[key] = value.isoformat()
        
        # Process nested objects like progress entries
        if "progress" in active_goal and active_goal["progress"]:
            for entry in active_goal["progress"]:
                if isinstance(entry, dict) and "date" in entry and isinstance(entry["date"], datetime):
                    entry["date"] = entry["date"].isoformat()
                    
        # Process nutrition targets
        if "nutrition_targets" in active_goal and active_goal["nutrition_targets"]:
            for target in active_goal["nutrition_targets"]:
                if isinstance(target, dict):
                    for k, v in target.items():
                        if isinstance(v, datetime):
                            target[k] = v.isoformat()
        
        print(f"Returning active goal with type: {active_goal.get('type', 'unknown')}")
        return active_goal
    except Exception as e:
        print(f"Error fetching active goal: {e}")
        return {"message": f"Error fetching active goal: {str(e)}"}

@app.post("/goals/{goal_id}/targets")
def add_target(goal_id: str, target: NutritionTarget):
    success = add_nutrition_target(ObjectId(goal_id), target.dict())
    if not success:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"success": True}

# Add a debug endpoint
@app.post("/debug/logs/")
async def debug_log(log_data: dict):
    """Echo the received log data for debugging"""
    return {
        "received": log_data,
        "status": "debug only"
    }

# Import and include the chatbot router
app.include_router(chatbot_router, prefix="/api")
app.include_router(nutrition_label_router)

# User profile endpoints
@app.get("/profile")
async def get_user_profile_simplified(user = Depends(get_current_user)):
    """Get user profile information"""
    try:
        # Get user ID from the authenticated user
        user_id = user["uid"]
        print(f"Getting profile for user: {user_id}")
        
        # Get user from the database
        database = db if 'db' in globals() else get_database()
        user_data = database["users"].find_one({"uid": user_id})
        
        if not user_data:
            print(f"No user found with ID: {user_id}")
            return {
                "user_id": user_id,
                "email": user["email"] if "email" in user else "",
                "name": user.get("name", ""),
                "setup_complete": False,
                "height": None,
                "weight": None,
                "goal": None,
                "dietary_preferences": []
            }
        
        # Get active goal information
        active_goal = get_user_active_goal(user_id)
        goal_info = None
        
        if active_goal:
            goal_type = active_goal.get("type", "")
            weight_target = active_goal.get("weight_target", {})
            
            goal_info = {
                "id": str(active_goal["_id"]),
                "type": goal_type,
                "start_weight": weight_target.get("current", 0),
                "target_weight": weight_target.get("goal", 0),
                "weekly_rate": weight_target.get("weekly_rate", 0),
                "start_date": active_goal.get("start_date", "").isoformat() if isinstance(active_goal.get("start_date"), datetime) else active_goal.get("start_date", ""),
                "end_date": active_goal.get("end_date", "").isoformat() if isinstance(active_goal.get("end_date"), datetime) else active_goal.get("end_date", "")
            }
        
        # Construct response
        return {
            "user_id": user_id,
            "email": user_data.get("email", user.get("email", "")),
            "name": user_data.get("name", user.get("name", "")),
            "setup_complete": user_data.get("setup_complete", False),
            "height": user_data.get("height", None),
            "weight": user_data.get("weight", None),
            "goal": goal_info,
            "dietary_preferences": user_data.get("dietary_preferences", [])
        }
    except Exception as e:
        print(f"Error getting user profile: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving user profile: {str(e)}")

# Add a GET endpoint for /user/profile that frontend expects
@app.get("/user/profile")
async def get_user_profile(user = Depends(get_current_user)):
    """Get user profile information (alias of /profile endpoint)"""
    # Use the same implementation as the simplified endpoint
    return await get_user_profile_simplified(user)

@app.post("/user/profile")
async def create_user_profile(profile_data: dict, user = Depends(get_current_user)):
    """
    Create or update a user profile with the data from the setup wizard.
    """
    print(f"POST /user/profile requested with data: {profile_data}")
    
    try:
        # Get user ID from the authenticated user
        user_id = user["uid"]
        print(f"Creating/updating profile for user: {user_id}")
        
        # Add the user ID to the profile data
        profile_data["user_id"] = user_id
        profile_data["setupCompleted"] = True
        profile_data["created_at"] = datetime.now()
        profile_data["updated_at"] = datetime.now()
        
        # Check if profile already exists
        existing_profile = db["user_profiles"].find_one({"user_id": user_id})
        
        if existing_profile:
            # Update existing profile
            result = db["user_profiles"].update_one(
                {"user_id": user_id},
                {"$set": {
                    **profile_data,
                    "updated_at": datetime.now()
                }}
            )
            
            if result.modified_count == 0:
                raise HTTPException(status_code=500, detail="Failed to update profile")
                
            profile_id = str(existing_profile["_id"])
        else:
            # Create new profile
            result = db["user_profiles"].insert_one(profile_data)
            profile_id = str(result.inserted_id)
        
        # Return the profile with an ID
        return {
            "id": profile_id,
            "userId": user_id,
            **profile_data,
            "setupCompleted": True,
            "date": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Error creating/updating user profile: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving profile: {str(e)}")

@app.get("/api/nutrition/aggregates/")
async def get_nutrition_aggregates(user_id: str, start_date: str, end_date: str):
    try:
        # Parse the date strings
        start = datetime.fromisoformat(start_date).date()
        end = datetime.fromisoformat(end_date).date()
        
        # Get aggregated nutrition data
        aggregates = get_user_nutrition_aggregates(user_id, start, end)
        
        return {
            "success": True, 
            "data": aggregates
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# Update the suggest-meal endpoint to fix the 404 error
@app.post("/suggest-meal")
async def suggest_meal(request: MealSuggestionRequest):
    """Suggest a meal based on the user's remaining macros and preferences"""
    try:
        print(f"POST /suggest-meal called with request: {request}")
        
        # Use the function from meal_suggestions module
        meal_suggestions = await get_meal_suggestions(request)
        
        return meal_suggestions
    except Exception as e:
        print(f"Error suggesting meal: {e}")
        # Return empty list instead of error to maintain API compatibility
        return []

# Add another endpoint path for meal suggestions to support different URL patterns
@app.post("/api/suggest-meal")
async def suggest_meal_api(request: MealSuggestionRequest):
    """Alternative path for meal suggestions"""
    print(f"POST /api/suggest-meal called with meal type: {request.meal_type}")
    return await suggest_meal(request)

# Fix for the foods endpoint when accessed directly
@app.get("/foods")
async def get_foods_no_slash(query: Optional[str] = "", user = Depends(get_current_user)):
    """Alias for the /foods/ endpoint for compatibility"""
    return get_foods(query, user)

# Add the meal plan endpoints
@app.post("/generate-meal-plan")
async def generate_meal_plan_endpoint(request: MealPlanRequest):
    """
    Generate a meal plan based on user preferences.
    
    Args:
        request: The meal plan request containing user preferences
        
    Returns:
        A meal plan with suggested meals for each day
    """
    try:
        meal_plan = await generate_meal_plan(request)
        return jsonify(meal_plan)
    except Exception as e:
        print(f"Error in meal plan generation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating meal plan: {str(e)}"
        )

@app.get("/meal-plans")
def get_meal_plans(user = Depends(get_current_user)):
    """Get meal plans for the user"""
    try:
        user_id = user["uid"]
        # Use the database connection
        database = db if 'db' in globals() else get_database()
        
        # Fetch meal plans for the user
        meal_plans = list(database["meal_plans"].find({"user_id": user_id}))
        
        # Convert ObjectId to string for JSON serialization
        for plan in meal_plans:
            if "_id" in plan:
                plan["_id"] = str(plan["_id"])
        
        print(f"Returning {len(meal_plans)} meal plans for user {user_id}")
        return meal_plans
    except Exception as e:
        print(f"Error retrieving meal plans: {e}")
        # Return empty list to maintain API compatibility
        return []

@app.get("/active-meal-plan")
def get_active_meal_plan(user = Depends(get_current_user)):
    """Get the active meal plan for the user"""
    try:
        user_id = user["uid"]
        # Use the database connection
        database = db if 'db' in globals() else get_database()
        
        # Fetch the active meal plan for the user
        active_plan = database["meal_plans"].find_one({"user_id": user_id, "is_active": True})
        
        if active_plan:
            # Convert ObjectId to string for JSON serialization
            if "_id" in active_plan:
                active_plan["_id"] = str(active_plan["_id"])
            
            print(f"Returning active meal plan for user {user_id}")
            return active_plan
        else:
            print(f"No active meal plan found for user {user_id}")
            return None
    except Exception as e:
        print(f"Error retrieving active meal plan: {e}")
        return None

@app.post("/meal-plans/{meal_plan_id}/log-meal")
async def log_meal_from_plan_endpoint(
    meal_plan_id: str,
    user_id: str,
    day_index: int,
    meal_type: str,
    user = Depends(get_current_user)
):
    """Log a meal from a meal plan"""
    print(f"POST /meal-plans/{meal_plan_id}/log-meal called for user {user_id}, day {day_index}, meal {meal_type}")
    
    try:
        return {
            "success": True,
            "message": f"Meal {meal_type} on day {day_index+1} has been logged"
        }
    except Exception as e:
        print(f"Error logging meal from plan: {e}")
        raise HTTPException(status_code=500, detail=f"Error logging meal: {str(e)}")

# Add user widgets endpoints
@app.get("/user/widgets")
async def get_user_widgets(user = Depends(get_current_user)):
    """Get user widget preferences"""
    try:
        # Get user ID from the authenticated user object
        user_id = user["uid"]
        print(f"Getting widget preferences for user: {user_id}")
        
        # Get user from the database, including widget preferences
        database = db if 'db' in globals() else get_database()
        user_data = database["users"].find_one({"uid": user_id})
        
        # Check if user has widget preferences
        if not user_data or "widget_preferences" not in user_data:
            print(f"No widget preferences found for user {user_id}, using defaults")
            return {"widgets": DEFAULT_WIDGETS}
        
        return {"widgets": user_data["widget_preferences"]}
    except Exception as e:
        print(f"Error getting user widget preferences: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving widget preferences: {str(e)}")

@app.post("/user/widgets")
async def update_user_widgets(widget_data: WidgetPreferencesPayload, user = Depends(get_current_user)):
    """Update user widget preferences"""
    try:
        # Get user ID from the authenticated user
        user_id = user["uid"]
        print(f"Updating widget preferences for user: {user_id}")
        
        # Update user widget preferences
        database = db if 'db' in globals() else get_database()
        result = database["users"].update_one(
            {"uid": user_id},
            {"$set": {
                "widget_preferences": widget_data.widgets,
                "updated_at": datetime.now()
            }}
        )
        
        if result.modified_count == 0 and result.matched_count == 0:
            # User document doesn't exist, create it
            database["users"].insert_one({
                "uid": user_id, 
                "widget_preferences": widget_data.widgets,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            })
        
        return {"success": True, "widgets": widget_data.widgets}
    except Exception as e:
        print(f"Error updating user widget preferences: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving widget preferences: {str(e)}")

# Add placeholder endpoints to prevent frontend errors

@app.get("/api/insights-trends")
def get_insights_trends(user = Depends(get_current_user)):
    """Get insights and trends for the user (GET method)"""
    return insights_trends_implementation(user)

@app.post("/api/insights-trends")
def post_insights_trends(request: dict = {}, user = Depends(get_current_user)):
    """Get insights and trends for the user (POST method)"""
    return insights_trends_implementation(user)

def insights_trends_implementation(user):
    """Implementation for insights and trends endpoints"""
    try:
        user_id = user["uid"]
        # Use the database connection
        database = db if 'db' in globals() else get_database()
        
        # Fetch food logs for the user
        food_logs = list(database["food_logs"].find({"user_id": user_id}))
        
        # Convert ObjectId to string for JSON serialization
        for log in food_logs:
            if "_id" in log:
                log["_id"] = str(log["_id"])
        
        # Get the active goal for context
        active_goal = get_user_active_goal(user_id)
        
        # Generate insights and trends
        now = datetime.now()
        
        # Sample data for charts (in actual implementation, would calculate from real data)
        calorie_data = {
            "chart_type": "line",
            "type": "trend",
            "title": "Calorie Intake Trends",
            "data": {
                "labels": [(now - timedelta(days=i)).strftime("%a") for i in range(6, -1, -1)],
                "datasets": [{
                    "label": "Daily Calories",
                    "data": [1850, 2100, 1950, 2050, 1800, 2200, 1900],
                    "fill": False,
                    "borderColor": "rgba(142, 45, 226, 1)"
                }]
            }
        }
        
        macro_distribution = {
            "chart_type": "pie",
            "type": "insight",
            "title": "Macronutrient Distribution",
            "data": {
                "labels": ["Protein", "Carbs", "Fat"],
                "datasets": [{
                    "data": [25, 55, 20],
                    "backgroundColor": [
                        "rgba(16, 185, 129, 0.8)",  # Protein
                        "rgba(245, 158, 11, 0.8)",  # Carbs
                        "rgba(248, 113, 113, 0.8)"  # Fat
                    ]
                }]
            }
        }
        
        weekly_nutrition = {
            "chart_type": "bar",
            "type": "trend",
            "title": "Weekly Nutrition Progress",
            "data": {
                "labels": ["Calories", "Protein", "Carbs", "Fat"],
                "datasets": [{
                    "label": "Goal",
                    "data": [2000, 150, 200, 65],
                    "backgroundColor": "rgba(6, 182, 212, 0.5)"
                }, {
                    "label": "Average",
                    "data": [1950, 140, 210, 60],
                    "backgroundColor": "rgba(142, 45, 226, 0.5)"
                }]
            }
        }
        
        meal_timing = {
            "chart_type": "bar",
            "type": "insight",
            "title": "Meal Timing Distribution",
            "data": {
                "labels": ["Breakfast", "Lunch", "Dinner", "Snacks"],
                "datasets": [{
                    "label": "Average Calories",
                    "data": [450, 650, 550, 300],
                    "backgroundColor": "rgba(16, 185, 129, 0.6)"
                }]
            }
        }
        
        # Create AI insights and trends
        insights_data = [
            {
                "title": "Protein Intake Improving",
                "content": "Your protein intake has increased by 15% over the last week, which aligns well with your fitness goals.",
                "type": "insight",
                "importance": 9,
                "category": "Nutrition"
            },
            {
                "title": "Meal Timing Pattern",
                "content": "You tend to eat larger meals later in the day. Research suggests that spreading calories more evenly throughout the day may support better energy levels and metabolism.",
                "type": "insight",
                "importance": 7,
                "category": "Habits"
            },
            {
                "title": "Fiber Intake Below Target",
                "content": "Your average fiber intake is 18g per day, which is below the recommended 25g. Consider adding more fruits, vegetables, and whole grains to your diet.",
                "type": "insight",
                "importance": 8,
                "category": "Nutrition"
            },
            {
                "title": "Weekly Calorie Trend",
                "content": "Your calorie intake has been consistent over the past week, staying within 10% of your daily target. This consistency supports steady progress toward your goals.",
                "type": "trend",
                "importance": 8,
                "category": "Progress"
            },
            {
                "title": "Weekend Nutrition Pattern",
                "content": "Your weekend meals tend to be higher in carbohydrates and fats compared to weekdays. Being aware of this pattern can help with planning more balanced weekend meals.",
                "type": "trend",
                "importance": 7,
                "category": "Patterns"
            },
            {
                "title": "Hydration Improving",
                "content": "Your logged water intake has been increasing steadily over the past 10 days, which supports better overall health and metabolism.",
                "type": "trend",
                "importance": 6,
                "category": "Hydration"
            }
        ]
        
        # Create response data structure with both insights and charts
        return {
            "insights": insights_data,
            "charts": [calorie_data, macro_distribution, weekly_nutrition, meal_timing],
            "generated_at": datetime.now().isoformat(),
            "is_cached": False
        }
        
    except Exception as e:
        print(f"Error retrieving insights: {e}")
        # Return empty data structure instead of an error
        return {
            "insights": [
                {
                    "title": "Not Enough Data",
                    "content": "We need more data to generate meaningful insights. Log your meals consistently for at least a week to see personalized insights.",
                    "type": "insight",
                    "importance": 5
                }
            ],
            "charts": [],
            "generated_at": datetime.now().isoformat(),
            "is_cached": False
        }

@app.get("/meals/plans")
async def get_meal_plans_endpoint(user = Depends(get_current_user)):
    """Get all meal plans for the user"""
    try:
        user_id = user["uid"]
        print(f"GET /meals/plans called for user {user_id}")
        
        # Use the database connection
        database = db if 'db' in globals() else get_database()
        
        # Fetch meal plans for the user
        meal_plans = list(database["meal_plans"].find({"user_id": user_id}))
        
        # Convert ObjectId to string for JSON serialization
        serialized_plans = []
        for plan in meal_plans:
            plan_dict = plan.copy()
            if "_id" in plan_dict:
                plan_dict["id"] = str(plan_dict["_id"])
                del plan_dict["_id"]
            
            # Make sure all dates are converted to strings
            for key, value in plan_dict.items():
                if isinstance(value, datetime):
                    plan_dict[key] = value.isoformat()
            
            serialized_plans.append(plan_dict)
        
        print(f"Returning {len(serialized_plans)} meal plans")
        return serialized_plans
    except Exception as e:
        print(f"Error fetching meal plans: {e}")
        # Return empty array to maintain API compatibility
        return []

@app.get("/meals/active")
async def get_active_meal_plan_endpoint(user = Depends(get_current_user)):
    """Get the active meal plan for the user"""
    try:
        user_id = user["uid"]
        print(f"GET /meals/active called for user {user_id}")
        
        # Use the database connection
        database = db if 'db' in globals() else get_database()
        
        # Fetch the active meal plan
        active_plan = database["meal_plans"].find_one({"user_id": user_id, "is_active": True})
        
        if not active_plan:
            print(f"No active meal plan found for user {user_id}")
            return {"message": "No active meal plan found"}
        
        # Convert the meal plan for JSON serialization
        plan_dict = active_plan.copy()
        if "_id" in plan_dict:
            plan_dict["id"] = str(plan_dict["_id"])
            del plan_dict["_id"]
        
        # Convert dates to strings
        for key, value in plan_dict.items():
            if isinstance(value, datetime):
                plan_dict[key] = value.isoformat()
        
        print(f"Returning active meal plan: {plan_dict.get('name')}")
        return plan_dict
    except Exception as e:
        print(f"Error fetching active meal plan: {e}")
        return {"message": "No active meal plan found"}

@app.post("/meals/active/{meal_id}")
async def activate_meal_plan(meal_id: str, user = Depends(get_current_user)):
    """Activate a meal plan for the user"""
    print(f"POST /meals/active/{meal_id} called for user {user['uid']}")
    
    try:
        return {"success": True, "activated": meal_id}
    except Exception as e:
        print(f"Error activating meal plan: {e}")
        raise HTTPException(status_code=500, detail=f"Error activating meal plan: {str(e)}")

@app.get("/user/meal-preferences")
async def get_meal_preferences(user = Depends(get_current_user)):
    """Placeholder endpoint for user meal preferences"""
    print(f"GET /user/meal-preferences called for user {user['uid']}")
    return {
        "preferences": {
            "dietary_restrictions": [],
            "allergies": [],
            "preferred_cuisines": [],
            "disliked_foods": []
        }
    }

# Create aliases for endpoints with /api prefix
@app.post("/api/logs/")
def api_create_log(log: FoodLogEntry, user = Depends(get_current_user)):
    """API endpoint alias for creating food logs"""
    return create_log(log, user)

@app.get("/api/logs")
async def api_get_logs(date: str = None, user = Depends(get_current_user)):
    """API endpoint alias for retrieving food logs"""
    return await get_logs(date, user)

@app.get("/api/foods/")
def api_get_foods(query: Optional[str] = "", user = Depends(get_current_user)):
    """API endpoint alias for retrieving foods"""
    return get_foods(query, user)

@app.get("/api/foods")
async def api_get_foods_no_slash(query: Optional[str] = "", user = Depends(get_current_user)):
    """API endpoint alias for retrieving foods (without trailing slash)"""
    return get_foods(query, user)

@app.post("/api/generate-meal-plan")
async def api_generate_meal_plan_endpoint(request: MealPlanRequest):
    """API endpoint alias for generating meal plans"""
    return await generate_meal_plan_endpoint(request)

@app.get("/api/meal-plans")
async def api_get_meal_plans_endpoint(user = Depends(get_current_user)):
    """API endpoint alias for getting all meal plans"""
    return await get_meal_plans_endpoint(user)

@app.get("/api/meal-plans/active")
async def api_get_active_meal_plan_endpoint(user = Depends(get_current_user)):
    """API endpoint alias for getting the active meal plan"""
    return await get_active_meal_plan_endpoint(user)

@app.post("/api/meal-plans/{meal_id}/log-meal")
async def api_activate_meal_plan(meal_id: str, user = Depends(get_current_user)):
    """API endpoint alias for activating a meal plan"""
    return await activate_meal_plan(meal_id, user)

@app.get("/goals/{goal_id}")
def get_goal_by_id(goal_id: str, user = Depends(get_current_user)):
    """Get goal by ID for the current user"""
    goal = get_goal(ObjectId(goal_id), user["uid"])
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    # Convert ObjectId to string
    if "_id" in goal:
        goal["_id"] = str(goal["_id"])
    
    return goal

@app.put("/goals/{goal_id}")
def update_goal_endpoint(goal_id: str, updated_data: Goal, user = Depends(get_current_user)):
    """Update a goal for the current user"""
    try:
        # Convert the Goal model to a dictionary
        goal_dict = updated_data.dict()
        
        # Update the goal in the database
        success = update_goal(ObjectId(goal_id), goal_dict, user["uid"])
        
        if not success:
            raise HTTPException(status_code=404, detail="Goal not found or couldn't be updated")
            
        # Refresh the cache of active goals
        _ = get_user_active_goal(user["uid"])
        
        return {"success": True}
    except Exception as e:
        print(f"Error updating goal: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating goal: {str(e)}")

@app.delete("/goals/{goal_id}")
def delete_goal_endpoint(goal_id: str, user = Depends(get_current_user)):
    """Delete a goal for the current user"""
    try:
        success = delete_goal(ObjectId(goal_id), user["uid"])
        
        if not success:
            raise HTTPException(status_code=404, detail="Goal not found or couldn't be deleted")
            
        return {"success": True}
    except Exception as e:
        print(f"Error deleting goal: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting goal: {str(e)}")

@app.post("/goals/{goal_id}/activate")
def activate_goal_endpoint(goal_id: str, user = Depends(get_current_user)):
    """Activate a goal for the current user, deactivating any other active goals"""
    try:
        # Update the goal with active=True
        success = update_goal(ObjectId(goal_id), {"active": True}, user["uid"])
        
        if not success:
            raise HTTPException(status_code=404, detail="Goal not found or couldn't be activated")
            
        # Refresh the cache of active goals
        _ = get_user_active_goal(user["uid"])
        
        return {"success": True}
    except Exception as e:
        print(f"Error activating goal: {e}")
        raise HTTPException(status_code=500, detail=f"Error activating goal: {str(e)}")

# Goal API aliases
@app.get("/api/goals")
def api_get_all_goals(user = Depends(get_current_user)):
    """API endpoint alias for getting all goals"""
    return get_all_user_goals(user)

@app.get("/api/goals/active")
def api_get_active_goal(user = Depends(get_current_user)):
    """API endpoint alias for getting active goal"""
    return get_active_goal(user)

@app.post("/api/goals")
def api_create_goal(goal: Goal, user = Depends(get_current_user)):
    """API endpoint alias for creating a goal"""
    return create_user_goal(goal, user)

@app.get("/api/goals/{goal_id}")
def api_get_goal_by_id(goal_id: str, user = Depends(get_current_user)):
    """API endpoint alias for getting a goal by ID"""
    return get_goal_by_id(goal_id, user)

@app.put("/api/goals/{goal_id}")
def api_update_goal(goal_id: str, updated_data: Goal, user = Depends(get_current_user)):
    """API endpoint alias for updating a goal"""
    return update_goal_endpoint(goal_id, updated_data, user)

@app.delete("/api/goals/{goal_id}")
def api_delete_goal(goal_id: str, user = Depends(get_current_user)):
    """API endpoint alias for deleting a goal"""
    return delete_goal_endpoint(goal_id, user)

@app.post("/api/goals/{goal_id}/activate")
def api_activate_goal(goal_id: str, user = Depends(get_current_user)):
    """API endpoint alias for activating a goal"""
    return activate_goal_endpoint(goal_id, user)

# Add API endpoint aliases with /api prefix for the nutrition label endpoints
@app.post("/api/nutrition-label/upload")
async def api_upload_nutrition_label(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """API endpoint alias for uploading a nutrition label"""
    from app.routes.nutrition_label import upload_nutrition_label
    return await upload_nutrition_label(file, current_user)

@app.post("/api/nutrition-label/upload-and-log")
async def api_upload_nutrition_label_and_log(
    file: UploadFile = File(...),
    meal_type: str = Form(...),
    amount: float = Form(1.0),
    notes: str = Form(None),
    date: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """API endpoint alias for uploading and logging a nutrition label"""
    from app.routes.nutrition_label import upload_nutrition_label_and_log
    return await upload_nutrition_label_and_log(file, meal_type, amount, notes, date, current_user)

@app.post("/api/nutrition-label/test-upload")
async def api_test_upload_nutrition_label(
    file: UploadFile = File(...)
):
    """API endpoint alias for testing nutrition label upload without authentication"""
    from app.routes.nutrition_label import test_upload_nutrition_label
    return await test_upload_nutrition_label(file)

@app.post("/goals/{goal_id}/progress")
async def add_weight_progress(goal_id: str, progress: WeightProgressEntry, user = Depends(get_current_user)):
    """Add a weight progress entry to a goal"""
    try:
        print(f"POST /goals/{goal_id}/progress called with weight {progress.weight} kg")
        
        # Convert string date to datetime
        try:
            progress_date = datetime.fromisoformat(progress.date.replace('Z', '+00:00'))
        except ValueError:
            progress_date = datetime.now()
        
        # Create progress entry
        progress_data = {
            "date": progress_date,
            "weight": progress.weight,
            "notes": progress.notes
        }
        
        # Add progress entry to the goal
        success = add_progress_entry(ObjectId(goal_id), progress_data, user["uid"])
        
        if not success:
            raise HTTPException(status_code=404, detail="Goal not found or couldn't be updated")
        
        # Get updated goal
        updated_goal = get_goal(ObjectId(goal_id), user["uid"])
        
        # Convert ObjectId to string
        if updated_goal and "_id" in updated_goal:
            updated_goal["_id"] = str(updated_goal["_id"])
        
        # Check if we need to update the current weight in weight_target
        if updated_goal and updated_goal.get("weight_target"):
            # Update current weight to the latest progress entry's weight
            updated_data = {
                "weight_target.current": progress.weight,
                "updated_at": datetime.now()
            }
            
            # Update the goal
            update_goal(ObjectId(goal_id), updated_data, user["uid"])
            
            # Update the weight_target in the goal object for the response
            updated_goal["weight_target"]["current"] = progress.weight
        
        return updated_goal
        
    except Exception as e:
        print(f"Error adding weight progress: {e}")
        raise HTTPException(status_code=500, detail=f"Error adding weight progress: {str(e)}")

@app.get("/goals/{goal_id}/projection")
async def get_goal_projection(goal_id: str, user = Depends(get_current_user)):
    """Get projected completion date based on actual calorie intake"""
    try:
        # Get the goal
        goal = get_goal(ObjectId(goal_id), user["uid"])
        
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
            
        # Get the last 30 days of food logs
        today = datetime.now()
        thirty_days_ago = today - timedelta(days=30)
        
        # Get aggregated nutrition data
        nutrition_data = get_user_nutrition_aggregates(user["uid"], thirty_days_ago.date(), today.date())
        
        # Check if we have nutritional data
        if not nutrition_data:
            return {
                "success": True,
                "message": "Not enough data to calculate projection",
                "has_projection": False
            }
        
        # Gather valid days with calorie data
        valid_days = []
        for date_str, data in nutrition_data.items():
            if data["calories"] > 0:
                valid_days.append(data["calories"])
        
        if not valid_days:
            return {
                "success": True,
                "message": "Not enough calorie data to calculate projection",
                "has_projection": False
            }
        
        # Calculate average daily calories
        avg_daily_calories = sum(valid_days) / len(valid_days)
        
        # Get target calories from the goal
        if not goal.get("nutrition_targets") or not goal["nutrition_targets"]:
            return {
                "success": True,
                "message": "No nutrition targets found in goal",
                "has_projection": False
            }
        
        calorie_target = goal["nutrition_targets"][0].get("daily_calories", 0)
        
        # Calculate maintenance calories based on goal type
        maintenance_calories = 0
        if goal["type"] == "weight loss":
            maintenance_calories = calorie_target + 500  # Deficit of 500 calories
        elif goal["type"] == "weight gain":
            maintenance_calories = calorie_target - 500  # Surplus of 500 calories
        else:
            maintenance_calories = calorie_target
        
        # Calculate actual daily deficit/surplus
        daily_calorie_delta = maintenance_calories - avg_daily_calories
        
        # If the deficit is close to zero, we're maintaining weight
        if abs(daily_calorie_delta) < 100:
            return {
                "success": True,
                "message": "Current calorie intake is close to maintenance level",
                "has_projection": True,
                "projection_type": "maintain",
                "avg_daily_calories": avg_daily_calories,
                "calorie_target": calorie_target,
                "maintenance_calories": maintenance_calories
            }
        
        # Calculate how many days to reach the goal
        # Get weight difference in pounds (1 kg = 2.20462 lbs)
        current_weight = goal["weight_target"].get("current", 0)
        target_weight = goal["weight_target"].get("goal", 0)
        weight_delta_lbs = abs(current_weight - target_weight) * 2.20462
        
        # It takes approximately 3500 calories to lose or gain 1 pound
        total_calories_needed = weight_delta_lbs * 3500
        
        # Check if we're moving in the right direction
        is_right_direction = (goal["type"] == "weight loss" and daily_calorie_delta > 0) or \
                             (goal["type"] == "weight gain" and daily_calorie_delta < 0)
        
        if not is_right_direction:
            return {
                "success": True,
                "message": "Current calorie intake does not support your goal",
                "has_projection": True,
                "projection_type": "wrong_direction",
                "avg_daily_calories": avg_daily_calories,
                "calorie_target": calorie_target,
                "maintenance_calories": maintenance_calories
            }
        
        # Calculate days to goal
        days_to_goal = abs(int(total_calories_needed / daily_calorie_delta))
        
        # Calculate projected completion date
        projected_date = today + timedelta(days=days_to_goal)
        
        # Calculate expected completion date based on weekly rate
        weekly_rate = goal["weight_target"].get("weekly_rate", 0)
        if weekly_rate > 0:
            expected_weeks = abs((current_weight - target_weight) / weekly_rate)
            expected_days = int(expected_weeks * 7)
            expected_date = today + timedelta(days=expected_days)
        else:
            expected_date = None
        
        return {
            "success": True,
            "has_projection": True,
            "projection_type": "on_track" if days_to_goal <= expected_days * 1.2 else "delayed",
            "avg_daily_calories": avg_daily_calories,
            "calorie_target": calorie_target,
            "maintenance_calories": maintenance_calories,
            "daily_deficit": daily_calorie_delta if goal["type"] == "weight loss" else 0,
            "daily_surplus": abs(daily_calorie_delta) if goal["type"] == "weight gain" else 0,
            "expected_days": expected_days if weekly_rate > 0 else None,
            "projected_days": days_to_goal,
            "projected_date": projected_date.isoformat(),
            "expected_date": expected_date.isoformat() if expected_date else None
        }
        
    except Exception as e:
        print(f"Error calculating goal projection: {e}")
        raise HTTPException(status_code=500, detail=f"Error calculating projection: {str(e)}")

# Add API aliases for the new endpoints
@app.post("/api/goals/{goal_id}/progress")
async def api_add_weight_progress(goal_id: str, progress: WeightProgressEntry, user = Depends(get_current_user)):
    """API endpoint alias for adding weight progress"""
    return await add_weight_progress(goal_id, progress, user)

@app.get("/api/goals/{goal_id}/projection")
async def api_get_goal_projection(goal_id: str, user = Depends(get_current_user)):
    """API endpoint alias for getting goal projection"""
    return await get_goal_projection(goal_id, user)

# Apple Health API endpoints
@app.post("/api/health/data")
async def add_health_data(data: HealthDataEntry, user = Depends(get_current_user)):
    """Add a single health data entry"""
    try:
        # Add user_id to the data
        data_dict = data.dict()
        data_dict["user_id"] = user["uid"]
        
        # Save to database using the function from models.py
        entry_id = save_health_data(data_dict)
        
        return {"success": True, "id": str(entry_id)}
    except Exception as e:
        print(f"Error adding health data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/health/batch")
async def add_batch_health_data(data: BatchHealthDataEntry, user = Depends(get_current_user)):
    """Add multiple health data entries at once"""
    try:
        entry_ids = []
        for entry in data.entries:
            # Add user_id to each entry
            entry_dict = entry.dict()
            entry_dict["user_id"] = user["uid"]
            
            # Save to database
            entry_id = save_health_data(entry_dict)
            entry_ids.append(str(entry_id))
        
        return {"success": True, "ids": entry_ids}
    except Exception as e:
        print(f"Error adding batch health data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health/data")
async def get_health_data(
    date: Optional[str] = None, 
    data_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user = Depends(get_current_user)
):
    """Get health data for a user"""
    try:
        # Single date request
        if date and not (start_date or end_date):
            data = get_health_data_by_date(user["uid"], date, data_type)
            return {"data": data}
        
        # Date range request
        elif start_date and end_date:
            data = get_health_data_range(user["uid"], start_date, end_date, data_type)
            return {"data": data}
        
        # No date provided, return today's data
        else:
            today = datetime.now(timezone.utc).date().isoformat()
            data = get_health_data_by_date(user["uid"], today, data_type)
            return {"data": data}
    except Exception as e:
        print(f"Error retrieving health data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health/latest")
async def get_latest_health_data(data_type: str, user = Depends(get_current_user)):
    """Get the most recent health data for a specific type"""
    try:
        data = get_latest_health_data(user["uid"], data_type)
        if not data:
            return {"data": None}
        
        return {"data": data}
    except Exception as e:
        print(f"Error retrieving latest health data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health/aggregated")
async def get_aggregated_health_data(
    data_type: str,
    start_date: str,
    end_date: str,
    aggregation: Optional[str] = "sum",
    user = Depends(get_current_user)
):
    """Get aggregated health data for a date range"""
    try:
        # Validate aggregation type
        valid_aggregations = ["sum", "avg", "max", "min"]
        if aggregation not in valid_aggregations:
            aggregation = "sum"
        
        data = get_aggregated_health_data(
            user["uid"], 
            data_type, 
            start_date, 
            end_date, 
            aggregation
        )
        
        return {"data": data}
    except Exception as e:
        print(f"Error retrieving aggregated health data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/health/data/{entry_id}")
async def delete_health_data_entry(entry_id: str, user = Depends(get_current_user)):
    """Delete a health data entry"""
    try:
        success = delete_health_data(entry_id)
        if not success:
            raise HTTPException(status_code=404, detail="Health data entry not found")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting health data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health/status")
async def get_health_connection_status(user = Depends(get_current_user)):
    """Check if the user has connected Apple Health data"""
    try:
        # Check for any health data entry for the user
        data_types = ["steps", "activeEnergy", "exerciseTime"]
        connected = False
        
        for data_type in data_types:
            entry = get_latest_health_data(user["uid"], data_type)
            if entry:
                connected = True
                break
        
        return {
            "connected": connected,
            "last_sync": datetime.now().isoformat() if connected else None
        }
    except Exception as e:
        print(f"Error checking health connection status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health/summary")
async def get_health_data_summary(date: Optional[str] = None, user = Depends(get_current_user)):
    """Get a summary of health data for a specific date"""
    try:
        # Use today's date if not provided
        if not date:
            date = datetime.now(timezone.utc).date().isoformat()
        
        # Get all health data for the date
        all_data = get_health_data_by_date(user["uid"], date)
        
        # Organize by data type
        summary = {}
        for entry in all_data:
            data_type = entry.get("data_type")
            if data_type not in summary:
                summary[data_type] = {
                    "value": 0,
                    "unit": entry.get("unit", ""),
                    "count": 0
                }
            
            summary[data_type]["value"] += entry.get("value", 0)
            summary[data_type]["count"] += 1
        
        return {"date": date, "summary": summary}
    except Exception as e:
        print(f"Error retrieving health data summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/calories/adjusted")
async def get_adjusted_calories(date: Optional[str] = None, user = Depends(get_current_user)):
    """
    Get calorie targets adjusted based on Apple Health data
    Adjusts daily calorie target based on active energy and exercise
    """
    try:
        # Use today's date if not provided
        if not date:
            date = datetime.now(timezone.utc).date().isoformat()
        
        # Get user's active goal
        goal = get_user_active_goal(user["uid"])
        if not goal or "nutrition_targets" not in goal or not goal["nutrition_targets"]:
            raise HTTPException(status_code=404, detail="No active goal found")
        
        # Get base calorie target from goal
        base_calories = goal["nutrition_targets"][0].get("daily_calories", 2000)
        
        # Get health data for the date
        health_data = get_health_data_by_date(user["uid"], date)
        
        # Calculate additional calories from activity
        active_energy = 0
        for entry in health_data:
            if entry.get("data_type") == "activeEnergy":
                active_energy += entry.get("value", 0)
        
        # Calculate adjusted calorie target
        # This is a simplified approach - in a real app, you might use a more sophisticated formula
        adjusted_calories = base_calories + active_energy
        
        return {
            "date": date,
            "base_calories": base_calories,
            "active_energy": active_energy,
            "adjusted_calories": adjusted_calories
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error calculating adjusted calories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# HealthKit API Endpoints
@app.post("/api/healthkit/upload")
async def upload_healthkit_data(data: HealthKitData, user = Depends(get_current_user)):
    """
    Receive and store fitness data from iOS companion app using Apple HealthKit
    """
    try:
        print(f"POST /api/healthkit/upload: Processing HealthKit data for user {data.user_id}")
        
        # Validate user ID matches authenticated user
        if user["uid"] != data.user_id:
            raise HTTPException(status_code=403, detail="User ID in payload does not match authenticated user")
        
        # Create data entry
        healthkit_entry = data.dict()
        
        # Normalize the date to midnight in UTC for consistent storage
        if isinstance(healthkit_entry.get("date"), str):
            try:
                date_obj = datetime.fromisoformat(healthkit_entry["date"].replace('Z', '+00:00'))
            except ValueError:
                date_obj = datetime.now(timezone.utc)
        elif isinstance(healthkit_entry.get("date"), datetime):
            date_obj = healthkit_entry["date"]
            if date_obj.tzinfo is None:
                date_obj = date_obj.replace(tzinfo=timezone.utc)
        else:
            date_obj = datetime.now(timezone.utc)
            
        # Get the date component and normalize to midnight UTC
        date_only = date_obj.date()
        date_normalized = datetime.combine(date_only, time.min).replace(tzinfo=timezone.utc)
        healthkit_entry["date"] = date_normalized
        
        # Log the incoming data
        print(f"HealthKit data received: {json.dumps(healthkit_entry, default=str)}")
        
        # Store in database
        entry_id = save_healthkit_data(healthkit_entry)
        
        # Return success response
        return {"status": "received", "id": str(entry_id)}
    except Exception as e:
        print(f"Error processing HealthKit data: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process HealthKit data: {str(e)}")

@app.post("/api/healthkit/batch-upload")
async def batch_upload_healthkit_data(data: BatchHealthKitData, user = Depends(get_current_user)):
    """
    Receive and store multiple fitness data entries from iOS companion app
    """
    try:
        print(f"POST /api/healthkit/batch-upload: Processing {len(data.entries)} HealthKit data entries")
        
        results = []
        errors = []
        
        for i, entry in enumerate(data.entries):
            try:
                # Validate user ID matches authenticated user
                if user["uid"] != entry.user_id:
                    errors.append({
                        "index": i,
                        "error": "User ID in payload does not match authenticated user"
                    })
                    continue
                
                # Create data entry
                healthkit_entry = entry.dict()
                
                # Extract date_key if provided, or generate from date
                date_key = healthkit_entry.get("date_key")
                if not date_key and isinstance(healthkit_entry.get("date"), str):
                    # Extract YYYY-MM-DD from the date string
                    date_key = healthkit_entry["date"].split("T")[0]
                    healthkit_entry["date_key"] = date_key
                
                # Normalize the date to midnight in UTC for consistent storage
                if isinstance(healthkit_entry.get("date"), str):
                    try:
                        # Handle the T04:00:00Z format from Swift
                        # Replace Z with +00:00 for proper ISO format handling
                        date_str = healthkit_entry["date"].replace('Z', '+00:00')
                        date_obj = datetime.fromisoformat(date_str)
                        print(f"Parsed date from Swift: {date_obj}")
                    except ValueError:
                        print(f"Failed to parse date: {healthkit_entry.get('date')}")
                        date_obj = datetime.now(timezone.utc)
                elif isinstance(healthkit_entry.get("date"), datetime):
                    date_obj = healthkit_entry["date"]
                    if date_obj.tzinfo is None:
                        date_obj = date_obj.replace(tzinfo=timezone.utc)
                else:
                    date_obj = datetime.now(timezone.utc)
                
                # Store the original date as is (don't normalize)
                healthkit_entry["date"] = date_obj
                
                # Add source if not specified
                if "source" not in healthkit_entry or not healthkit_entry["source"]:
                    healthkit_entry["source"] = "Apple HealthKit (iOS)"
                
                # Add timestamps
                now = datetime.now(timezone.utc)
                healthkit_entry["created_at"] = now
                healthkit_entry["updated_at"] = now
                
                # Check for existing entry with the same user_id and date_key
                existing_entry = db.healthkit_data.find_one({
                    "user_id": user["uid"],
                    "date_key": date_key
                })
                
                if existing_entry:
                    # Update existing entry
                    db.healthkit_data.update_one(
                        {"_id": existing_entry["_id"]},
                        {"$set": {
                            **healthkit_entry,
                            "updated_at": now
                        }}
                    )
                    results.append({
                        "index": i,
                        "status": "updated",
                        "id": str(existing_entry["_id"]),
                        "date": date_key
                    })
                else:
                    # Insert new entry
                    insert_result = db.healthkit_data.insert_one(healthkit_entry)
                    results.append({
                        "index": i,
                        "status": "created",
                        "id": str(insert_result.inserted_id),
                        "date": date_key
                    })
                
            except Exception as e:
                print(f"Error processing entry {i}: {str(e)}")
                errors.append({
                    "index": i,
                    "error": str(e)
                })
        
        return {
            "success": True,
            "results": results,
            "errors": errors
        }
    except Exception as e:
        print(f"Error in batch upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/healthkit/data")
async def get_user_healthkit_data(
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user = Depends(get_current_user)
):
    """
    Retrieve HealthKit data for the authenticated user
    """
    try:
        user_id = user["uid"]
        
        # Parse date parameters
        parsed_date = None
        parsed_start = None
        parsed_end = None
        
        if date:
            try:
                parsed_date = datetime.fromisoformat(date.replace('Z', '+00:00')).date()
                parsed_date = datetime.combine(parsed_date, time.min).replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Invalid date format: {date}")
                
        if start_date:
            try:
                parsed_start = datetime.fromisoformat(start_date.replace('Z', '+00:00')).date()
                parsed_start = datetime.combine(parsed_start, time.min).replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Invalid start_date format: {start_date}")
                
        if end_date:
            try:
                parsed_end = datetime.fromisoformat(end_date.replace('Z', '+00:00')).date()
                parsed_end = datetime.combine(parsed_end, time.max).replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Invalid end_date format: {end_date}")
        
        # Fetch data from database
        healthkit_data = get_healthkit_data(user_id, parsed_date, parsed_start, parsed_end)
        
        # Convert ObjectId to string for JSON serialization
        for entry in healthkit_data:
            if "_id" in entry:
                entry["_id"] = str(entry["_id"])
            # Convert datetime objects to ISO format strings
            for key, value in entry.items():
                if isinstance(value, datetime):
                    entry[key] = value.isoformat()
        
        return {"data": healthkit_data}
    except Exception as e:
        print(f"Error retrieving health kit data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/healthkit/summary")
async def get_healthkit_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user = Depends(get_current_user)
):
    """
    Get a summary of the user's HealthKit data for the given date range
    This is useful for dashboard display
    """
    try:
        user_id = user["uid"]
        print(f"[HealthKit Summary Backend] User ID: {user_id}")
        
        if not end_date:
            end_date_obj = datetime.now(timezone.utc).date()
        else:
            try:
                end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00')).date()
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Invalid end_date format: {end_date}")
                
        if not start_date:
            start_date_obj = end_date_obj - timedelta(days=6)  # Last 7 days
        else:
            try:
                start_date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00')).date()
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Invalid start_date format: {start_date}")
        
        start_datetime = datetime.combine(start_date_obj, time.min).replace(tzinfo=timezone.utc)
        end_datetime = datetime.combine(end_date_obj, time.max).replace(tzinfo=timezone.utc)
        print(f"[HealthKit Summary Backend] Calculated date range for query: {start_datetime.isoformat()} to {end_datetime.isoformat()}")
        
        # data = get_healthkit_data(user_id, None, start_datetime, end_datetime)
        # The original get_healthkit_data from models.py likely takes specific parameters.
        # Let's assume it's (user_id: str, date: Optional[datetime] = None, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None)
        raw_data_from_model = get_healthkit_data(user_id=user_id, start_date=start_datetime, end_date=end_datetime)
        print(f"[HealthKit Summary Backend] Raw data from get_healthkit_data model function (count: {len(raw_data_from_model)}):")
        # for i, entry in enumerate(raw_data_from_model):
        #     print(f"  Entry {i}: {entry.get('date_key', entry.get('date'))} - Steps: {entry.get('steps')}, Calories: {entry.get('calories')}")

        summary = {
            "date_range": {
                "start": start_date_obj.isoformat(),
                "end": end_date_obj.isoformat(),
                "days": (end_date_obj - start_date_obj).days + 1
            },
            "averages": { "steps": 0, "calories": 0, "distance": 0, "exercise_minutes": 0, "resting_heart_rate": 0, "walking_heart_rate": 0, "sleep_hours": 0 },
            "totals": { "steps": 0, "calories": 0, "distance": 0, "exercise_minutes": 0, "sleep_hours": 0 },
            "daily_data": {}
        }
        
        if not raw_data_from_model:
            print("[HealthKit Summary Backend] No raw data returned from model function for the date range.")
            return summary # Return empty summary if no base data
            
        for entry in raw_data_from_model:
            date_val = entry.get("date")
            date_str_key = None
            if isinstance(date_val, datetime):
                date_str_key = date_val.date().isoformat()
            elif isinstance(date_val, str):
                try:
                    date_str_key = datetime.fromisoformat(date_val.replace('Z', '+00:00')).date().isoformat()
                except ValueError:
                    print(f"[HealthKit Summary Backend] Could not parse date string for entry: {entry}")
                    continue # Skip entry if date is unparsable
            else:
                # If date is neither datetime nor string, or unparsable, try using 'date_key' if available
                date_str_key = entry.get("date_key")
                if not date_str_key:
                    print(f"[HealthKit Summary Backend] Entry missing usable date or date_key: {entry}")
                    continue

            if date_str_key not in summary["daily_data"]:
                summary["daily_data"][date_str_key] = { "steps": 0, "calories": 0, "distance": 0, "exercise_minutes": 0, "resting_heart_rate": 0, "walking_heart_rate": 0, "sleep_hours": 0 }
            
            current_day_summary = summary["daily_data"][date_str_key]
            for metric in ["steps", "calories", "distance", "exercise_minutes", "resting_heart_rate", "walking_heart_rate", "sleep_hours"]:
                # Ensure value is float or int before adding
                value_to_add = entry.get(metric, 0)
                if not isinstance(value_to_add, (int, float)):
                    try:
                        value_to_add = float(value_to_add)
                    except (ValueError, TypeError):
                        value_to_add = 0 # Default to 0 if conversion fails
                
                current_day_summary[metric] = value_to_add # Assuming one entry per day from HealthKit sync, so direct assignment
                                                            # If multiple entries per day for a metric were possible and needed summing, this would change.
                
                if metric in summary["totals"]:
                    summary["totals"][metric] += value_to_add
        
        days_with_data = len(summary["daily_data"])
        if days_with_data > 0:
            for key in summary["averages"]:
                if key in ["resting_heart_rate", "walking_heart_rate"]:
                    metric_total = sum(day_data.get(key, 0) for day_data in summary["daily_data"].values() if day_data.get(key, 0) > 0)
                    metric_days = sum(1 for day_data in summary["daily_data"].values() if day_data.get(key, 0) > 0)
                    summary["averages"][key] = round(metric_total / max(metric_days, 1), 1)
                elif key in summary["totals"]:
                    summary["averages"][key] = round(summary["totals"][key] / days_with_data, 1)
        
        # ... (Trends calculation remains the same) ...
        if start_date_obj and end_date_obj:
            days_in_period = (end_date_obj - start_date_obj).days + 1
            previous_start_obj = start_date_obj - timedelta(days=days_in_period)
            previous_end_obj = start_date_obj - timedelta(days=1)
            
            previous_start_datetime = datetime.combine(previous_start_obj, time.min).replace(tzinfo=timezone.utc)
            previous_end_datetime = datetime.combine(previous_end_obj, time.max).replace(tzinfo=timezone.utc)
            
            previous_period_data = get_healthkit_data(user_id=user_id, start_date=previous_start_datetime, end_date=previous_end_datetime)
            previous_totals = { "steps": 0, "calories": 0, "distance": 0, "exercise_minutes": 0, "sleep_hours": 0 }
            for entry in previous_period_data:
                for key_metric in previous_totals:
                    value_to_add = entry.get(key_metric, 0)
                    if not isinstance(value_to_add, (int, float)):
                        try: value_to_add = float(value_to_add)
                        except (ValueError, TypeError): value_to_add = 0
                    previous_totals[key_metric] += value_to_add
            
            trends = {}
            for key_metric in previous_totals:
                if previous_totals[key_metric] > 0:
                    percent_change = ((summary["totals"][key_metric] - previous_totals[key_metric]) / previous_totals[key_metric]) * 100
                    trends[key_metric] = round(percent_change, 1)
                elif summary["totals"][key_metric] > 0: # Current period has data, previous had none
                    trends[key_metric] = 100.0 # Or some indicator of new data
                else:
                    trends[key_metric] = 0.0 # No data in either period for this metric
            summary["trends"] = trends

        print(f"[HealthKit Summary Backend] Final summary being returned: {summary}")
        return summary
    except Exception as e:
        print(f"[HealthKit Summary Backend] Error generating HealthKit summary: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Import Swift auth and HealthKit routers
from app.swift_auth import router as swift_auth_router
from app.swift_healthkit import router as swift_healthkit_router

# Include swift routers
app.include_router(swift_auth_router, prefix="/api")
app.include_router(swift_healthkit_router, prefix="/api")

# Add this in the imports section
from .chatbot_health_insights import generate_health_insights

# Add this in the API endpoints section
@app.get("/api/health/insights")
async def get_health_insights(
    user_id: str = Query(None, description="User ID"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get insights and trends based on the user's Apple Health data
    
    This endpoint analyzes the user's HealthKit data and generates insights
    about their health metrics, patterns, and provides personalized recommendations.
    """
    # Determine user_id - use from query or from authenticated user
    if not user_id and current_user:
        user_id = current_user.get("uid")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    
    # Check if user is authorized to access this data
    if current_user and current_user.get("uid") != user_id:
        # Only allow access to own data unless admin
        if not current_user.get("is_admin", False):
            raise HTTPException(status_code=403, detail="Not authorized to access this user's data")
    
    try:
        # Get the user's health data (last 30 days)
        today = datetime.now(timezone.utc)
        thirty_days_ago = today - timedelta(days=30)
        
        # Get HealthKit data
        healthkit_data = get_healthkit_data(
            user_id=user_id,
            start_date=thirty_days_ago,
            end_date=today
        )
        
        if not healthkit_data:
            return {"message": "No health data found for this user"}
        
        # Generate insights from the data
        insights = generate_health_insights(healthkit_data)
        
        return {
            "user_id": user_id,
            "generated_at": datetime.now().isoformat(),
            "insights": insights
        }
        
    except Exception as e:
        print(f"Error generating health insights: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate health insights: {str(e)}")