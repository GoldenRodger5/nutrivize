from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone, time, timedelta
from typing import List, Optional, Dict, Any
from bson import ObjectId
import json
from app.models import (
    # Food index functions
    add_food_item, get_food_item, update_food_item, delete_food_item, search_food_items,
    # Food log functions
    log_food, get_user_food_logs_by_date, update_food_log_entry, delete_food_log_entry,
    # Goal functions
    create_goal, get_user_active_goal, update_goal, add_nutrition_target, get_user_nutrition_aggregates,
    get_user_all_goals, get_goal, delete_goal
)
from app.chatbot import router as chatbot_router
from app.meal_suggestions_improved import (
    MealSuggestionRequest, MealSuggestionResponse, 
    MealSuggestion, get_meal_suggestions, RemainingMacros
)
from app.meal_plans import MealPlanRequest, generate_meal_plan, generate_single_day_meal_plan, get_active_plan, log_meal_from_plan, get_user_meal_plans
from app.insights import router as insights_router
from app.auth import UserLogin, UserRegistration, login_user, register_user, get_current_user
import os
from dotenv import load_dotenv
from app.database import test_connection, get_database
from app.debug_routes import router as debug_router

# Load environment variables at the very beginning
load_dotenv()

# Check if API key is loaded
anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
print(f"Anthropic API Key loaded: {'Yes' if anthropic_key else 'No'}")

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:3001"],  # Allow both Vite and React ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Routes
@app.get("/")
def read_root():
    return {"message": "Nutrivize API is running"}

# Authentication routes
@app.post("/auth/register", tags=["authentication"])
async def register(user_data: UserRegistration):
    return await register_user(user_data)

@app.post("/auth/login", tags=["authentication"])
async def login(user_data: UserLogin):
    return await login_user(user_data)

@app.get("/auth/me", tags=["authentication"])
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    return {
        "uid": current_user.get("uid"),
        "email": current_user.get("email"),
        "name": current_user.get("name"),
        "preferences": current_user.get("preferences", {})
    }

# Food Items
@app.post("/foods/")
def create_food(food: FoodItem, current_user: dict = Depends(get_current_user)):
    food_dict = food.dict()
    food_dict["created_by"] = current_user.get("uid")
    food_id = add_food_item(food_dict)
    return {"id": str(food_id)}

@app.get("/foods/")
def get_foods(query: Optional[str] = "", current_user: dict = Depends(get_current_user)):
    # Only show foods created by this user or system foods
    foods = search_food_items(query, user_id=current_user.get("uid"))
    return jsonify(foods)

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
def create_log(log: FoodLogEntry, current_user: dict = Depends(get_current_user)):
    log_dict = log.dict()
    
    # Set user_id from the authenticated user
    log_dict["user_id"] = current_user.get("uid")
    
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
    
    print(f"Storing log with normalized date: {date_normalized.isoformat()}")
    
    # Store in database
    log_id = log_food(log_dict)
    return {"id": str(log_id)}

@app.get("/logs")
async def get_logs(date: str = None, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("uid")
    print(f"Fetching logs for user {user_id} on date {date}")
    try:
        if date:
            try:
                # Try to parse the full ISO datetime with timezone info
                date_obj = datetime.fromisoformat(date.replace('Z', '+00:00')).date()
            except ValueError:
                try:
                    # Fall back to just the date portion
                    date_obj = datetime.strptime(date, "%Y-%m-%d").date()
                except ValueError:
                    print(f"Could not parse date: {date}, using today instead")
                    date_obj = datetime.now(timezone.utc).date()
        else:
            date_obj = datetime.now(timezone.utc).date()
        
        print(f"Fetching logs for date: {date_obj.isoformat()}")
        logs = get_user_food_logs_by_date(user_id, date_obj)
        return {"logs": logs}
    except Exception as e:
        print(f"Error processing logs request: {str(e)}")
        return {"error": str(e), "logs": []}

@app.get("/logs/range")
async def get_logs_range(start_date: str, end_date: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("uid")
    print(f"Fetching logs for user {user_id} from {start_date} to {end_date}")
    try:
        # Parse dates with proper error handling
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00')).date()
        except ValueError:
            # Fall back to YYYY-MM-DD format
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            
        try:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00')).date()
        except ValueError:
            # Fall back to YYYY-MM-DD format
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        # Ensure start date is not after end date
        if start > end:
            return {"error": "Start date cannot be after end date"}
        
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
    except Exception as e:
        print(f"Error processing logs range request: {str(e)}")
        return {"error": str(e)}

@app.put("/logs/{log_id}")
def update_log(log_id: str, log: FoodLogEntry, current_user: dict = Depends(get_current_user)):
    # Pass the user_id to ensure the user owns the log
    success = update_food_log_entry(ObjectId(log_id), log.dict(), current_user.get("uid"))
    if not success:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"success": True}

@app.delete("/logs/{log_id}")
def delete_log(log_id: str, current_user: dict = Depends(get_current_user)):
    # Pass the user_id to ensure the user owns the log
    success = delete_food_log_entry(ObjectId(log_id), current_user.get("uid"))
    if not success:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"success": True}

# Goals
@app.post("/goals/")
def create_user_goal(goal: Goal, current_user: dict = Depends(get_current_user)):
    goal_dict = goal.dict()
    goal_dict["user_id"] = current_user.get("uid")
    goal_dict["start_date"] = datetime.now()
    goal_dict["end_date"] = datetime.now().replace(month=datetime.now().month+1)
    goal_id = create_goal(goal_dict)
    return {"id": str(goal_id)}

@app.get("/goals/active")
def get_active_goal(current_user: dict = Depends(get_current_user)):
    goal = get_user_active_goal(current_user.get("uid"))
    if not goal:
        return {"message": "No active goal found"}
    return jsonify(goal)

@app.get("/goals/")
def get_all_goals(current_user: dict = Depends(get_current_user)):
    goals = get_user_all_goals(current_user.get("uid"))
    return jsonify(goals)

@app.get("/goals/{goal_id}")
def get_goal_by_id(goal_id: str, current_user: dict = Depends(get_current_user)):
    goal = get_goal(ObjectId(goal_id), current_user.get("uid"))
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return jsonify(goal)

@app.put("/goals/{goal_id}")
def update_user_goal(goal_id: str, updated_data: dict, current_user: dict = Depends(get_current_user)):
    success = update_goal(ObjectId(goal_id), updated_data, current_user.get("uid"))
    if not success:
        raise HTTPException(status_code=404, detail="Goal not found or update failed")
    return {"success": True}

@app.delete("/goals/{goal_id}")
def delete_user_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    success = delete_goal(ObjectId(goal_id), current_user.get("uid"))
    if not success:
        raise HTTPException(status_code=404, detail="Goal not found or deletion failed")
    return {"success": True}

@app.post("/goals/{goal_id}/activate")
def activate_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    success = update_goal(ObjectId(goal_id), {"active": True}, current_user.get("uid"))
    if not success:
        raise HTTPException(status_code=404, detail="Goal not found or activation failed")
    return {"success": True}

@app.post("/goals/{goal_id}/targets")
def add_target(goal_id: str, target: NutritionTarget, current_user: dict = Depends(get_current_user)):
    success = add_nutrition_target(ObjectId(goal_id), target.dict(), current_user.get("uid"))
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

# Include routers
app.include_router(chatbot_router, prefix="/api", tags=["chatbot"])
app.include_router(insights_router, prefix="/insights", tags=["insights"])
app.include_router(debug_router, tags=["debug"])

@app.get("/api/nutrition/aggregates/")
async def get_nutrition_aggregates(start_date: str, end_date: str, current_user: dict = Depends(get_current_user)):
    try:
        # Get user ID from authenticated user
        user_id = current_user.get("uid")
        
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

# Add the meal suggestion endpoint
@app.post("/suggest-meal")
async def suggest_meal(request: MealSuggestionRequest, current_user: dict = Depends(get_current_user)):
    """
    Suggest meals based on user's food index and remaining macros.
    
    Args:
        request: The meal suggestion request containing user preferences
        
    Returns:
        A list of meal suggestions with macro breakdowns
    """
    try:
        # Set the user_id in the request
        request.user_id = current_user.get("uid")
        
        print(f"Received meal suggestion request with diet_type: {request.diet_type}, use_food_index_only: {request.use_food_index_only}")
        print(f"Request details: {request.dict()}")
        response = await get_meal_suggestions(request)
        return response
    except Exception as e:
        print(f"Error in meal suggestion endpoint: {e}")
        print(f"Full error details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating meal suggestions: {str(e)}"
        )

# Add the meal plan endpoints
@app.post("/generate-meal-plan")
async def generate_meal_plan_endpoint(request: MealPlanRequest, current_user: dict = Depends(get_current_user)):
    """
    Generate a meal plan based on user preferences.
    
    Args:
        request: The meal plan request containing user preferences
        
    Returns:
        A meal plan with suggested meals for each day
    """
    try:
        # Set the user_id in the request
        request.user_id = current_user.get("uid")
        meal_plan = await generate_meal_plan(request)
        return jsonify(meal_plan)
    except Exception as e:
        print(f"Error in meal plan generation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating meal plan: {str(e)}"
        )

@app.get("/meal-plans/active")
async def get_user_active_plan(current_user: dict = Depends(get_current_user)):
    """
    Get the user's active meal plan.
    
    Returns:
        The user's active meal plan, or None if no active plan exists
    """
    try:
        user_id = current_user.get("uid")
        active_plan = get_active_plan(user_id)
        if not active_plan:
            return {"message": "No active meal plan found"}
        return jsonify(active_plan)
    except Exception as e:
        print(f"Error retrieving active meal plan: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving meal plan: {str(e)}"
        )

@app.post("/meal-plans/{meal_plan_id}/log-meal")
async def log_meal_from_meal_plan(
    meal_plan_id: str,
    day_index: Optional[int] = None,
    meal_type: Optional[str] = None,
    request_data: Optional[Dict[str, Any]] = Body(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Log a meal from a meal plan to the user's food log.
    
    Args:
        meal_plan_id: The ID of the meal plan
        day_index: The index of the day in the plan (0-based) (can be provided in query or body)
        meal_type: The type of meal (breakfast, lunch, dinner, snack) (can be provided in query or body)
        request_data: Optional request body containing parameters
        
    Returns:
        A success message and the log entry details
    """
    try:
        # Use parameters from body if not provided in query
        if request_data:
            day_index = day_index if day_index is not None else request_data.get("day_index")
            meal_type = meal_type or request_data.get("meal_type")
        
        # Get user_id from authenticated user
        user_id = current_user.get("uid")
        
        # Validate required parameters
        if day_index is None:
            raise ValueError("day_index is required")
        if not meal_type:
            raise ValueError("meal_type is required")
        
        print(f"Logging meal: plan={meal_plan_id}, user={user_id}, day={day_index}, meal={meal_type}")
        result = await log_meal_from_plan(user_id, meal_plan_id, day_index, meal_type)
        return result
    except ValueError as e:
        print(f"Value error in log_meal_from_meal_plan: {e}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        print(f"Error logging meal from plan: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error logging meal from meal plan: {str(e)}"
        )

@app.get("/meal-plans/all")
async def get_all_meal_plans(current_user: dict = Depends(get_current_user)):
    """
    Get all meal plans for a user.
    
    Returns:
        A list of all meal plans for the user
    """
    try:
        user_id = current_user.get("uid")
        meal_plans = get_user_meal_plans(user_id)
        # Convert meal plan objects to dictionaries before jsonifying
        meal_plans_dicts = [meal_plan.dict() if hasattr(meal_plan, 'dict') else meal_plan for meal_plan in meal_plans]
        return jsonify(meal_plans_dicts)
    except Exception as e:
        print(f"Error retrieving all meal plans: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving all meal plans: {str(e)}"
        )

@app.get("/meal-plans")
async def get_meal_plans(current_user: dict = Depends(get_current_user)):
    """
    Get all meal plans for the current user.
    
    Returns:
        A list of all meal plans for the current user
    """
    try:
        user_id = current_user.get("uid")
        meal_plans = get_user_meal_plans(user_id)
        return jsonify(meal_plans)
    except Exception as e:
        print(f"Error retrieving meal plans: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving meal plans: {str(e)}"
        ) 