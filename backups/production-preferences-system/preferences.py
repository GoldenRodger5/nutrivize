from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime

from .auth import get_current_user
from ..models.user import UserResponse
from ..services.user_service import user_service

router = APIRouter(tags=["preferences"])

# Pydantic models for user preferences
class DietaryPreferences(BaseModel):
    dietary_restrictions: Optional[List[str]] = []  # vegetarian, vegan, gluten-free, etc.
    allergens: Optional[List[str]] = []  # nuts, shellfish, dairy, etc.
    disliked_foods: Optional[List[str]] = []
    preferred_cuisines: Optional[List[str]] = []  # italian, mexican, asian, etc.
    cooking_skill_level: Optional[str] = "intermediate"  # beginner, intermediate, advanced
    max_prep_time: Optional[int] = None  # minutes
    budget_preference: Optional[str] = "moderate"  # low, moderate, high
    strictness_level: Optional[str] = "moderate"  # strict, moderate, flexible

class NutritionPreferences(BaseModel):
    calorie_goal: Optional[int] = None
    protein_goal: Optional[float] = None  # grams
    carb_goal: Optional[float] = None  # grams
    fat_goal: Optional[float] = None  # grams
    fiber_goal: Optional[float] = None  # grams
    sodium_limit: Optional[float] = None  # mg
    sugar_limit: Optional[float] = None  # grams
    meal_frequency: Optional[int] = 3  # meals per day
    snack_frequency: Optional[int] = 1  # snacks per day

class AppPreferences(BaseModel):
    units: Optional[str] = "metric"  # metric, imperial
    language: Optional[str] = "en"
    timezone: Optional[str] = None
    theme: Optional[str] = "light"  # light, dark
    notifications_enabled: Optional[bool] = True
    meal_reminders: Optional[bool] = True
    weekly_insights: Optional[bool] = True
    default_meal_type: Optional[str] = "lunch"
    dashboard_widgets: Optional[List[str]] = []

class UserPreferencesModel(BaseModel):
    dietary: Optional[DietaryPreferences] = None
    nutrition: Optional[NutritionPreferences] = None
    app: Optional[AppPreferences] = None
    updated_at: Optional[str] = None

class PreferencesUpdateRequest(BaseModel):
    dietary: Optional[DietaryPreferences] = None
    nutrition: Optional[NutritionPreferences] = None
    app: Optional[AppPreferences] = None

class DislikedFoodRequest(BaseModel):
    food_name: str

class DislikedFoodsUpdateRequest(BaseModel):
    disliked_foods: List[str]


@router.get("")
async def get_user_preferences(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all user preferences"""
    try:
        user_id = current_user.uid
        preferences = await user_service.get_user_preferences(user_id)
        
        if not preferences:
            # Return default preferences if none exist
            return UserPreferencesModel(
                dietary=DietaryPreferences(),
                nutrition=NutritionPreferences(),
                app=AppPreferences()
            )
        
        return preferences
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get preferences: {str(e)}")


@router.put("")
async def update_user_preferences(
    request: PreferencesUpdateRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update user preferences"""
    try:
        user_id = current_user.uid
        
        # Update preferences in database
        updated_preferences = await user_service.update_user_preferences(
            user_id, 
            request.dict(exclude_none=True)
        )
        
        return {
            "message": "Preferences updated successfully",
            "preferences": updated_preferences
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update preferences: {str(e)}")


@router.get("/dietary")
async def get_dietary_preferences(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get dietary preferences only"""
    try:
        user_id = current_user.uid
        preferences = await user_service.get_user_preferences(user_id)
        
        return preferences.get("dietary", DietaryPreferences().dict()) if preferences else DietaryPreferences().dict()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dietary preferences: {str(e)}")


@router.put("/dietary")
async def update_dietary_preferences(
    dietary_prefs: DietaryPreferences,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update dietary preferences only"""
    try:
        user_id = current_user.uid
        
        updated_preferences = await user_service.update_user_preferences(
            user_id, 
            {"dietary": dietary_prefs.dict()}
        )
        
        return {
            "message": "Dietary preferences updated successfully",
            "dietary": updated_preferences.get("dietary")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update dietary preferences: {str(e)}")


@router.get("/nutrition")
async def get_nutrition_preferences(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get nutrition preferences only"""
    try:
        user_id = current_user.uid
        preferences = await user_service.get_user_preferences(user_id)
        
        return preferences.get("nutrition", NutritionPreferences().dict()) if preferences else NutritionPreferences().dict()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get nutrition preferences: {str(e)}")


@router.put("/nutrition")
async def update_nutrition_preferences(
    nutrition_prefs: NutritionPreferences,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update nutrition preferences only"""
    try:
        user_id = current_user.uid
        
        updated_preferences = await user_service.update_user_preferences(
            user_id, 
            {"nutrition": nutrition_prefs.dict()}
        )
        
        return {
            "message": "Nutrition preferences updated successfully",
            "nutrition": updated_preferences.get("nutrition")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update nutrition preferences: {str(e)}")


@router.get("/app")
async def get_app_preferences(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get app preferences only"""
    try:
        user_id = current_user.uid
        preferences = await user_service.get_user_preferences(user_id)
        
        return preferences.get("app", AppPreferences().dict()) if preferences else AppPreferences().dict()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get app preferences: {str(e)}")


@router.put("/app")
async def update_app_preferences(
    app_prefs: AppPreferences,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update app preferences only"""
    try:
        user_id = current_user.uid
        
        updated_preferences = await user_service.update_user_preferences(
            user_id, 
            {"app": app_prefs.dict()}
        )
        
        return {
            "message": "App preferences updated successfully",
            "app": updated_preferences.get("app")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update app preferences: {str(e)}")


@router.delete("")
async def reset_preferences(
    current_user: UserResponse = Depends(get_current_user)
):
    """Reset all preferences to defaults"""
    try:
        user_id = current_user.uid
        
        default_preferences = {
            "dietary": DietaryPreferences().dict(),
            "nutrition": NutritionPreferences().dict(),
            "app": AppPreferences().dict()
        }
        
        updated_preferences = await user_service.update_user_preferences(
            user_id, 
            default_preferences
        )
        
        return {
            "message": "Preferences reset to defaults",
            "preferences": updated_preferences
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset preferences: {str(e)}")


@router.get("/export")
async def export_preferences(
    current_user: UserResponse = Depends(get_current_user)
):
    """Export user preferences as JSON"""
    try:
        user_id = current_user.uid
        preferences = await user_service.get_user_preferences(user_id)
        
        return {
            "user_id": user_id,
            "preferences": preferences,
            "exported_at": str(datetime.now())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export preferences: {str(e)}")


@router.post("/disliked-foods/add")
async def add_disliked_food(
    request: DislikedFoodRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Add a food to the user's disliked foods list"""
    try:
        user_id = current_user.uid
        food_name = request.food_name.strip().lower()
        
        # Get current preferences
        preferences = await user_service.get_user_preferences(user_id)
        if not preferences:
            preferences = {
                "dietary": {"disliked_foods": []},
                "nutrition": {},
                "app": {}
            }
        
        # Ensure dietary preferences exist
        if "dietary" not in preferences:
            preferences["dietary"] = {}
        if "disliked_foods" not in preferences["dietary"]:
            preferences["dietary"]["disliked_foods"] = []
        
        # Add food if not already in list
        disliked_foods = preferences["dietary"]["disliked_foods"]
        if food_name not in [food.lower() for food in disliked_foods]:
            disliked_foods.append(food_name)
            
            # Update preferences
            await user_service.update_user_preferences(user_id, {
                "dietary": {"disliked_foods": disliked_foods}
            })
            
            return {
                "message": f"Added '{food_name}' to disliked foods",
                "disliked_foods": disliked_foods
            }
        else:
            return {
                "message": f"'{food_name}' is already in your disliked foods",
                "disliked_foods": disliked_foods
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add disliked food: {str(e)}")

@router.post("/disliked-foods/remove")
async def remove_disliked_food(
    request: DislikedFoodRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Remove a food from the user's disliked foods list"""
    try:
        user_id = current_user.uid
        food_name = request.food_name.strip().lower()
        
        # Get current preferences
        preferences = await user_service.get_user_preferences(user_id)
        if not preferences or "dietary" not in preferences or "disliked_foods" not in preferences["dietary"]:
            return {
                "message": "No disliked foods found",
                "disliked_foods": []
            }
        
        # Remove food from list
        disliked_foods = preferences["dietary"]["disliked_foods"]
        original_count = len(disliked_foods)
        disliked_foods = [food for food in disliked_foods if food.lower() != food_name]
        
        if len(disliked_foods) < original_count:
            # Update preferences
            await user_service.update_user_preferences(user_id, {
                "dietary": {"disliked_foods": disliked_foods}
            })
            
            return {
                "message": f"Removed '{food_name}' from disliked foods",
                "disliked_foods": disliked_foods
            }
        else:
            return {
                "message": f"'{food_name}' was not in your disliked foods",
                "disliked_foods": disliked_foods
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove disliked food: {str(e)}")

@router.get("/disliked-foods")
async def get_disliked_foods(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get the user's current disliked foods list"""
    try:
        user_id = current_user.uid
        preferences = await user_service.get_user_preferences(user_id)
        
        if preferences and "dietary" in preferences and "disliked_foods" in preferences["dietary"]:
            return {
                "disliked_foods": preferences["dietary"]["disliked_foods"]
            }
        else:
            return {
                "disliked_foods": []
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get disliked foods: {str(e)}")

@router.get("/export")
async def export_preferences(
    current_user: UserResponse = Depends(get_current_user)
):
    """Export user preferences as JSON"""
    try:
        user_id = current_user.uid
        preferences = await user_service.get_user_preferences(user_id)
        
        return {
            "user_id": user_id,
            "preferences": preferences,
            "exported_at": str(datetime.now())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export preferences: {str(e)}")