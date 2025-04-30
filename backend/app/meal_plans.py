from typing import List, Dict, Any, Optional
import os
import requests
import json
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from .models import search_food_items, get_user_food_logs_by_date, log_food, meal_plans
from .constants import TEST_USER_ID
from .meal_suggestions import (
    get_meal_suggestions_from_ai,
    RemainingMacros,
    MacroBreakdown,
    Ingredient,
    MealSuggestion
)

# Custom JSON encoder to handle datetime and date objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

# Pydantic models for meal plans
class MealPlanMeal(MealSuggestion):
    meal_type: str  # breakfast, lunch, dinner, snack
    is_logged: bool = False
    day: int = 1  # Day 1, 2, 3, etc. of the plan
    is_leftover: bool = False
    original_meal_day: Optional[int] = None  # If this is a leftover, which day it's from
    repeat_of_meal_id: Optional[str] = None  # If this is a repeat of another meal
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

class DailyPlan(BaseModel):
    date: date
    meals: Dict[str, MealPlanMeal] = {}  # meal_type -> meal
    daily_totals: MacroBreakdown
    is_complete: bool = False
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

class MealPlanRequest(BaseModel):
    user_id: str
    days: int = 1  # Default to 1 day
    start_date: Optional[date] = None  # Default to today
    meal_types: List[str] = ["breakfast", "lunch", "dinner", "snack"]
    meal_distribution: Dict[str, float] = {
        "breakfast": 0.25,
        "lunch": 0.35,
        "dinner": 0.30,
        "snack": 0.10
    }
    daily_targets: Dict[str, float]  # calories, protein, carbs, fat
    preferences: Dict[str, Any] = {}
    allow_meal_repetition: bool = False
    use_leftovers: bool = False
    repeat_meals: Dict[str, List[int]] = {}  # meal_type -> list of days to repeat on
    leftover_settings: Dict[str, List[int]] = {}  # meal_type -> list of days to mark as leftovers
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

class MealPlan(BaseModel):
    id: Optional[str] = None
    user_id: str
    name: str
    created_at: Optional[datetime] = None
    is_active: bool = True
    start_date: date
    end_date: date
    days: List[DailyPlan]
    plan_totals: MacroBreakdown
    grocery_list: List[Dict[str, Any]] = []
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }
        
    def dict(self, *args, **kwargs):
        """Override dict method to handle datetime and date serialization."""
        d = super().dict(*args, **kwargs)
        return json.loads(json.dumps(d, cls=DateTimeEncoder))

# Helper function to calculate macros for a set of meals
def calculate_macros(meals: List[MealPlanMeal]) -> MacroBreakdown:
    """Calculate the total macros for a list of meals."""
    total_protein = sum(meal.macros.protein for meal in meals)
    total_carbs = sum(meal.macros.carbs for meal in meals)
    total_fat = sum(meal.macros.fat for meal in meals)
    total_calories = sum(meal.macros.calories for meal in meals)
    
    return MacroBreakdown(
        protein=total_protein,
        carbs=total_carbs,
        fat=total_fat,
        calories=total_calories
    )

# Storage for meal plans (in-memory for backward compatibility)
meal_plans_db = []

async def generate_meal_plan(request: MealPlanRequest) -> MealPlan:
    """
    Generate a meal plan with meals for each specified meal type across multiple days.
    
    Args:
        request: A MealPlanRequest object with user preferences
        
    Returns:
        A MealPlan object with meals for the requested number of days
    """
    if not request.start_date:
        request.start_date = date.today()
    
    # Create end date based on the number of days
    end_date = request.start_date + timedelta(days=request.days - 1)
    
    # Generate daily plans for each day
    daily_plans = []
    all_meals = []  # Collect all meals for grocery list generation
    meal_lookup = {}  # Store meals by ID for referencing repeats
    
    # Track previous meals to avoid repetition
    previous_meals_by_type = {}  # meal_type -> list of previously generated meal names
    
    for day_index in range(request.days):
        current_date = request.start_date + timedelta(days=day_index)
        
        # Calculate target macros for each meal type based on distribution
        meal_targets = {}
        for meal_type in request.meal_types:
            distribution = request.meal_distribution.get(meal_type, 0.25)  # Default to 25% if not specified
            meal_targets[meal_type] = {
                "calories": request.daily_targets["calories"] * distribution,
                "protein": request.daily_targets["protein"] * distribution,
                "carbs": request.daily_targets["carbs"] * distribution,
                "fat": request.daily_targets["fat"] * distribution
            }
        
        # Generate meals for each meal type
        daily_meals = {}
        day_meals_list = []
        
        for meal_type in request.meal_types:
            # Check if this meal should be a repeat of a previous day's meal
            is_repeat = False
            is_leftover = False
            original_meal = None
            
            # Handle meal repetition if enabled
            if request.allow_meal_repetition and meal_type in request.repeat_meals:
                repeat_days = request.repeat_meals[meal_type]
                if day_index in repeat_days and day_index > 0:  # Can't repeat day 0
                    # Find the first non-leftover occurrence of this meal type
                    for prev_day_index in range(day_index):
                        prev_day = daily_plans[prev_day_index]
                        if (meal_type in prev_day.meals and 
                            not prev_day.meals[meal_type].is_leftover and
                            not prev_day.meals[meal_type].repeat_of_meal_id):
                            original_meal = prev_day.meals[meal_type]
                            is_repeat = True
                            break
            
            # Handle leftovers if enabled
            if request.use_leftovers and meal_type in request.leftover_settings:
                leftover_days = request.leftover_settings[meal_type]
                if day_index in leftover_days and day_index > 0:  # Can't have leftovers on day 0
                    # Use the previous day's meal as leftover
                    prev_day_index = day_index - 1
                    prev_day = daily_plans[prev_day_index]
                    if meal_type in prev_day.meals:
                        original_meal = prev_day.meals[meal_type]
                        is_leftover = True
            
            # Create a meal (either new, repeat, or leftover)
            if is_repeat or is_leftover:
                # Create a copy of the original meal
                meal_plan_meal = MealPlanMeal(
                    name=original_meal.name,
                    macros=original_meal.macros,
                    description=original_meal.description,
                    serving_info=original_meal.serving_info,
                    ingredients=original_meal.ingredients,
                    instructions=original_meal.instructions,
                    cooking_time=original_meal.cooking_time,
                    meal_type=meal_type,
                    is_logged=False,
                    day=day_index + 1,
                    is_leftover=is_leftover,
                    original_meal_day=original_meal.day if is_leftover else None,
                    repeat_of_meal_id=str(id(original_meal)) if is_repeat else None
                )
                
                # Adjust description if it's a leftover
                if is_leftover:
                    meal_plan_meal.description = f"Leftovers from Day {original_meal.day}: {original_meal.description}"
                    # Leftovers don't need cooking time
                    meal_plan_meal.cooking_time = 5  # Just 5 minutes to reheat
                
                daily_meals[meal_type] = meal_plan_meal
                day_meals_list.append(meal_plan_meal)
                
                # Store meal by ID for potential future reference
                meal_lookup[str(id(meal_plan_meal))] = meal_plan_meal
                
            else:
                # Create a new meal request for this specific meal type
                meal_request = {
                    "user_id": request.user_id,
                    "meal_type": meal_type,
                    "time_of_day": "12:00",  # Default time, will be adjusted later
                    "preference": request.preferences.get("diet_type", None),
                    "remaining_macros": RemainingMacros(**meal_targets[meal_type]),
                    "use_food_index_only": True,
                    "specific_ingredients": request.preferences.get("preferred_ingredients", []),
                    "cooking_time": request.preferences.get("cooking_time_limit", None)
                }
                
                # If diet type exists in preferences, add it
                if "diet_type" in request.preferences:
                    meal_request["diet_type"] = request.preferences["diet_type"]
                
                # Initialize attempts counter to try generating more substantial meals
                attempts = 0
                max_attempts = 3
                acceptable_meal = False
                
                # Initialize previous meal names for this meal type if not already done
                if meal_type not in previous_meals_by_type:
                    previous_meals_by_type[meal_type] = []
                
                while attempts < max_attempts and not acceptable_meal:
                    # Generate meal suggestion for this meal type
                    from .meal_suggestions import MealSuggestionRequest, get_meal_suggestions
                    meal_suggestion_request = MealSuggestionRequest(**meal_request)
                    meal_response = await get_meal_suggestions(meal_suggestion_request)
                    
                    # Take the first suggestion and convert to MealPlanMeal
                    if meal_response.suggestions:
                        # Filter out meals with the same name as previously generated ones
                        filtered_suggestions = [s for s in meal_response.suggestions 
                                             if s.name not in previous_meals_by_type[meal_type]]
                        
                        if filtered_suggestions:
                            suggestion = filtered_suggestions[0]
                        elif meal_response.suggestions:  # If all are repeats, just take the first one
                            suggestion = meal_response.suggestions[0]
                        
                        # Check if the meal meets minimum calorie threshold
                        target_calories = meal_targets[meal_type]["calories"]
                        actual_calories = suggestion.macros.calories
                        
                        # Meal is acceptable if it's at least 80% of target calories
                        acceptable_meal = actual_calories >= target_calories * 0.8
                        
                        if acceptable_meal or attempts == max_attempts - 1:
                            # Add this meal name to our list of previous meals
                            previous_meals_by_type[meal_type].append(suggestion.name)
                            
                            meal_plan_meal = MealPlanMeal(
                                name=suggestion.name,
                                macros=suggestion.macros,
                                description=suggestion.description,
                                serving_info=suggestion.serving_info,
                                ingredients=suggestion.ingredients,
                                instructions=suggestion.instructions,
                                cooking_time=suggestion.cooking_time,
                                meal_type=meal_type,
                                is_logged=False,
                                day=day_index + 1
                            )
                            daily_meals[meal_type] = meal_plan_meal
                            day_meals_list.append(meal_plan_meal)
                            
                            # Store meal by ID for potential future reference
                            meal_lookup[str(id(meal_plan_meal))] = meal_plan_meal
                    
                    attempts += 1
        
        # Calculate daily totals
        daily_totals = calculate_macros(day_meals_list)
        
        # Create the daily plan
        daily_plan = DailyPlan(
            date=current_date,
            meals=daily_meals,
            daily_totals=daily_totals,
            is_complete=False
        )
        
        daily_plans.append(daily_plan)
        all_meals.extend(day_meals_list)
    
    # Calculate plan totals
    plan_totals = calculate_macros(all_meals)
    
    # Create the meal plan
    import uuid
    plan_id = str(uuid.uuid4())
    meal_plan = MealPlan(
        id=plan_id,
        user_id=request.user_id,
        name=f"Meal Plan ({request.start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')})",
        created_at=datetime.now(),
        is_active=True,
        start_date=request.start_date,
        end_date=end_date,
        days=daily_plans,
        plan_totals=plan_totals,
        grocery_list=generate_consolidated_grocery_list(all_meals)
    )
    
    # Save to MongoDB
    meal_plans.insert_one(meal_plan.dict())
    
    # Also save to in-memory database for backward compatibility
    meal_plans_db.append(meal_plan)
    
    # Set this as the active plan
    set_active_plan(request.user_id, meal_plan)
    
    return meal_plan

# Keep the old function for backward compatibility
async def generate_single_day_meal_plan(request: MealPlanRequest) -> MealPlan:
    """
    Generate a single-day meal plan with meals for each specified meal type.
    This is maintained for backward compatibility.
    
    Args:
        request: A MealPlanRequest object with user preferences
        
    Returns:
        A MealPlan object with a single day of meals
    """
    # Set days to 1 to ensure single day plan
    request.days = 1
    return await generate_meal_plan(request)

def set_active_plan(user_id: str, active_plan: MealPlan):
    """Set a meal plan as the active plan for a user and deactivate others."""
    # Deactivate all other plans for this user in MongoDB
    meal_plans.update_many(
        {"user_id": user_id, "_id": {"$ne": active_plan.id}},
        {"$set": {"is_active": False}}
    )
    
    # Also update in-memory database for backward compatibility
    for plan in meal_plans_db:
        if plan.user_id == user_id and plan.id != active_plan.id:
            plan.is_active = False

def get_active_plan(user_id: str) -> Optional[MealPlan]:
    """Get the active meal plan for a user."""
    # Query MongoDB first
    plan_dict = meal_plans.find_one({"user_id": user_id, "is_active": True})
    
    if plan_dict:
        # Convert MongoDB document to MealPlan
        plan = MealPlan(**plan_dict)
        return plan
    
    # Fallback to in-memory database if nothing found in MongoDB
    for plan in reversed(meal_plans_db):  # Start with most recent
        if plan.user_id == user_id and plan.is_active:
            return plan
            
    return None

def get_user_meal_plans(user_id: str) -> List[MealPlan]:
    """Get all meal plans for a user."""
    # Query MongoDB first
    plan_dicts = list(meal_plans.find({"user_id": user_id}))
    
    if plan_dicts:
        # Convert MongoDB documents to MealPlan objects
        return [MealPlan(**plan_dict) for plan_dict in plan_dicts]
    
    # Fallback to in-memory database if nothing found in MongoDB
    user_plans = []
    for plan in meal_plans_db:
        if plan.user_id == user_id:
            user_plans.append(plan)
    return user_plans

# Common grocery categories
GROCERY_CATEGORIES = {
    "produce": ["fruit", "vegetables", "salad", "apple", "banana", "berry", "berries", "carrot", "broccoli", "spinach", "lettuce", "tomato", "potato", "onion", "garlic", "avocado", "pepper", "cucumber", "zucchini"],
    "meat": ["chicken", "beef", "pork", "turkey", "fish", "salmon", "tuna", "shrimp", "lamb", "steak", "ground", "sausage", "bacon"],
    "dairy": ["milk", "cheese", "yogurt", "butter", "cream", "egg", "eggs", "yoghurt"],
    "bakery": ["bread", "bun", "roll", "bagel", "tortilla", "pita", "wrap", "pizza dough", "pastry"],
    "grains": ["rice", "pasta", "noodle", "quinoa", "oat", "oatmeal", "cereal", "flour", "grain"],
    "canned_goods": ["can", "canned", "soup", "beans", "tomato sauce", "sauce"],
    "frozen": ["frozen", "ice cream"],
    "condiments": ["sauce", "dressing", "oil", "vinegar", "ketchup", "mustard", "mayo", "mayonnaise", "spice", "herb", "salt", "pepper"],
    "snacks": ["chips", "crackers", "nuts", "snack", "cookie", "chocolate"],
    "beverages": ["water", "juice", "soda", "tea", "coffee"],
    "other": []  # Default category
}

# Estimated costs per unit for common ingredients
ESTIMATED_COSTS = {
    "chicken breast": {"unit": "g", "cost_per_unit": 0.022},  # $0.022 per gram ($10/lb)
    "rice": {"unit": "g", "cost_per_unit": 0.0022},  # $0.0022 per gram ($1.10/lb)
    "egg": {"unit": "whole", "cost_per_unit": 0.42},  # $0.42 per egg ($5.04/dozen)
    "milk": {"unit": "ml", "cost_per_unit": 0.0022},  # $0.0022 per ml ($2.20/liter)
    "bread": {"unit": "slice", "cost_per_unit": 0.22},  # $0.22 per slice
    "cheese": {"unit": "g", "cost_per_unit": 0.033},  # $0.033 per gram ($15/lb)
    "beef": {"unit": "g", "cost_per_unit": 0.035},  # $0.035 per gram ($15.90/lb) - up 8.6% from 2024
    "apple": {"unit": "whole", "cost_per_unit": 0.85},  # $0.85 per apple
    "banana": {"unit": "whole", "cost_per_unit": 0.28},  # $0.28 per banana
    "olive oil": {"unit": "ml", "cost_per_unit": 0.022},  # $0.022 per ml
    "butter": {"unit": "g", "cost_per_unit": 0.022},  # $0.022 per gram
    "pasta": {"unit": "g", "cost_per_unit": 0.0055},  # $0.0055 per gram
    "potato": {"unit": "g", "cost_per_unit": 0.0044},  # $0.0044 per gram
    "onion": {"unit": "whole", "cost_per_unit": 0.55},  # $0.55 per onion
    "garlic": {"unit": "clove", "cost_per_unit": 0.12},  # $0.12 per clove
    "salt": {"unit": "g", "cost_per_unit": 0.0011},  # $0.0011 per gram
    "pepper": {"unit": "g", "cost_per_unit": 0.055},  # $0.055 per gram
    "broccoli": {"unit": "g", "cost_per_unit": 0.011},  # $0.011 per gram
    "salmon": {"unit": "g", "cost_per_unit": 0.033},  # $0.033 per gram ($15/lb)
    "berries": {"unit": "g", "cost_per_unit": 0.015},  # $0.015 per gram ($6.80/lb)
    "oats": {"unit": "g", "cost_per_unit": 0.0066},  # $0.0066 per gram ($3/lb)
    "pork": {"unit": "g", "cost_per_unit": 0.02},  # $0.02 per gram ($9.10/lb) - up 2.9% from 2024
    "yogurt": {"unit": "g", "cost_per_unit": 0.0055},  # $0.0055 per gram
}

def estimate_cost(item_name: str, amount: float, unit: str) -> float:
    """Estimate the cost of a grocery item based on predefined prices."""
    # Try exact match first
    if item_name.lower() in ESTIMATED_COSTS:
        cost_info = ESTIMATED_COSTS[item_name.lower()]
        if cost_info["unit"] == unit:
            return amount * cost_info["cost_per_unit"]
    
    # Try partial match if exact match fails
    for key, cost_info in ESTIMATED_COSTS.items():
        if key.lower() in item_name.lower() and cost_info["unit"] == unit:
            return amount * cost_info["cost_per_unit"]
    
    # Default generic estimates by unit type
    unit_estimates = {
        "g": 0.01,      # $0.01 per gram ($4.50/lb)
        "kg": 10.0,     # $10 per kg
        "ml": 0.001,    # $0.001 per ml ($1/liter)
        "l": 1.0,       # $1 per liter
        "whole": 1.0,   # $1 per whole item
        "cup": 1.0,     # $1 per cup
        "tsp": 0.05,    # $0.05 per teaspoon
        "tbsp": 0.15,   # $0.15 per tablespoon
        "clove": 0.10,  # $0.10 per clove
        "slice": 0.25,  # $0.25 per slice
        "piece": 1.0,   # $1 per piece
    }
    
    # Try generic unit estimate
    if unit in unit_estimates:
        return amount * unit_estimates[unit]
    
    # Default fallback estimate
    return amount * 0.5  # $0.50 per unit of anything unknown

def determine_category(item_name: str) -> str:
    """Determine which grocery category an item belongs to."""
    item_lower = item_name.lower()
    
    for category, keywords in GROCERY_CATEGORIES.items():
        for keyword in keywords:
            if keyword.lower() in item_lower:
                return category
    
    return "other"  # Default category

def generate_consolidated_grocery_list(meals: List[MealPlanMeal]) -> List[Dict[str, Any]]:
    """
    Generate a consolidated grocery list from a list of meals.
    
    Consolidates ingredients with the same name and unit.
    Adds category and estimated cost information.
    
    Args:
        meals: A list of MealPlanMeal objects
        
    Returns:
        A consolidated list of grocery items with categories and estimated costs
    """
    # Consolidate ingredients by name and unit
    consolidated = {}
    
    for meal in meals:
        for ingredient in meal.ingredients:
            key = (ingredient.name, ingredient.unit)
            if key in consolidated:
                consolidated[key]["amount"] += ingredient.amount
            else:
                category = determine_category(ingredient.name)
                estimated_cost = estimate_cost(ingredient.name, ingredient.amount, ingredient.unit)
                
                consolidated[key] = {
                    "item": ingredient.name,
                    "amount": ingredient.amount,
                    "unit": ingredient.unit,
                    "category": category,
                    "estimated_cost": round(estimated_cost, 2),
                    "in_food_index": ingredient.in_food_index
                }
    
    # Convert the consolidated dict to a list and sort by category
    grocery_list = list(consolidated.values())
    grocery_list.sort(key=lambda x: (x["category"], x["item"]))
    
    return grocery_list

def generate_grocery_list(meals: List[MealPlanMeal]) -> List[Dict[str, Any]]:
    """Generate a grocery list from a list of meals."""
    # For backward compatibility - use the consolidated list instead
    return generate_consolidated_grocery_list(meals)

async def log_meal_from_plan(user_id: str, meal_plan_id: str, day_index: int, meal_type: str) -> Dict[str, Any]:
    """
    Log a meal from a meal plan to the user's food log.
    
    Args:
        user_id: The user's ID
        meal_plan_id: The ID of the meal plan
        day_index: The index of the day in the plan (0-based)
        meal_type: The type of meal (breakfast, lunch, dinner, snack)
        
    Returns:
        The log entry and a success message
    """
    try:
        # Check MongoDB first
        from .models import meal_plans
        meal_plan_dict = meal_plans.find_one({"id": meal_plan_id, "user_id": user_id})
        
        if meal_plan_dict:
            # Convert MongoDB document to MealPlan object
            meal_plan = MealPlan(**meal_plan_dict)
        else:
            # If not found in MongoDB, try in-memory storage
            meal_plan = None
            for plan in meal_plans_db:
                if plan.id == meal_plan_id and plan.user_id == user_id:
                    meal_plan = plan
                    break
        
        if not meal_plan:
            raise ValueError(f"Meal plan with ID {meal_plan_id} not found for user {user_id}")
        
        # Check if day_index is valid
        if day_index < 0 or day_index >= len(meal_plan.days):
            raise ValueError(f"Day index {day_index} is out of range for meal plan with {len(meal_plan.days)} days")
        
        day = meal_plan.days[day_index]
        
        # Check if meal_type exists in the day's meals
        if meal_type not in day.meals:
            available_meals = ', '.join(day.meals.keys())
            raise ValueError(f"Meal type '{meal_type}' not found in day {day_index + 1} of meal plan. Available meal types: {available_meals}")
        
        meal = day.meals[meal_type]
        
        # Check if already logged
        if meal.is_logged:
            return {
                "message": f"Meal {meal.name} was already logged",
                "success": False,
                "log_entry": None
            }
        
        # Check if meal has valid macros
        if meal.macros.calories == 0 and meal.macros.protein == 0:
            raise ValueError(f"Cannot log meal '{meal.name}' as it doesn't have valid nutritional information")
        
        # Create simplified food log entry
        log_entry = {
            "user_id": user_id,
            "date": day.date.isoformat(),
            "meal_type": meal_type,
            "food_id": "meal_plan",
            "name": meal.name,
            "amount": 1.0,
            "unit": "serving",
            "calories": meal.macros.calories,
            "proteins": meal.macros.protein,
            "carbs": meal.macros.carbs,
            "fats": meal.macros.fat,
            "fiber": 0.0,
            "notes": f"From meal plan: {meal_plan.name}, Day {day_index + 1}, {meal_type}"
        }
        
        print(f"Logging meal from plan: {log_entry}")
        
        try:
            # Log the food using the food logging function
            from .models import log_food
            log_id = log_food(log_entry)
            
            # Mark the meal as logged in the meal plan
            meal.is_logged = True
            
            # Check if all meals for the day are logged
            all_logged = all(m.is_logged for m in day.meals.values())
            if all_logged:
                day.is_complete = True
            
            # Update the meal plan in MongoDB if it was found there
            if meal_plan_dict:
                meal_plans.update_one(
                    {"id": meal_plan_id},
                    {"$set": {"days": [d.dict() for d in meal_plan.days]}}
                )
            
            return {
                "message": f"Successfully logged {meal.name} from meal plan",
                "success": True,
                "log_entry": {**log_entry, "id": str(log_id)}
            }
        except Exception as e:
            print(f"Error in log_food call: {e}")
            raise ValueError(f"Failed to log meal: {str(e)}")
    except Exception as e:
        print(f"Error in log_meal_from_plan: {e}")
        raise ValueError(str(e)) 