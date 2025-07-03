from fastapi import APIRouter, Depends, HTTPException, Query, Response, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
from datetime import date, datetime, timedelta
from pydantic import BaseModel
import asyncio
import uuid

from .auth import get_current_user
from ..models.user import UserResponse
from ..services.ai_service import AIService
from ..services.food_service import food_service
from ..services.food_log_service import food_log_service
from ..services.meal_planning_service import meal_planning_service
from ..services.goals_service import goals_service

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
    days: int = 7
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
            "use_food_index_only": request.use_food_index_only
        }
        
        ai_service = AIService()
        
        # Add timeout handling for AI request
        try:
            # Set timeout to 60 seconds for faster response
            meal_plan = await asyncio.wait_for(
                ai_service.generate_meal_plan(meal_plan_data),
                timeout=60.0
            )
        except asyncio.TimeoutError:
            # If timeout, suggest using async endpoint
            raise HTTPException(
                status_code=408, 
                detail="Meal plan generation timed out. For complex plans, use /meal-planning/generate-plan-async endpoint for background processing."
            )
        
        # Automatically save the generated meal plan to the database
        saved_plan = await meal_planning_service.save_meal_plan(user_id, meal_plan)
        
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
    try:
        user_id = current_user.uid
        force_regenerate = request.force_regenerate if request else False
        
        shopping_list = await meal_planning_service.generate_shopping_list(
            user_id, 
            plan_id, 
            force_regenerate=force_regenerate
        )
        
        return shopping_list
        
    except Exception as e:
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
    item_id: str
    is_checked: Optional[bool] = None
    amount: Optional[float] = None
    notes: Optional[str] = None

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
