from datetime import datetime, timezone, time
from pymongo import IndexModel, ASCENDING
from .database import get_database
from typing import Optional
from pydantic import BaseModel

db = get_database()

# Collections
users = db["users"]
food_index = db["food_index"]
food_logs = db["food_logs"]
goals = db["goals"]
meal_plans = db["meal_plans"]

# Create indexes for better query performance
users.create_index("email", unique=True)
users.create_index("uid", unique=True)  # Add index for Firebase UID
food_index.create_index("name")
food_logs.create_index([("user_id", ASCENDING), ("date", ASCENDING)])
goals.create_index("user_id")
meal_plans.create_index("user_id")

# Schema definitions (used for validation and documentation)

user_schema = {
    "uid": str,  # Firebase user ID
    "email": str, 
    "name": str,
    "created_at": datetime,
    "updated_at": datetime,
    "preferences": {
        "units": str,  # metric or imperial
        "theme": str,  # light or dark
        "notification_settings": dict
    }
}

food_item_schema = {
    "name": str,
    "serving_size": float,
    "serving_unit": str,
    "calories": float,
    "proteins": float,
    "carbs": float,
    "fats": float,
    "fiber": float,
    "source": str,  # USDA, user-created, etc.
    "created_by": str,  # user_id if user-created, otherwise None for system items
    "image_url": str,
    "barcode": str,
    "tags": list,
    "meal_compatibility": list  # List of meal types this food is suitable for: ["breakfast", "lunch", "dinner", "snack"]
}

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
    notes: Optional[str] = ""  # Add notes field for storing serving info

goal_schema = {
    "user_id": str,
    "start_date": datetime,
    "end_date": datetime,
    "active": bool,
    "type": str,  # weight loss, muscle gain, maintenance
    "weight_target": {
        "current": float,
        "goal": float,
        "weekly_rate": float  # how much to lose/gain per week
    },
    "nutrition_targets": [
        {
            "name": str,  # e.g., "Rest Day", "Training Day", "Weekday", "Weekend"
            "daily_calories": float,
            "proteins": float,
            "carbs": float,
            "fats": float,
            "fiber": float,
            "water": float,
            "applies_to": [str]  # e.g., ["Monday", "Wednesday", "Friday"] or ["Rest"]
        }
    ],
    "progress": [
        {
            "date": datetime,
            "weight": float,
            "notes": str
        }
    ],
    "created_at": datetime,
    "updated_at": datetime
}

# Helper functions for CRUD operations

def create_user(user_data):
    user_data["created_at"] = datetime.now()
    user_data["updated_at"] = datetime.now()
    result = users.insert_one(user_data)
    return result.inserted_id

def add_food_item(food_data):
    result = food_index.insert_one(food_data)
    return result.inserted_id

def delete_food_item(food_id):
    """Delete a food item from the food index by its ID."""
    result = food_index.delete_one({"_id": food_id})
    return result.deleted_count > 0

def update_food_item(food_id, updated_data):
    """
    Update a food item in the food index.
    This will only update the fields provided in updated_data.
    """
    result = food_index.update_one(
        {"_id": food_id},
        {"$set": updated_data}
    )
    return result.modified_count > 0

def get_food_item(food_id):
    """Retrieve a specific food item by its ID."""
    return food_index.find_one({"_id": food_id})

def search_food_items(query, limit=20, user_id=None):
    """
    Search for food items by name (case-insensitive partial match).
    If user_id is provided, it returns only items created by that user or system items.
    """
    try:
        query_filter = {"name": {"$regex": query, "$options": "i"}}
        
        if user_id:
            # Return items created by this user or system items (where created_by is None)
            query_filter = {
                "$and": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"$or": [
                        {"created_by": user_id},
                        {"created_by": None},
                        {"created_by": {"$exists": False}},
                        {"source": {"$ne": "user-created"}}
                    ]}
                ]
            }
        
        print(f"Food search query: {query}, user_id: {user_id}, filter: {query_filter}")
        result = list(food_index.find(query_filter).limit(limit))
        print(f"Found {len(result)} food items")
        return result
    except Exception as e:
        print(f"Error in search_food_items: {str(e)}")
        # Return empty list rather than failing
        return []

def log_food(log_data):
    """Add a food entry to a user's food log."""
    try:
        # Add timestamps
        log_data["created_at"] = datetime.now()
        log_data["updated_at"] = datetime.now()
        
        # Ensure user_id is present
        if "user_id" not in log_data:
            print("Warning: user_id not provided in log_food")
            raise ValueError("user_id is required for food logging")
            
        # Handle date in ISO format
        if "date" in log_data and isinstance(log_data["date"], str):
            try:
                log_data["date"] = datetime.fromisoformat(log_data["date"].replace('Z', '+00:00'))
            except ValueError as e:
                print(f"Error parsing date: {log_data['date']}, {str(e)}")
                # Default to current date if parsing fails
                log_data["date"] = datetime.now(timezone.utc)
        
        # Validate required fields
        required_fields = ["user_id", "food_id", "name", "amount", "unit", "calories"]
        for field in required_fields:
            if field not in log_data:
                print(f"Missing required field: {field}")
                raise ValueError(f"Missing required field: {field}")
        
        print(f"Inserting food log: {log_data}")
        result = food_logs.insert_one(log_data)
        return result.inserted_id
    except Exception as e:
        print(f"Error in log_food: {str(e)}")
        raise

def set_goals(goal_data):
    goal_data["created_at"] = datetime.now()
    goal_data["updated_at"] = datetime.now()
    result = goals.insert_one(goal_data)
    return result.inserted_id

def get_user_food_logs(user_id, start_date=None, end_date=None):
    query = {"user_id": user_id}
    
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        query["date"] = date_query
        
    return list(food_logs.find(query).sort("date", -1))

def get_user_active_goals(user_id):
    return goals.find_one({"user_id": user_id, "active": True})

# Helper functions for food logging

def delete_food_log_entry(log_entry_id, user_id=None):
    """
    Delete a food log entry by its ID.
    If user_id is provided, it ensures only entries belonging to that user are deleted.
    """
    query = {"_id": log_entry_id}
    if user_id:
        query["user_id"] = user_id
    
    result = food_logs.delete_one(query)
    return result.deleted_count > 0

def update_food_log_entry(log_entry_id, updated_data, user_id=None):
    """
    Update a food log entry.
    If user_id is provided, it ensures only entries belonging to that user are updated.
    """
    query = {"_id": log_entry_id}
    if user_id:
        query["user_id"] = user_id
    
    # Always update the updated_at timestamp
    updated_data["updated_at"] = datetime.now()
    
    result = food_logs.update_one(
        query,
        {"$set": updated_data}
    )
    return result.modified_count > 0

def get_food_log_entry(log_entry_id, user_id=None):
    """
    Retrieve a specific food log entry by its ID.
    If user_id is provided, it ensures only entries belonging to that user are returned.
    """
    query = {"_id": log_entry_id}
    if user_id:
        query["user_id"] = user_id
        
    return food_logs.find_one(query)

def get_user_food_logs_by_date(user_id, date):
    """
    Retrieve food logs for a user on a specific date.
    
    Args:
        user_id: The user's ID
        date: A date object or date string (YYYY-MM-DD) representing the day to retrieve logs for
        
    Returns:
        List of food log entries for the specified date
    """
    # Handle date parameter which could be a string or date object
    if isinstance(date, str):
        try:
            # Parse the date string (expected format YYYY-MM-DD)
            date_obj = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            print(f"Invalid date format: {date}, expected YYYY-MM-DD")
            return []
    else:
        # If it's already a date object
        date_obj = date
    
    # Create start and end of the given date in UTC
    # Using time.min (00:00:00) and time.max (23:59:59.999999) ensures we cover the full day
    start_of_day = datetime.combine(date_obj, time.min).replace(tzinfo=timezone.utc)
    end_of_day = datetime.combine(date_obj, time.max).replace(tzinfo=timezone.utc)
    
    print(f"Querying logs between {start_of_day.isoformat()} and {end_of_day.isoformat()}")
    
    logs = list(food_logs.find({
        "user_id": user_id,
        "date": {"$gte": start_of_day, "$lte": end_of_day}
    }))
    
    print(f"Found {len(logs)} logs for user {user_id} on date {date_obj.isoformat()}")
    
    # Convert ObjectId to string for JSON serialization
    for log in logs:
        log["_id"] = str(log["_id"])
        if "date" in log and isinstance(log["date"], datetime):
            log["date"] = log["date"].isoformat()
    
    return logs

def get_user_nutrition_aggregates(user_id, start_date, end_date):
    """
    Calculate aggregated nutritional information for a user over a date range.
    Returns daily totals for calories, proteins, carbs, fats and fiber.
    
    Args:
        user_id: The user's ID
        start_date: Start date (inclusive)
        end_date: End date (inclusive)
        
    Returns:
        Dictionary with dates as keys and nutrition totals as values
    """
    # Create start and end datetime objects in UTC
    start = datetime.combine(start_date, time.min).replace(tzinfo=timezone.utc)
    end = datetime.combine(end_date, time.max).replace(tzinfo=timezone.utc)
    
    # Get all logs in the date range
    logs = list(food_logs.find({
        "user_id": user_id,
        "date": {"$gte": start, "$lte": end}
    }))
    
    # Initialize the result dictionary
    result = {}
    
    # Process logs and calculate totals by date
    for log in logs:
        # Get the date string for easier grouping
        if isinstance(log["date"], datetime):
            date_str = log["date"].date().isoformat()
        else:
            # Skip if date is invalid
            continue
        
        # Initialize the date entry if it doesn't exist
        if date_str not in result:
            result[date_str] = {
                "calories": 0,
                "proteins": 0,
                "carbs": 0, 
                "fats": 0,
                "fiber": 0
            }
        
        # Add the nutritional values
        result[date_str]["calories"] += log.get("calories", 0)
        result[date_str]["proteins"] += log.get("proteins", 0)
        result[date_str]["carbs"] += log.get("carbs", 0)
        result[date_str]["fats"] += log.get("fats", 0)
        result[date_str]["fiber"] += log.get("fiber", 0)
    
    return result

# Helper functions for goals management

def create_goal(goal_data):
    """Create a new goal for a user."""
    goal_data["created_at"] = datetime.now()
    goal_data["updated_at"] = datetime.now()
    
    # Set as active by default if not specified
    if "active" not in goal_data:
        goal_data["active"] = True
        
    # Ensure nutrition_targets exists
    if "nutrition_targets" not in goal_data:
        goal_data["nutrition_targets"] = []
    
    # If setting this goal as active, deactivate any other active goals for this user
    if goal_data.get("active", False):
        goals.update_many(
            {"user_id": goal_data["user_id"], "active": True},
            {"$set": {"active": False}}
        )
    
    result = goals.insert_one(goal_data)
    return result.inserted_id

def delete_goal(goal_id, user_id=None):
    """
    Delete a goal by its ID.
    If user_id is provided, it ensures only goals belonging to that user are deleted.
    """
    query = {"_id": goal_id}
    if user_id:
        query["user_id"] = user_id
    
    result = goals.delete_one(query)
    return result.deleted_count > 0

def update_goal(goal_id, updated_data, user_id=None):
    """
    Update a goal.
    If user_id is provided, it ensures only goals belonging to that user are updated.
    """
    query = {"_id": goal_id}
    if user_id:
        query["user_id"] = user_id
    
    # Always update the updated_at timestamp
    updated_data["updated_at"] = datetime.now()
    
    # If this goal is being set to active, deactivate any other active goals
    if updated_data.get("active", False):
        goals.update_many(
            {"user_id": query.get("user_id"), "_id": {"$ne": goal_id}, "active": True},
            {"$set": {"active": False}}
        )
    
    result = goals.update_one(
        query,
        {"$set": updated_data}
    )
    return result.modified_count > 0

def get_goal(goal_id, user_id=None):
    """
    Retrieve a specific goal by its ID.
    If user_id is provided, it ensures only goals belonging to that user are returned.
    """
    query = {"_id": goal_id}
    if user_id:
        query["user_id"] = user_id
        
    return goals.find_one(query)

def get_user_active_goal(user_id):
    """Get the currently active goal for a user."""
    return goals.find_one({"user_id": user_id, "active": True})

def get_user_all_goals(user_id):
    """Get all goals for a user, sorted with active goals first, then by creation date."""
    return list(goals.find({"user_id": user_id}).sort([("active", -1), ("created_at", -1)]))

def add_progress_entry(goal_id, progress_data, user_id=None):
    """
    Add a progress entry (like weight measurement) to a goal.
    If user_id is provided, it ensures the goal belongs to that user.
    """
    query = {"_id": goal_id}
    if user_id:
        query["user_id"] = user_id
    
    # Add timestamp if not provided
    if "date" not in progress_data:
        progress_data["date"] = datetime.now()
    
    result = goals.update_one(
        query,
        {
            "$push": {"progress": progress_data},
            "$set": {"updated_at": datetime.now()}
        }
    )
    return result.modified_count > 0

def add_nutrition_target(goal_id, target_data, user_id=None):
    """
    Add a new nutrition target to a goal.
    If user_id is provided, it ensures the goal belongs to that user.
    """
    query = {"_id": goal_id}
    if user_id:
        query["user_id"] = user_id
    
    result = goals.update_one(
        query,
        {
            "$push": {"nutrition_targets": target_data},
            "$set": {"updated_at": datetime.now()}
        }
    )
    return result.modified_count > 0

def update_nutrition_target(goal_id, target_index, updated_data, user_id=None):
    """
    Update a specific nutrition target in a goal.
    If user_id is provided, it ensures the goal belongs to that user.
    """
    query = {"_id": goal_id}
    if user_id:
        query["user_id"] = user_id
    
    # Build the update field path
    update_field = f"nutrition_targets.{target_index}"
    update_dict = {}
    
    # Update only the provided fields in the target
    for key, value in updated_data.items():
        update_dict[f"{update_field}.{key}"] = value
        
    # Also update the goal's updated_at timestamp
    update_dict["updated_at"] = datetime.now()
    
    result = goals.update_one(
        query,
        {"$set": update_dict}
    )
    return result.modified_count > 0

def delete_nutrition_target(goal_id, target_index, user_id=None):
    """
    Remove a specific nutrition target from a goal.
    If user_id is provided, it ensures the goal belongs to that user.
    """
    query = {"_id": goal_id}
    if user_id:
        query["user_id"] = user_id
    
    # Create an array copy without the target to be removed
    goal = goals.find_one(query)
    if not goal or "nutrition_targets" not in goal:
        return False
    
    # Make sure the index is valid
    if target_index < 0 or target_index >= len(goal["nutrition_targets"]):
        return False
        
    # Remove the target at the specified index
    nutrition_targets = goal["nutrition_targets"]
    nutrition_targets.pop(target_index)
    
    # Update the document
    result = goals.update_one(
        query,
        {
            "$set": {
                "nutrition_targets": nutrition_targets,
                "updated_at": datetime.now()
            }
        }
    )
    return result.modified_count > 0

def get_applicable_nutrition_target(user_id, day=None):
    """
    Get the nutrition target applicable for a specific day.
    If day is not provided, it defaults to today.
    """
    if day is None:
        day = datetime.now().strftime("%A")  # Get current day name
        
    # Get the active goal
    active_goal = goals.find_one({"user_id": user_id, "active": True})
    if not active_goal or "nutrition_targets" not in active_goal:
        return None
        
    # Find a target that applies to this day
    for target in active_goal["nutrition_targets"]:
        if "applies_to" in target and day in target["applies_to"]:
            return target
            
    # If no specific target found, return the first one as default
    return active_goal["nutrition_targets"][0] if active_goal["nutrition_targets"] else None

def setup_basic_indexes():
    db = get_database()
    db.users.create_index("email", unique=True)
    db.food_index.create_index("name")
    db.food_logs.create_index([("user_id", 1), ("date", 1)])
    db.goals.create_index("user_id")

# Call this function once during app startup 