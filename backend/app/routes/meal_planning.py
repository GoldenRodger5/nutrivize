from fastapi import APIRouter, Depends, HTTPException, Query, Response, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
from datetime import date, datetime, timedelta
from pydantic import BaseModel
import asyncio
import uuid
import logging

from .auth import get_current_user
from ..models.user import UserResponse
from ..services.ai_service import AIService
from ..services.food_service import food_service
from ..models.food_log import FoodLogCreate, NutritionInfo
from ..services.food_log_service import food_log_service
from ..services.meal_planning_service import meal_planning_service
from ..services.goals_service import goals_service
from ..services.user_service import user_service
from ..services.unified_ai_service import unified_ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/meal-planning", tags=["meal-planning"])

# Global dictionary to store meal plan generation status
meal_plan_status = {}

# Add explicit CORS headers for all responses
def add_cors_headers(response: Response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# Explicit OPTIONS handler for preflight requests
@router.options("/generate-plan")
async def options_generate_plan():
    """Handle preflight CORS requests"""
    return JSONResponse(
        content={"detail": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )

# Add OPTIONS handlers for all meal planning endpoints
@router.options("/{path:path}")
async def options_all():
    """Handle all preflight CORS requests"""
    return JSONResponse(
        content={"detail": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )

# Add OPTIONS handlers for the new async endpoints
@router.options("/generate-plan-async")
async def options_generate_plan_async():
    """Handle preflight CORS requests for async endpoint"""
    return JSONResponse(
        content={"detail": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )

@router.options("/status/{task_id}")
async def options_status():
    """Handle preflight CORS requests for status endpoint"""
    return JSONResponse(
        content={"detail": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )

# Pydantic models for meal planning
class MealPlanRequest(BaseModel):
    name: Optional[str] = None
    days: int = 3
    dietary_restrictions: Optional[List[str]] = []
    preferred_cuisines: Optional[List[str]] = []
    calories_per_day: Optional[int] = None
    protein_target: Optional[float] = None
    carbs_target: Optional[float] = None
    fat_target: Optional[float] = None
    exclude_foods: Optional[List[str]] = []
    meal_types: Optional[List[str]] = ["breakfast", "lunch", "dinner"]
    complexity_level: Optional[str] = "any"  # "simple", "moderate", "complex", or "any"
    use_food_index_only: Optional[bool] = False
    special_requests: Optional[str] = ""  # Custom user instructions for meal planning

class MealSuggestion(BaseModel):
    meal_type: str
    food_name: str
    portion_size: str
    calories: float
    protein: float
    carbs: float
    fat: float
    preparation_notes: Optional[str] = None

class DayMealPlan(BaseModel):
    date: str
    meals: List[MealSuggestion]
    total_nutrition: Dict[str, float]

class MealPlanResponse(BaseModel):
    plan_id: str
    user_id: str
    created_at: datetime
    days: List[DayMealPlan]
    total_days: int
    dietary_restrictions: List[str]
    target_nutrition: Dict[str, float]

class QuickMealRequest(BaseModel):
    meal_type: str
    dietary_restrictions: Optional[List[str]] = []
    cuisine_preference: Optional[str] = None
    max_prep_time: Optional[int] = None  # minutes
    ingredients_on_hand: Optional[List[str]] = []
    complexity_level: Optional[str] = "any"  # "simple", "moderate", "complex", or "any"

# Manual Meal Planning Models
class ManualMealFood(BaseModel):
    food_id: str
    food_name: str
    quantity: float
    unit: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: Optional[float] = 0
    sugar: Optional[float] = 0
    sodium: Optional[float] = 0

class ManualMealPlan(BaseModel):
    plan_id: Optional[str] = None
    name: str
    duration_days: int
    is_active: Optional[bool] = False
    start_date: Optional[str] = None
    days: List[Dict[str, Any]]  # Will contain structured day data
    target_nutrition: Optional[Dict[str, float]] = {}
    notes: Optional[str] = ""

class ManualMealPlanCreate(BaseModel):
    name: str
    duration_days: int
    target_nutrition: Optional[Dict[str, float]] = {}
    notes: Optional[str] = ""

class ManualMealPlanUpdate(BaseModel):
    name: Optional[str] = None
    days: Optional[List[Dict[str, Any]]] = None
    target_nutrition: Optional[Dict[str, float]] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class AddFoodToMealRequest(BaseModel):
    day_number: int
    meal_type: str
    food: ManualMealFood

class LogMealRequest(BaseModel):
    day_number: int
    meal_types: List[str]  # Which meals to log (breakfast, lunch, dinner, etc.)
    log_date: Optional[str] = None  # If not provided, use today

class AIManualSuggestionRequest(BaseModel):
    plan_id: str
    day_number: int
    meal_type: str
    current_nutrition: Dict[str, float]
    target_nutrition: Dict[str, float]
    context: Optional[str] = "suggest foods to complete this meal"


@router.post("/generate-plan")
async def generate_meal_plan(
    request: MealPlanRequest,
    current_user: UserResponse = Depends(get_current_user),
    response: Response = None
):
    """Generate a personalized meal plan based on user preferences and nutrition goals"""
    try:
        user_id = current_user.uid
        
        # Validate request
        if request.days < 1 or request.days > 5:
            raise HTTPException(status_code=400, detail="Days must be between 1 and 5")
        
        # Get nutrition targets from active goal if not provided
        nutrition_targets = {
            "calories": request.calories_per_day,
            "protein": request.protein_target,
            "carbs": request.carbs_target,
            "fat": request.fat_target,
        }
        
        # If no targets provided, use active goal targets
        if not any(nutrition_targets.values()):
            goal_targets = await goals_service.get_active_goal_nutrition_targets(user_id)
            if goal_targets:
                nutrition_targets.update(goal_targets)

        # Fetch user dietary preferences to get disliked foods
        from ..core.config import get_database
        db = get_database()
        user_preferences_doc = db.user_preferences.find_one({"user_id": user_id})
        user_preferences = user_preferences_doc if user_preferences_doc else {}
        
        # Merge user's disliked foods with explicitly excluded foods
        exclude_foods = list(request.exclude_foods or [])
        if user_preferences and user_preferences.get("disliked_foods"):
            exclude_foods.extend(user_preferences["disliked_foods"])
        
        # Remove duplicates while preserving order
        exclude_foods = list(dict.fromkeys(exclude_foods))
        
        # Generate meal plan using enhanced AI service
        meal_plan_data = {
            "user_id": user_id,
            "name": request.name,  # Preserve exact user title
            "days": request.days,
            "dietary_restrictions": request.dietary_restrictions or [],
            "preferred_cuisines": request.preferred_cuisines or [],
            "nutrition_targets": nutrition_targets,
            "exclude_foods": exclude_foods,  # Now includes user's disliked foods
            "meal_types": request.meal_types or ["breakfast", "lunch", "dinner"],
            "complexity_level": request.complexity_level or "any",
            "use_food_index_only": request.use_food_index_only,
            "special_requests": request.special_requests or ""  # Pass special requests to AI service
        }
        
        ai_service = AIService()
        
        # Add timeout handling for AI request
        try:
            # Set timeout to 180 seconds (3 minutes) for meal plan generation
            meal_plan = await asyncio.wait_for(
                ai_service.generate_meal_plan(meal_plan_data),
                timeout=180.0
            )
        except asyncio.TimeoutError:
            # If timeout, suggest using async endpoint
            raise HTTPException(
                status_code=408, 
                detail="Meal plan generation timed out after 3 minutes. For complex plans, use /meal-planning/generate-plan-async endpoint for background processing."
            )
        
        # Automatically save the generated meal plan to the database
        try:
            print(f"DEBUG: About to save meal plan for user {user_id}")
            saved_plan = await meal_planning_service.save_meal_plan(user_id, meal_plan)
            print(f"DEBUG: Successfully saved meal plan")
        except Exception as save_error:
            print(f"ERROR: Failed to save meal plan: {save_error}")
            # Return the generated plan even if saving fails
            saved_plan = meal_plan
            saved_plan["warning"] = "Meal plan generated but not saved to database"
        
        # Create response with explicit CORS headers
        response_data = saved_plan
        if response:
            add_cors_headers(response)
        
        return JSONResponse(
            content=response_data,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate meal plan: {str(e)}")


@router.post("/save-plan")
async def save_meal_plan(
    meal_plan: Dict[str, Any],
    current_user: UserResponse = Depends(get_current_user)
):
    """Save a generated meal plan to the database"""
    try:
        user_id = current_user.uid
        
        # Save the meal plan to database
        saved_plan = await meal_planning_service.save_meal_plan(user_id, meal_plan)
        
        return saved_plan
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save meal plan: {str(e)}")


@router.post("/quick-generate")
async def quick_generate_meal_plan(
    request: Optional[Dict[str, Any]] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Generate a quick 7-day meal plan with smart defaults for the AI dashboard"""
    try:
        user_id = current_user.uid
        
        # Use smart defaults for quick generation
        if not request:
            request = {}
        
        # Set up quick meal plan request with defaults
        quick_request = MealPlanRequest(
            name="AI Quick Meal Plan",
            days=request.get("days", 7),
            dietary_restrictions=request.get("dietary_restrictions", []),
            preferred_cuisines=request.get("preferred_cuisines", []),
            complexity_level=request.get("complexity_level", "any"),
            meal_types=request.get("meal_types", ["breakfast", "lunch", "dinner"])
        )
        
        # Get nutrition targets from active goal
        goal_targets = await goals_service.get_active_goal_nutrition_targets(user_id)
        nutrition_targets = {}
        if goal_targets:
            nutrition_targets.update(goal_targets)
        
        # Fetch user dietary preferences to get disliked foods
        from ..core.config import get_database
        db = get_database()
        user_preferences_doc = db.user_preferences.find_one({"user_id": user_id})
        user_preferences = user_preferences_doc if user_preferences_doc else {}
        
        # Get user's disliked foods for exclusion
        exclude_foods = []
        if user_preferences and user_preferences.get("disliked_foods"):
            exclude_foods.extend(user_preferences["disliked_foods"])
        
        # Generate meal plan using enhanced AI service
        meal_plan_data = {
            "user_id": user_id,
            "name": quick_request.name,
            "days": quick_request.days,
            "dietary_restrictions": quick_request.dietary_restrictions,
            "preferred_cuisines": quick_request.preferred_cuisines,
            "nutrition_targets": nutrition_targets,
            "exclude_foods": exclude_foods,  # Include user's disliked foods
            "complexity_level": quick_request.complexity_level,
            "meal_types": quick_request.meal_types
        }
        
        ai_service = AIService()
        meal_plan = await ai_service.generate_meal_plan(meal_plan_data)
        
        # Automatically save the generated meal plan
        saved_plan = await meal_planning_service.save_meal_plan(user_id, meal_plan)
        
        return {
            "success": True,
            "message": "Quick meal plan generated successfully",
            "meal_plan": saved_plan
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quick meal plan: {str(e)}")


@router.get("/plans")
async def get_user_meal_plans(
    limit: int = Query(10, description="Number of meal plans to return"),
    skip: int = Query(0, description="Number of meal plans to skip"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's saved meal plans"""
    try:
        user_id = current_user.uid
        
        # Get meal plans from database
        meal_plans = await meal_planning_service.get_user_meal_plans(user_id, limit, skip)
        
        # Get total count for pagination
        total_count = len(meal_plans)  # This could be optimized with a count query
        
        return {
            "meal_plans": meal_plans,
            "total": total_count,
            "limit": limit,
            "skip": skip
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get meal plans: {str(e)}")


@router.post("/quick-suggestion")
async def get_quick_meal_suggestion(
    request: QuickMealRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a quick meal suggestion for a specific meal type"""
    try:
        user_id = current_user.uid
        
        # Prepare context for AI
        meal_context = {
            "user_id": user_id,
            "meal_type": request.meal_type,
            "dietary_restrictions": request.dietary_restrictions or [],
            "cuisine_preference": request.cuisine_preference,
            "max_prep_time": request.max_prep_time,
            "ingredients_on_hand": request.ingredients_on_hand or []
        }
        
        # Get suggestion from AI service
        ai_service = AIService()
        suggestion = await ai_service.get_quick_meal_suggestion(meal_context)
        return suggestion
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get meal suggestion: {str(e)}")


@router.post("/plans/{plan_id}/log-meal")
async def log_meal_from_plan(
    plan_id: str,
    day_index: int,
    meal_index: int,
    current_user: UserResponse = Depends(get_current_user)
):
    """Log a meal from a meal plan to the user's food log"""
    try:
        user_id = current_user.uid
        
        # This would retrieve the meal plan and log the specific meal
        # For now, return a placeholder response
        return {
            "message": "Meal logged successfully",
            "plan_id": plan_id,
            "day_index": day_index,
            "meal_index": meal_index,
            "note": "Meal plan storage and logging not yet fully implemented"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log meal from plan: {str(e)}")


@router.get("/recommendations")
async def get_meal_recommendations(
    meal_type: str = Query(..., description="Type of meal: breakfast, lunch, dinner, snack"),
    consider_recent_meals: bool = Query(True, description="Consider recently eaten meals for variety"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get personalized meal recommendations based on user's history and preferences"""
    try:
        user_id = current_user.uid
        
        # Validate meal type
        valid_meal_types = ["breakfast", "lunch", "dinner", "snack"]
        if meal_type not in valid_meal_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid meal type. Must be one of: {', '.join(valid_meal_types)}"
            )
        
        # Get recommendations from AI service
        ai_service = AIService()
        recommendations = await ai_service.get_meal_recommendations(
            user_id=user_id,
            meal_type=meal_type,
            consider_recent_meals=consider_recent_meals
        )
        
        return recommendations
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")


@router.get("/nutrition-optimization")
async def get_nutrition_optimization_suggestions(
    target_nutrient: str = Query(..., description="Nutrient to optimize: protein, fiber, iron, etc."),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get meal suggestions to optimize specific nutritional needs"""
    try:
        user_id = current_user.uid
        
        # Get recent nutrition data to identify gaps
        end_date = date.today()
        start_date = end_date - timedelta(days=7)
        
        # This would analyze recent nutrition and suggest meals to optimize the target nutrient
        optimization_data = {
            "target_nutrient": target_nutrient,
            "analysis_period": f"{start_date} to {end_date}",
            "suggestions": [],
            "message": "Nutrition optimization analysis not yet fully implemented"
        }
        
        return optimization_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get optimization suggestions: {str(e)}")


@router.get("/plans/{plan_id}")
async def get_meal_plan_by_id(
    plan_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a specific meal plan by ID"""
    try:
        user_id = current_user.uid
        
        meal_plan = await meal_planning_service.get_meal_plan_by_id(user_id, plan_id)
        
        if not meal_plan:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        return meal_plan
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get meal plan: {str(e)}")


@router.put("/plans/{plan_id}")
async def update_meal_plan(
    plan_id: str,
    updates: Dict[str, Any],
    current_user: UserResponse = Depends(get_current_user)
):
    """Update a meal plan"""
    try:
        user_id = current_user.uid
        
        # Remove sensitive fields that shouldn't be updated directly
        safe_updates = {k: v for k, v in updates.items() 
                       if k not in ["user_id", "plan_id", "_id", "created_at"]}
        
        updated_plan = await meal_planning_service.update_meal_plan(user_id, plan_id, safe_updates)
        
        if not updated_plan:
            raise HTTPException(status_code=404, detail="Meal plan not found or no changes made")
        
        return {
            "message": "Meal plan updated successfully",
            "meal_plan": updated_plan
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update meal plan: {str(e)}")


@router.delete("/plans/{plan_id}")
async def delete_meal_plan(
    plan_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete a meal plan"""
    try:
        user_id = current_user.uid
        
        success = await meal_planning_service.delete_meal_plan(user_id, plan_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        return {"message": "Meal plan deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete meal plan: {str(e)}")


class ShoppingListRequest(BaseModel):
    force_regenerate: Optional[bool] = False

@router.post("/plans/{plan_id}/shopping-list")
async def generate_shopping_list(
    plan_id: str,
    request: Optional[ShoppingListRequest] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Generate shopping list with New England pricing for a meal plan"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        user_id = current_user.uid
        force_regenerate = request.force_regenerate if request else False
        
        logger.info(f"🛒 Generating shopping list for plan {plan_id}, user {user_id}, force_regenerate={force_regenerate}")
        
        shopping_list = await meal_planning_service.generate_shopping_list(
            user_id, 
            plan_id, 
            force_regenerate=force_regenerate
        )
        
        logger.info(f"✅ Successfully generated shopping list for plan {plan_id}")
        return shopping_list
        
    except ValueError as ve:
        logger.error(f"❌ Validation error generating shopping list for plan {plan_id}: {ve}")
        raise HTTPException(status_code=400, detail=f"Invalid meal plan data: {str(ve)}")
    except KeyError as ke:
        logger.error(f"❌ Missing field error in shopping list for plan {plan_id}: {ke}")
        raise HTTPException(status_code=500, detail=f"Missing required field in meal plan: {str(ke)}")
    except Exception as e:
        logger.error(f"❌ Failed to generate shopping list for plan {plan_id}: {e}")
        logger.exception("Full shopping list error traceback:")
        raise HTTPException(status_code=500, detail=f"Failed to generate shopping list: {str(e)}")

@router.get("/plans/{plan_id}/shopping-list")
async def get_cached_shopping_list(
    plan_id: str,
    max_age_hours: Optional[int] = Query(24, description="Maximum age of cached shopping list in hours"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get cached shopping list for a meal plan"""
    try:
        user_id = current_user.uid
        
        shopping_list = await meal_planning_service.get_cached_shopping_list(
            user_id, 
            plan_id, 
            max_age_hours=max_age_hours
        )
        
        if not shopping_list:
            raise HTTPException(status_code=404, detail="No cached shopping list found")
        
        return shopping_list
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cached shopping list: {str(e)}")


@router.get("/shopping-lists")
async def get_shopping_lists(
    limit: Optional[int] = Query(10, description="Maximum number of shopping lists to return"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's shopping lists"""
    try:
        user_id = current_user.uid
        
        shopping_lists = await meal_planning_service.get_all_user_shopping_lists(user_id, limit)
        
        return {
            "shopping_lists": shopping_lists,
            "total": len(shopping_lists)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get shopping lists: {str(e)}")

@router.delete("/shopping-lists/{shopping_list_id}")
async def delete_shopping_list(
    shopping_list_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete a shopping list"""
    try:
        user_id = current_user.uid
        
        success = await meal_planning_service.delete_shopping_list(user_id, shopping_list_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Shopping list not found")
        
        return {"message": "Shopping list deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete shopping list: {str(e)}")


@router.get("/plans/{plan_id}/versions")
async def get_meal_plan_versions(
    plan_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all versions of a meal plan"""
    try:
        user_id = current_user.uid
        
        versions = await meal_planning_service.get_meal_plan_versions(user_id, plan_id)
        
        return {
            "plan_id": plan_id,
            "versions": versions,
            "total_versions": len(versions)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get meal plan versions: {str(e)}")


@router.post("/plans/{plan_id}/save-version")
async def save_meal_plan_version(
    plan_id: str,
    meal_plan_data: Dict[str, Any],
    current_user: UserResponse = Depends(get_current_user)
):
    """Save a new version of an existing meal plan"""
    try:
        user_id = current_user.uid
        
        # Ensure the plan_id is set
        meal_plan_data["plan_id"] = plan_id
        
        # Save as new version
        saved_plan = await meal_planning_service.save_meal_plan(user_id, meal_plan_data)
        
        return {
            "message": "New meal plan version saved successfully",
            "meal_plan": saved_plan
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save meal plan version: {str(e)}")


@router.post("/extract-ingredients")
async def extract_meal_ingredients(
    meal_data: Dict[str, str],
    current_user: UserResponse = Depends(get_current_user)
):
    """Extract detailed ingredients from a meal name/description using AI"""
    try:
        meal_name = meal_data.get("meal_name", "")
        portion_size = meal_data.get("portion_size", "1 serving")
        
        if not meal_name:
            raise HTTPException(status_code=400, detail="meal_name is required")
        
        # Use AI service to extract ingredients
        ai_service = AIService()
        ingredients = await ai_service.extract_meal_ingredients(meal_name, portion_size)
        
        return {
            "meal_name": meal_name,
            "portion_size": portion_size,
            "ingredients": ingredients
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract ingredients: {str(e)}")


class ShoppingListItem(BaseModel):
    item_id: Optional[str] = None
    name: str
    amount: float
    unit: str
    estimated_price: Optional[float] = None
    store_package_size: Optional[str] = None
    store_package_price: Optional[float] = None
    category: Optional[str] = None
    used_in_meals: Optional[List[str]] = []
    is_checked: Optional[bool] = False
    food_id: Optional[str] = None  # For linking to nutrition data

class ShoppingListUpdateRequest(BaseModel):
    items: List[ShoppingListItem]
    notes: Optional[str] = None

class ShoppingListItemUpdateRequest(BaseModel):
    is_checked: Optional[bool] = None
    amount: Optional[float] = None
    notes: Optional[str] = None
    # No item_id required as it's provided in the URL path

@router.put("/shopping-lists/{shopping_list_id}")
async def update_shopping_list(
    shopping_list_id: str,
    request: ShoppingListUpdateRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update an entire shopping list"""
    try:
        user_id = current_user.uid
        
        updated_list = await meal_planning_service.update_shopping_list(
            user_id, shopping_list_id, request.dict()
        )
        
        if not updated_list:
            raise HTTPException(status_code=404, detail="Shopping list not found")
        
        return updated_list
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update shopping list: {str(e)}")

@router.patch("/shopping-lists/{shopping_list_id}/items/{item_id}")
async def update_shopping_list_item(
    shopping_list_id: str,
    item_id: str,
    request: ShoppingListItemUpdateRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update a specific item in a shopping list (e.g., check/uncheck, edit amount)"""
    try:
        user_id = current_user.uid
        
        updated_item = await meal_planning_service.update_shopping_list_item(
            user_id, shopping_list_id, item_id, request.dict(exclude_unset=True)
        )
        
        if not updated_item:
            raise HTTPException(status_code=404, detail="Shopping list item not found")
        
        return updated_item
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update shopping list item: {str(e)}")

@router.get("/shopping-lists/{shopping_list_id}/items/{item_id}/nutrition")
async def get_shopping_item_nutrition(
    shopping_list_id: str,
    item_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get nutrition information for a shopping list item"""
    try:
        user_id = current_user.uid
        
        nutrition_data = await meal_planning_service.get_shopping_item_nutrition(
            user_id, shopping_list_id, item_id
        )
        
        if not nutrition_data:
            raise HTTPException(status_code=404, detail="Nutrition data not found for this item")
        
        return nutrition_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get nutrition data: {str(e)}")


async def generate_meal_plan_background(task_id: str, meal_plan_data: Dict[str, Any], user_id: str):
    """Background task to generate meal plan"""
    try:
        meal_plan_status[task_id] = {"status": "processing", "progress": 0}
        
        ai_service = AIService()
        meal_plan_status[task_id]["progress"] = 25
        
        # Generate meal plan
        meal_plan = await ai_service.generate_meal_plan(meal_plan_data)
        meal_plan_status[task_id]["progress"] = 75
        
        # Save to database
        saved_plan = await meal_planning_service.save_meal_plan(user_id, meal_plan)
        meal_plan_status[task_id] = {
            "status": "completed", 
            "progress": 100,
            "result": saved_plan
        }
        
    except Exception as e:
        meal_plan_status[task_id] = {
            "status": "failed", 
            "progress": 0,
            "error": str(e)
        }

@router.post("/generate-plan-async")
async def generate_meal_plan_async(
    request: MealPlanRequest,
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_user)
):
    """Start meal plan generation as background task - returns immediately with task ID"""
    try:
        user_id = current_user.uid
        task_id = str(uuid.uuid4())
        
        # Validate request
        if request.days < 1 or request.days > 30:
            raise HTTPException(status_code=400, detail="Days must be between 1 and 30")
        
        # Get nutrition targets from active goal if not provided
        nutrition_targets = {
            "calories": request.calories_per_day,
            "protein": request.protein_target,
            "carbs": request.carbs_target,
            "fat": request.fat_target,
        }
        
        # If no targets provided, use active goal targets
        if not any(nutrition_targets.values()):
            goal_targets = await goals_service.get_active_goal_nutrition_targets(user_id)
            if goal_targets:
                nutrition_targets.update(goal_targets)

        # Fetch user dietary preferences to get disliked foods
        from ..core.config import get_database
        db = get_database()
        user_preferences_doc = db.user_preferences.find_one({"user_id": user_id})
        user_preferences = user_preferences_doc if user_preferences_doc else {}
        
        # Merge user's disliked foods with explicitly excluded foods
        exclude_foods = list(request.exclude_foods or [])
        if user_preferences and user_preferences.get("disliked_foods"):
            exclude_foods.extend(user_preferences["disliked_foods"])
        
        # Remove duplicates while preserving order
        exclude_foods = list(dict.fromkeys(exclude_foods))
        
        # Prepare meal plan data
        meal_plan_data = {
            "user_id": user_id,
            "name": request.name,
            "days": request.days,
            "dietary_restrictions": request.dietary_restrictions or [],
            "preferred_cuisines": request.preferred_cuisines or [],
            "nutrition_targets": nutrition_targets,
            "exclude_foods": exclude_foods,
            "meal_types": request.meal_types or ["breakfast", "lunch", "dinner"],
            "complexity_level": request.complexity_level or "any",
            "use_food_index_only": request.use_food_index_only
        }
        
        # Start background task
        background_tasks.add_task(
            generate_meal_plan_background, 
            task_id, 
            meal_plan_data, 
            user_id
        )
        
        # Initialize status
        meal_plan_status[task_id] = {"status": "started", "progress": 0}
        
        return JSONResponse(
            content={
                "task_id": task_id,
                "status": "started",
                "message": "Meal plan generation started. Use /meal-planning/status/{task_id} to check progress."
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start meal plan generation: {str(e)}")

@router.get("/status/{task_id}")
async def get_meal_plan_status(
    task_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Check the status of a meal plan generation task"""
    if task_id not in meal_plan_status:
        raise HTTPException(status_code=404, detail="Task not found")
    
    status_data = meal_plan_status[task_id]
    
    return JSONResponse(
        content=status_data,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# =============================================================================
# MANUAL MEAL PLANNING ENDPOINTS
# =============================================================================

@router.post("/manual/create")
async def create_manual_meal_plan(
    request: ManualMealPlanCreate,
    current_user: UserResponse = Depends(get_current_user),
    response: Response = None
):
    """Create a new manual meal plan"""
    try:
        user_id = current_user.uid
        
        # Validate duration
        if request.duration_days < 1 or request.duration_days > 30:
            raise HTTPException(status_code=400, detail="Duration must be between 1 and 30 days")
        
        # Create empty plan structure
        plan_id = str(uuid.uuid4())
        days = []
        
        for day_num in range(1, request.duration_days + 1):
            day_data = {
                "day_number": day_num,
                "date": None,  # Will be set when plan is activated
                "meals": {
                    "breakfast": [],
                    "lunch": [],
                    "dinner": [],
                    "snacks": []
                },
                "daily_totals": {
                    "calories": 0,
                    "protein": 0,
                    "carbs": 0,
                    "fat": 0,
                    "fiber": 0,
                    "sugar": 0,
                    "sodium": 0
                }
            }
            days.append(day_data)
        
        # Create meal plan document
        meal_plan_data = {
            "plan_id": plan_id,
            "user_id": user_id,
            "type": "manual",
            "name": request.name,
            "duration_days": request.duration_days,
            "is_active": False,
            "start_date": None,
            "days": days,
            "target_nutrition": request.target_nutrition or {},
            "notes": request.notes or "",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_current_version": True
        }
        
        # Save to database
        saved_plan = await meal_planning_service.save_meal_plan(user_id, meal_plan_data)
        
        if response:
            add_cors_headers(response)
        
        return JSONResponse(
            content={
                "success": True,
                "message": "Manual meal plan created successfully",
                "plan": saved_plan
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create manual meal plan: {str(e)}")

@router.get("/manual/plans")
async def get_manual_meal_plans(
    limit: int = Query(10, description="Number of plans to return"),
    skip: int = Query(0, description="Number of plans to skip"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's manual meal plans"""
    try:
        user_id = current_user.uid
        
        # Get manual plans from database
        plans = await meal_planning_service.get_user_meal_plans(user_id, limit, skip)
        
        # Filter for manual plans only
        manual_plans = [plan for plan in plans if plan.get("type") == "manual"]
        
        return JSONResponse(
            content={
                "success": True,
                "plans": manual_plans,
                "total": len(manual_plans)
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get manual meal plans: {str(e)}")

@router.get("/manual/plans/{plan_id}")
async def get_manual_meal_plan(
    plan_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a specific manual meal plan"""
    try:
        user_id = current_user.uid
        
        # Get plan from database
        plan = await meal_planning_service.get_meal_plan_by_id(user_id, plan_id)
        
        if not plan:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        if plan.get("type") != "manual":
            raise HTTPException(status_code=400, detail="Not a manual meal plan")
        
        return JSONResponse(
            content={
                "success": True,
                "plan": plan
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get manual meal plan: {str(e)}")

@router.put("/manual/plans/{plan_id}")
async def update_manual_meal_plan(
    plan_id: str,
    request: ManualMealPlanUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update a manual meal plan"""
    try:
        user_id = current_user.uid
        
        # Get existing plan
        existing_plan = await meal_planning_service.get_meal_plan_by_id(user_id, plan_id)
        
        if not existing_plan:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        if existing_plan.get("type") != "manual":
            raise HTTPException(status_code=400, detail="Not a manual meal plan")
        
        # Prepare update data
        update_data = {"updated_at": datetime.utcnow()}
        
        if request.name is not None:
            update_data["name"] = request.name
        if request.days is not None:
            update_data["days"] = request.days
        if request.target_nutrition is not None:
            update_data["target_nutrition"] = request.target_nutrition
        if request.notes is not None:
            update_data["notes"] = request.notes
        if request.is_active is not None:
            update_data["is_active"] = request.is_active
        
        # Update plan
        updated_plan = await meal_planning_service.update_meal_plan(user_id, plan_id, update_data)
        
        if not updated_plan:
            raise HTTPException(status_code=404, detail="Failed to update meal plan")
        
        return JSONResponse(
            content={
                "success": True,
                "message": "Manual meal plan updated successfully",
                "plan": updated_plan
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update manual meal plan: {str(e)}")

@router.post("/manual/plans/{plan_id}/add-food")
async def add_food_to_manual_plan(
    plan_id: str,
    request: AddFoodToMealRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Add a food item to a specific meal in a manual plan"""
    try:
        user_id = current_user.uid
        
        # Get existing plan
        plan = await meal_planning_service.get_meal_plan_by_id(user_id, plan_id)
        
        if not plan:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        if plan.get("type") != "manual":
            raise HTTPException(status_code=400, detail="Not a manual meal plan")
        
        # Validate day number
        if request.day_number < 1 or request.day_number > len(plan["days"]):
            raise HTTPException(status_code=400, detail="Invalid day number")
        
        # Get the day data
        day_index = request.day_number - 1
        day_data = plan["days"][day_index]
        
        # Validate meal type
        if request.meal_type not in day_data["meals"]:
            raise HTTPException(status_code=400, detail="Invalid meal type")
        
        # Add food to meal
        food_data = request.food.dict()
        day_data["meals"][request.meal_type].append(food_data)
        
        # Automatically add to recent foods
        try:
            nutrition_dict = {
                "calories": food_data.get("calories", 0),
                "protein": food_data.get("protein", 0),
                "carbs": food_data.get("carbs", 0),
                "fat": food_data.get("fat", 0),
                "fiber": food_data.get("fiber", 0),
                "sugar": food_data.get("sugar", 0),
                "sodium": food_data.get("sodium", 0),
            }
            await user_service.add_to_recent_foods_from_log(
                user_id,
                food_data.get("food_id", ""),
                food_data.get("food_name", ""),
                food_data.get("quantity", 0),
                food_data.get("unit", "g"),
                nutrition_dict
            )
            logger.info(f"Added food {food_data.get('food_name')} to recent foods for user {user_id}")
        except Exception as recent_error:
            logger.warning(f"Failed to add to recent foods from meal plan: {recent_error}")
            # Don't fail the request if adding to recent foods fails
        
        # Recalculate daily totals
        daily_totals = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0,
            "sugar": 0,
            "sodium": 0
        }
        
        for meal_type, foods in day_data["meals"].items():
            for food in foods:
                daily_totals["calories"] += food.get("calories", 0)
                daily_totals["protein"] += food.get("protein", 0)
                daily_totals["carbs"] += food.get("carbs", 0)
                daily_totals["fat"] += food.get("fat", 0)
                daily_totals["fiber"] += food.get("fiber", 0)
                daily_totals["sugar"] += food.get("sugar", 0)
                daily_totals["sodium"] += food.get("sodium", 0)
        
        day_data["daily_totals"] = daily_totals
        
        # Update plan in database
        updated_plan = await meal_planning_service.update_meal_plan(
            user_id, 
            plan_id, 
            {"days": plan["days"], "updated_at": datetime.utcnow()}
        )
        
        return JSONResponse(
            content={
                "success": True,
                "message": "Food added to meal plan successfully",
                "plan": updated_plan
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add food to meal plan: {str(e)}")

@router.delete("/manual/plans/{plan_id}/remove-food")
async def remove_food_from_manual_plan(
    plan_id: str,
    day_number: int = Query(..., description="Day number"),
    meal_type: str = Query(..., description="Meal type"),
    food_index: int = Query(..., description="Index of food to remove"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Remove a food item from a specific meal in a manual plan"""
    try:
        user_id = current_user.uid
        
        # Get existing plan
        plan = await meal_planning_service.get_meal_plan_by_id(user_id, plan_id)
        
        if not plan:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        if plan.get("type") != "manual":
            raise HTTPException(status_code=400, detail="Not a manual meal plan")
        
        # Validate day number
        if day_number < 1 or day_number > len(plan["days"]):
            raise HTTPException(status_code=400, detail="Invalid day number")
        
        # Get the day data
        day_index = day_number - 1
        day_data = plan["days"][day_index]
        
        # Validate meal type
        if meal_type not in day_data["meals"]:
            raise HTTPException(status_code=400, detail="Invalid meal type")
        
        # Validate food index
        if food_index < 0 or food_index >= len(day_data["meals"][meal_type]):
            raise HTTPException(status_code=400, detail="Invalid food index")
        
        # Remove food from meal
        day_data["meals"][meal_type].pop(food_index)
        
        # Recalculate daily totals
        daily_totals = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0,
            "sugar": 0,
            "sodium": 0
        }
        
        for meal_type_key, foods in day_data["meals"].items():
            for food in foods:
                daily_totals["calories"] += food.get("calories", 0)
                daily_totals["protein"] += food.get("protein", 0)
                daily_totals["carbs"] += food.get("carbs", 0)
                daily_totals["fat"] += food.get("fat", 0)
                daily_totals["fiber"] += food.get("fiber", 0)
                daily_totals["sugar"] += food.get("sugar", 0)
                daily_totals["sodium"] += food.get("sodium", 0)
        
        day_data["daily_totals"] = daily_totals
        
        # Update plan in database
        updated_plan = await meal_planning_service.update_meal_plan(
            user_id, 
            plan_id, 
            {"days": plan["days"], "updated_at": datetime.utcnow()}
        )
        
        return JSONResponse(
            content={
                "success": True,
                "message": "Food removed from meal plan successfully",
                "plan": updated_plan
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove food from meal plan: {str(e)}")

@router.post("/manual/plans/{plan_id}/activate")
async def activate_manual_meal_plan(
    plan_id: str,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD), defaults to today"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Activate a manual meal plan"""
    try:
        user_id = current_user.uid
        
        # Get existing plan
        plan = await meal_planning_service.get_meal_plan_by_id(user_id, plan_id)
        
        if not plan:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        if plan.get("type") != "manual":
            raise HTTPException(status_code=400, detail="Not a manual meal plan")
        
        # Set start date
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        else:
            start_date_obj = datetime.utcnow()
        
        # Deactivate other manual plans
        all_plans = await meal_planning_service.get_user_meal_plans(user_id, limit=100)
        for other_plan in all_plans:
            if other_plan.get("type") == "manual" and other_plan.get("is_active"):
                await meal_planning_service.update_meal_plan(
                    user_id, 
                    other_plan["plan_id"], 
                    {"is_active": False}
                )
        
        # Update plan dates and activate
        plan_days = plan["days"]
        for i, day in enumerate(plan_days):
            day_date = start_date_obj + timedelta(days=i)
            day["date"] = day_date.strftime("%Y-%m-%d")
        
        # Update plan
        updated_plan = await meal_planning_service.update_meal_plan(
            user_id, 
            plan_id, 
            {
                "is_active": True,
                "start_date": start_date_obj.strftime("%Y-%m-%d"),
                "days": plan_days,
                "updated_at": datetime.utcnow()
            }
        )
        
        return JSONResponse(
            content={
                "success": True,
                "message": "Manual meal plan activated successfully",
                "plan": updated_plan
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to activate manual meal plan: {str(e)}")

@router.post("/manual/plans/{plan_id}/deactivate")
async def deactivate_manual_meal_plan(
    plan_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Deactivate a manual meal plan"""
    try:
        user_id = current_user.uid
        
        # Get existing plan to verify ownership and type
        plan = await meal_planning_service.get_meal_plan_by_id(user_id, plan_id)
        
        if not plan:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        if plan.get("type") != "manual":
            raise HTTPException(status_code=400, detail="Not a manual meal plan")
        
        # Deactivate the plan
        updated_plan = await meal_planning_service.update_meal_plan(
            user_id, 
            plan_id, 
            {
                "is_active": False,
                "updated_at": datetime.utcnow()
            }
        )
        
        return JSONResponse(
            content={
                "success": True,
                "message": "Manual meal plan deactivated successfully",
                "plan": updated_plan
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to deactivate manual meal plan: {str(e)}")

# Add OPTIONS handlers for manual endpoints
@router.options("/manual/create")
async def options_manual_create():
    return JSONResponse(
        content={"detail": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )

@router.options("/manual/plans")
async def options_manual_plans():
    return JSONResponse(
        content={"detail": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )

@router.options("/manual/plans/{plan_id}")
async def options_manual_plan_by_id():
    return JSONResponse(
        content={"detail": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )

@router.options("/manual/plans/{plan_id}/add-food")
async def options_manual_add_food():
    return JSONResponse(
        content={"detail": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )

@router.options("/manual/plans/{plan_id}/activate")
async def options_manual_activate():
    return JSONResponse(
        content={"detail": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )

@router.delete("/manual/plans/{plan_id}")
async def delete_manual_meal_plan(
    plan_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete a manual meal plan"""
    try:
        user_id = current_user.uid
        
        # Get existing plan to verify ownership and type
        plan = await meal_planning_service.get_meal_plan_by_id(user_id, plan_id)
        
        if not plan:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        if plan.get("type") != "manual":
            raise HTTPException(status_code=400, detail="Not a manual meal plan")
        
        # Delete the plan
        success = await meal_planning_service.delete_meal_plan(user_id, plan_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete meal plan")
        
        return JSONResponse(
            content={
                "success": True,
                "message": "Manual meal plan deleted successfully"
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete manual meal plan: {str(e)}")

@router.options("/manual/plans/{plan_id}")
async def options_manual_plan_delete():
    return JSONResponse(
        content={"detail": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )

# Phase 2 & 3 Manual Meal Planning Endpoints

@router.get("/manual/suggestions")
async def get_manual_suggestions(
    plan_id: str,
    day_number: int,
    meal_type: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get AI suggestions for manual meal planning"""
    try:
        # Get the plan
        plan = await meal_planning_service.get_meal_plan_by_id(current_user.uid, plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        # Get user's nutritional preferences
        user_preferences = await user_service.get_user_preferences(current_user.uid)
        target_nutrition = user_preferences.get("nutrition", {})
        
        # Get current day's nutrition
        day_data = next((d for d in plan.get("days", []) if d.get("day_number") == day_number), None)
        if not day_data:
            raise HTTPException(status_code=404, detail="Day not found")
        
        current_nutrition = day_data.get("daily_totals", {})
        
        # Calculate gaps in nutrition
        nutrition_gaps = {}
        for nutrient in ["calories", "protein", "carbs", "fat"]:
            target = target_nutrition.get(f"{nutrient}_goal", 0)
            current = current_nutrition.get(nutrient, 0)
            gap = max(0, target - current)
            nutrition_gaps[nutrient] = gap
        
        # Generate AI suggestions based on gaps
        suggestions = []
        
        # Protein suggestions
        if nutrition_gaps.get("protein", 0) > 10:
            suggestions.append({
                "type": "protein_boost",
                "message": f"Add {nutrition_gaps['protein']:.0f}g protein to reach your target",
                "foods": [
                    {"name": "Chicken Breast (100g)", "protein": 31, "calories": 165},
                    {"name": "Greek Yogurt (170g)", "protein": 15, "calories": 100},
                    {"name": "Eggs (2 large)", "protein": 12, "calories": 140}
                ]
            })
        
        # Fiber suggestions
        if nutrition_gaps.get("fiber", 0) > 5:
            suggestions.append({
                "type": "fiber_boost",
                "message": "Add more fiber-rich foods",
                "foods": [
                    {"name": "Oats (40g)", "fiber": 4, "calories": 150},
                    {"name": "Broccoli (100g)", "fiber": 3, "calories": 34},
                    {"name": "Apple (1 medium)", "fiber": 4, "calories": 95}
                ]
            })
        
        # Meal completion suggestions
        meal_foods = day_data.get("meals", {}).get(meal_type, [])
        if len(meal_foods) == 0:
            suggestions.append({
                "type": "meal_starter",
                "message": f"Quick {meal_type} ideas to get started",
                "foods": get_meal_starter_foods(meal_type)
            })
        elif len(meal_foods) < 3:
            suggestions.append({
                "type": "meal_completion",
                "message": f"Complete your {meal_type} with these additions",
                "foods": get_meal_completion_foods(meal_type, meal_foods)
            })
        
        return {"suggestions": suggestions}
        
    except Exception as e:
        logger.error(f"Error getting manual suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get suggestions")

def get_meal_starter_foods(meal_type: str):
    """Get starter food suggestions for a meal type"""
    starters = {
        "breakfast": [
            {"name": "Oatmeal (40g)", "calories": 150, "protein": 5, "carbs": 27, "fat": 3},
            {"name": "Greek Yogurt (170g)", "calories": 100, "protein": 15, "carbs": 6, "fat": 0},
            {"name": "Banana (1 medium)", "calories": 105, "protein": 1, "carbs": 27, "fat": 0}
        ],
        "lunch": [
            {"name": "Chicken Breast (100g)", "calories": 165, "protein": 31, "carbs": 0, "fat": 4},
            {"name": "Brown Rice (100g)", "calories": 111, "protein": 3, "carbs": 23, "fat": 1},
            {"name": "Mixed Vegetables (100g)", "calories": 65, "protein": 3, "carbs": 13, "fat": 0}
        ],
        "dinner": [
            {"name": "Salmon (100g)", "calories": 208, "protein": 22, "carbs": 0, "fat": 12},
            {"name": "Sweet Potato (100g)", "calories": 86, "protein": 2, "carbs": 20, "fat": 0},
            {"name": "Broccoli (100g)", "calories": 34, "protein": 3, "carbs": 7, "fat": 0}
        ],
        "snacks": [
            {"name": "Apple (1 medium)", "calories": 95, "protein": 0, "carbs": 25, "fat": 0},
            {"name": "Almonds (28g)", "calories": 164, "protein": 6, "carbs": 6, "fat": 14},
            {"name": "Cottage Cheese (100g)", "calories": 98, "protein": 11, "carbs": 3, "fat": 4}
        ]
    }
    return starters.get(meal_type, [])

def get_meal_completion_foods(meal_type: str, existing_foods: list):
    """Get completion food suggestions based on existing foods"""
    # Simple logic - suggest complementary foods
    completion_foods = {
        "breakfast": [
            {"name": "Berries (100g)", "calories": 57, "protein": 1, "carbs": 14, "fat": 0},
            {"name": "Nuts (28g)", "calories": 170, "protein": 6, "carbs": 6, "fat": 15}
        ],
        "lunch": [
            {"name": "Quinoa (100g)", "calories": 120, "protein": 4, "carbs": 22, "fat": 2},
            {"name": "Avocado (100g)", "calories": 160, "protein": 2, "carbs": 9, "fat": 15}
        ],
        "dinner": [
            {"name": "Leafy Greens (100g)", "calories": 23, "protein": 2, "carbs": 4, "fat": 0},
            {"name": "Olive Oil (1 tbsp)", "calories": 120, "protein": 0, "carbs": 0, "fat": 14}
        ],
        "snacks": [
            {"name": "Yogurt (100g)", "calories": 59, "protein": 10, "carbs": 4, "fat": 0},
            {"name": "Crackers (30g)", "calories": 130, "protein": 3, "carbs": 20, "fat": 4}
        ]
    }
    return completion_foods.get(meal_type, [])

@router.post("/manual/plans/{plan_id}/log-day")
async def log_day_to_food_diary(
    plan_id: str,
    request: LogMealRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Log a day's meals from manual plan to food diary"""
    try:
        # Get the plan
        plan = await meal_planning_service.get_meal_plan_by_id(current_user.uid, plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        # Get the day data
        day_data = next((d for d in plan.get("days", []) if d.get("day_number") == request.day_number), None)
        if not day_data:
            raise HTTPException(status_code=404, detail="Day not found")
        
        # Log each requested meal type
        logged_meals = []
        log_date = request.log_date or datetime.now().strftime("%Y-%m-%d")
        
        for meal_type in request.meal_types:
            meal_foods = day_data.get("meals", {}).get(meal_type, [])
            
            for food in meal_foods:
                # Create food log entry
                nutrition_info = NutritionInfo(
                    calories=food.get("calories", 0),
                    protein=food.get("protein", 0),
                    fat=food.get("fat", 0),
                    carbs=food.get("carbs", 0),
                    fiber=food.get("fiber", 0),
                    sugar=food.get("sugar", 0),
                    sodium=food.get("sodium", 0)
                )
                
                food_log_data = FoodLogCreate(
                    date=datetime.strptime(log_date, "%Y-%m-%d").date(),
                    meal_type=meal_type,
                    food_id=food.get("food_id"),
                    food_name=food.get("food_name"),
                    amount=food.get("quantity", 0),
                    unit=food.get("unit", ""),
                    nutrition=nutrition_info,
                    notes=f"Logged from manual meal plan"
                )
                
                # Add to food diary
                result = await food_log_service.log_food(food_log_data, current_user.uid)
                logged_meals.append(result.dict())
        
        return {
            "success": True,
            "message": f"Logged {len(logged_meals)} meals from day {request.day_number}",
            "logged_meals": logged_meals
        }
        
    except Exception as e:
        logger.error(f"Error logging day to food diary: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to log meals")

@router.post("/manual/plans/{plan_id}/copy-day")
async def copy_day_in_plan(
    plan_id: str,
    source_day: int = Query(..., description="Source day number"),
    target_day: int = Query(..., description="Target day number"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Copy meals from one day to another in a manual plan"""
    try:
        # Get the plan
        plan = await meal_planning_service.get_meal_plan_by_id(current_user.uid, plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        # Find source and target days
        source_day_data = next((d for d in plan.get("days", []) if d.get("day_number") == source_day), None)
        target_day_data = next((d for d in plan.get("days", []) if d.get("day_number") == target_day), None)
        
        if not source_day_data or not target_day_data:
            raise HTTPException(status_code=404, detail="Source or target day not found")
        
        # Copy meals
        target_day_data["meals"] = source_day_data["meals"].copy()
        target_day_data["daily_totals"] = source_day_data["daily_totals"].copy();
        
        # Update the plan
        await meal_planning_service.update_meal_plan(current_user.uid, plan_id, {"days": plan["days"]})
        
        return {
            "success": True,
            "message": f"Copied day {source_day} to day {target_day}",
            "updated_plan": await meal_planning_service.get_meal_plan_by_id(current_user.uid, plan_id)
        }
        
    except Exception as e:
        logger.error(f"Error copying day: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to copy day")

@router.post("/manual/plans/{plan_id}/save-template")
async def save_plan_as_template(
    plan_id: str,
    template_name: str = Query(..., description="Template name"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Save a manual plan as a reusable template"""
    try:
        # Get the plan
        plan = await meal_planning_service.get_meal_plan_by_id(current_user.uid, plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        # Create template
        template_id = str(uuid.uuid4())
        
        # For now, we'll save it as a special meal plan with type="template"
        template_plan = {
            "plan_id": template_id,
            "user_id": current_user.uid,
            "type": "template",
            "name": template_name,
            "title": template_name,
            "description": f"Template created from {plan.get('name', 'Unnamed Plan')}",
            "duration_days": plan.get("duration_days"),
            "days": plan.get("days"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": False,
            "created_from_plan": plan_id,
            "target_nutrition": plan.get("target_nutrition", {}),
            "dietary_restrictions": plan.get("dietary_restrictions", []),
            "notes": f"Template created from plan: {plan.get('name', 'Unnamed Plan')}",
            "version": 1,
            "is_current_version": True,
            "parent_version": None,
            "tags": [],
            "variety_score": "",
            "goal_alignment": "",
            "shopping_tips": "",
            "start_date": None,
            "total_days": plan.get("duration_days")
        }
        
        # Save as new plan document
        result = await meal_planning_service.save_meal_plan(current_user.uid, {
            "name": template_name,
            "description": f"Template created from {plan.get('name', 'Unnamed Plan')}",
            "duration_days": plan.get("duration_days"),
            "target_nutrition": plan.get("target_nutrition", {}),
            "dietary_restrictions": plan.get("dietary_restrictions", []),
            "notes": f"Template created from plan: {plan.get('name', 'Unnamed Plan')}",
            "type": "template",
            "days": plan.get("days"),
            "created_from_plan": plan_id
        })
        
        return {
            "success": True,
            "message": f"Template '{template_name}' saved successfully",
            "template_id": result.get("plan_id", template_id)
        }
        
    except Exception as e:
        logger.error(f"Error saving template: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save template")

@router.get("/manual/templates")
async def get_meal_plan_templates(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's meal plan templates"""
    try:
        # Get all plans with type="template" for the user
        all_plans = await meal_planning_service.get_user_meal_plans(current_user.uid, limit=100)
        templates = [plan for plan in all_plans if plan.get("type") == "template"]
        
        return {"templates": templates}
        
    except Exception as e:
        logger.error(f"Error getting templates: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get templates")

@router.post("/manual/create-from-template")
async def create_plan_from_template(
    template_id: str = Query(..., description="Template ID"),
    plan_name: str = Query(..., description="New plan name"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new plan from a template"""
    try:
        # Get template (it's stored as a plan with type="template")
        template = await meal_planning_service.get_meal_plan_by_id(current_user.uid, template_id)
        if not template or template.get("type") != "template":
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Create new plan from template
        new_plan = {
            "plan_id": str(uuid.uuid4()),
            "user_id": current_user.uid,
            "name": plan_name,
            "description": f"Created from template: {template.get('name', 'Unnamed Template')}",
            "duration_days": template.get("duration_days"),
            "days": template.get("days"),
            "type": "manual",
            "created_from_template": template_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": False,
            "target_nutrition": template.get("target_nutrition", {}),
            "dietary_restrictions": template.get("dietary_restrictions", []),
            "notes": ""
        }
        
        # Save new plan
        result = await meal_planning_service.save_meal_plan(current_user.uid, new_plan)
        
        return {
            "success": True,
            "message": f"Plan '{plan_name}' created from template",
            "plan_id": new_plan["plan_id"]
        }
        
    except Exception as e:
        logger.error(f"Error creating plan from template: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create plan from template")

@router.get("/manual/plans/{plan_id}/export/pdf")
async def export_manual_plan_pdf(
    plan_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Export manual meal plan as PDF"""
    try:
        user_id = current_user.uid
        
        # Get plan
        plan = await meal_planning_service.get_meal_plan_by_id(user_id, plan_id)
        
        if not plan:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        if plan.get("type") != "manual":
            raise HTTPException(status_code=400, detail="Not a manual meal plan")
        
        # For now, return a simple text response - would need proper PDF generation
        from fastapi.responses import StreamingResponse
        import io
        
        # Create simple text content (in real implementation, would use PDF library)
        content = f"""
MEAL PLAN: {plan.get('name', 'Unnamed Plan')}
{'='*50}

Description: {plan.get('description', 'No description')}
Duration: {plan.get('duration_days', 0)} days
Created: {plan.get('created_at', 'Unknown')}

"""
        
        for day in plan.get('days', []):
            content += f"\nDAY {day.get('day_number', 0)}"
            if day.get('date'):
                content += f" ({day.get('date')})"
            content += "\n" + "-" * 30 + "\n"
            
            for meal_type, foods in day.get('meals', {}).items():
                content += f"\n{meal_type.upper()}:\n"
                for food in foods:
                    content += f"  - {food.get('food_name', 'Unknown')} ({food.get('quantity', 0)} {food.get('unit', '')})\n"
                    content += f"    Calories: {food.get('calories', 0):.0f}, Protein: {food.get('protein', 0):.1f}g\n"
            
            totals = day.get('daily_totals', {})
            content += f"\nDaily Totals:\n"
            content += f"  Calories: {totals.get('calories', 0):.0f}\n"
            content += f"  Protein: {totals.get('protein', 0):.1f}g\n"
            content += f"  Carbs: {totals.get('carbs', 0):.1f}g\n"
            content += f"  Fat: {totals.get('fat', 0):.1f}g\n"
            content += "\n"
        
        # Create a bytes buffer
        buffer = io.BytesIO()
        buffer.write(content.encode('utf-8'))
        buffer.seek(0)
        
        return StreamingResponse(
            io.BytesIO(content.encode('utf-8')),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=meal-plan-{plan.get('name', 'plan').replace(' ', '-')}.pdf",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export PDF: {str(e)}")

@router.get("/manual/plans/{plan_id}/export/grocery-list")
async def export_manual_plan_grocery_list(
    plan_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Export manual meal plan grocery list"""
    try:
        user_id = current_user.uid
        
        # Get plan
        plan = await meal_planning_service.get_meal_plan_by_id(user_id, plan_id)
        
        if not plan:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        if plan.get("type") != "manual":
            raise HTTPException(status_code=400, detail="Not a manual meal plan")
        
        # Aggregate ingredients
        grocery_items = {}
        
        for day in plan.get('days', []):
            for meal_type, foods in day.get('meals', {}).items():
                for food in foods:
                    food_name = food.get('food_name', 'Unknown')
                    quantity = food.get('quantity', 0)
                    unit = food.get('unit', '')
                    
                    # Create key for grouping
                    key = f"{food_name}_{unit}"
                    
                    if key in grocery_items:
                        grocery_items[key]['quantity'] += quantity
                    else:
                        grocery_items[key] = {
                            'name': food_name,
                            'quantity': quantity,
                            'unit': unit
                        }
        
        # Convert to list format
        grocery_list = list(grocery_items.values())
        
        return JSONResponse(
            content={
                "success": True,
                "grocery_list": grocery_list,
                "total_items": len(grocery_list),
                "plan_name": plan.get('name', 'Unnamed Plan')
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate grocery list: {str(e)}")

@router.options("/manual/plans/{plan_id}/export/pdf")
async def options_manual_export_pdf():
    return JSONResponse(
        content={"detail": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )

@router.options("/manual/plans/{plan_id}/export/grocery-list")
async def options_manual_export_grocery():
    return JSONResponse(
        content={"detail": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )

@router.options("/manual/plans/{plan_id}/deactivate")
async def options_manual_deactivate():
    return JSONResponse(
        content={"detail": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )

@router.post("/manual/plans/{plan_id}/insights")
async def get_meal_plan_insights(
    plan_id: str,
    day_number: Optional[int] = Query(None, description="Specific day to analyze, or None for entire plan"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Generate AI insights for a meal plan based on nutrition and user goals"""
    try:
        user_id = current_user.uid
        
        # Get the plan
        plan = await meal_planning_service.get_meal_plan_by_id(user_id, plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        if plan.get("type") != "manual":
            raise HTTPException(status_code=400, detail="Not a manual meal plan")
        
        # Get user's goals and preferences
        user_preferences = await user_service.get_user_preferences(user_id)
        nutrition_goals = user_preferences.get("nutrition", {})
        dietary_preferences = user_preferences.get("dietary", {})
        
        # Prepare data for AI analysis
        plan_data = {
            "plan_name": plan.get("name", "Unnamed Plan"),
            "target_nutrition": plan.get("target_nutrition", {}),
            "user_goals": nutrition_goals,
            "dietary_preferences": dietary_preferences,
            "days": plan.get("days", [])
        }
        
        if day_number is not None:
            # Analyze specific day
            day_data = next((d for d in plan.get("days", []) if d.get("day_number") == day_number), None)
            if not day_data:
                raise HTTPException(status_code=404, detail="Day not found")
            plan_data["days"] = [day_data]
            plan_data["analysis_scope"] = f"Day {day_number}"
        else:
            plan_data["analysis_scope"] = "Entire Plan"
        
        # Use AI service to generate insights
        ai_service = AIService()
        
        # Create prompt for meal plan analysis
        analysis_prompt = f"""
        Analyze this meal plan and provide detailed health insights and recommendations.
        
        Plan: {plan_data['plan_name']}
        Analysis Scope: {plan_data['analysis_scope']}
        
        User's Nutrition Goals:
        - Calories: {nutrition_goals.get('calorie_goal', 'Not set')}
        - Protein: {nutrition_goals.get('protein_goal', 'Not set')}g
        - Carbs: {nutrition_goals.get('carb_goal', 'Not set')}g
        - Fat: {nutrition_goals.get('fat_goal', 'Not set')}g
        - Fiber: {nutrition_goals.get('fiber_goal', 'Not set')}g
        
        Dietary Preferences:
        - Restrictions: {dietary_preferences.get('dietary_restrictions', [])}
        - Allergens: {dietary_preferences.get('allergens', [])}
        - Cooking Skill: {dietary_preferences.get('cooking_skill_level', 'Not set')}
        - Budget: {dietary_preferences.get('budget_preference', 'Not set')}
        
        Plan Data: {plan_data['days']}
        
        Please provide:
        1. Overall nutrition analysis vs goals
        2. Specific recommendations to improve the meal plan
        3. Potential health benefits
        4. Areas for improvement
        5. Practical tips for better nutrition
        
        Format as JSON with sections: analysis, recommendations, health_benefits, improvements, tips
        """
        
        try:
            insights = await ai_service.generate_completion(analysis_prompt)
            
            # Try to parse as JSON, fallback to plain text
            try:
                import json
                parsed_insights = json.loads(insights)
            except:
                parsed_insights = {
                    "analysis": insights,
                    "recommendations": [],
                    "health_benefits": [],
                    "improvements": [],
                    "tips": []
                }
            
            return JSONResponse(
                content={
                    "success": True,
                    "insights": parsed_insights,
                    "plan_name": plan.get("name", "Unnamed Plan"),
                    "analysis_scope": plan_data["analysis_scope"],
                    "generated_at": datetime.utcnow().isoformat()
                },
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Credentials": "true",
                }
            )
            
        except Exception as ai_error:
            # Fallback to basic analysis if AI fails
            return JSONResponse(
                content={
                    "success": True,
                    "insights": {
                        "analysis": "AI analysis temporarily unavailable. Your meal plan looks good overall.",
                        "recommendations": [
                            "Ensure you're drinking plenty of water",
                            "Include a variety of colorful vegetables",
                            "Monitor portion sizes based on your goals"
                        ],
                        "health_benefits": [
                            "Balanced nutrition supports overall health",
                            "Regular meal planning helps maintain consistency"
                        ],
                        "improvements": [
                            "Consider adding more fiber-rich foods",
                            "Check if micronutrient needs are met"
                        ],
                        "tips": [
                            "Prep ingredients in advance to save time",
                            "Listen to your body's hunger and fullness cues"
                        ]
                    },
                    "plan_name": plan.get("name", "Unnamed Plan"),
                    "analysis_scope": plan_data["analysis_scope"],
                    "generated_at": datetime.utcnow().isoformat(),
                    "note": "Using fallback analysis due to AI service limitation"
                },
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Credentials": "true",
                }
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

@router.options("/manual/plans/{plan_id}/insights")
async def options_manual_insights():
    return JSONResponse(
        content={"detail": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )

class MealSuggestionData(BaseModel):
    name: str
    description: str
    meal_type: str
    prep_time: Optional[int] = None
    nutrition: Dict[str, Any]
    ingredients: List[Dict[str, Any]] = []

@router.post("/plans/{plan_id}/add-meal")
async def add_meal_to_plan(
    plan_id: str,
    meal_data: MealSuggestionData,
    current_user: UserResponse = Depends(get_current_user)
):
    """Add a meal suggestion to an existing meal plan"""
    try:
        # Get the existing meal plan
        plan = await meal_planning_service.get_plan_by_id(current_user.id, plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        # Create new meal object
        new_meal = {
            "id": str(uuid.uuid4()),
            "name": meal_data.name,
            "description": meal_data.description,
            "meal_type": meal_data.meal_type,
            "prep_time": meal_data.prep_time,
            "nutrition": meal_data.nutrition,
            "ingredients": meal_data.ingredients,
            "added_at": datetime.utcnow().isoformat()
        }
        
        # Add meal to plan
        if "meals" not in plan:
            plan["meals"] = []
        plan["meals"].append(new_meal)
        
        # Update the plan
        await meal_planning_service.update_plan(current_user.id, plan_id, plan)
        
        return JSONResponse(
            content={"detail": "Meal added successfully", "meal": new_meal},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to add meal to plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add meal to plan: {str(e)}")

@router.options("/plans/{plan_id}/add-meal")
async def options_add_meal():
    return JSONResponse(
        content={"detail": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )

@router.post("/meal-suggestions/log")
async def log_meal_suggestion(
    meal_data: FoodLogCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Log a meal suggestion to the food diary"""
    try:
        # Use the existing food log service to log the meal
        result = await food_log_service.create_food_log(current_user.id, meal_data)
        
        return JSONResponse(
            content={"detail": "Meal logged successfully", "log": result},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to log meal suggestion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to log meal suggestion: {str(e)}")

@router.options("/meal-suggestions/log")
async def options_log_meal_suggestion():
    return JSONResponse(
        content={"detail": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )
