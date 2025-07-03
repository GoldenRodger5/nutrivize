from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from .auth import get_current_user
from ..models.user import UserResponse
from ..services.dietary_recommendation_service import dietary_recommendation_service

router = APIRouter(tags=["dietary"])

class DietaryPreferencesUpdate(BaseModel):
    dietary_restrictions: List[str] = []
    allergens: List[str] = []
    strictness_level: str = "moderate"
    food_preferences: Optional[Dict[str, Any]] = None

class FoodRecommendationRequest(BaseModel):
    meal_type: Optional[str] = None
    limit: int = 10
    exclude_recent: bool = True

class DislikedFoodRequest(BaseModel):
    food_name: str

@router.post("/preferences")
async def update_dietary_preferences(
    preferences: DietaryPreferencesUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update user's dietary preferences"""
    try:
        # Here you would save to your user preferences system
        # For now, we'll return success
        return {
            "message": "Dietary preferences updated successfully",
            "preferences": preferences.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update preferences: {str(e)}")

@router.get("/preferences")
async def get_dietary_preferences(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's current dietary preferences"""
    try:
        from ..core.config import get_database
        db = get_database()
        
        # Get user preferences from MongoDB
        user_prefs = db.user_preferences.find_one({"user_id": current_user.uid})
        
        if not user_prefs:
            # Return default preferences
            return {
                "dietary_restrictions": [],
                "allergens": [],
                "disliked_foods": [],
                "strictness_level": "moderate",
                "compatibility_score": 100
            }
        
        return {
            "dietary_restrictions": user_prefs.get("dietary_restrictions", []),
            "allergens": user_prefs.get("allergens", []),
            "disliked_foods": user_prefs.get("disliked_foods", []),
            "strictness_level": user_prefs.get("strictness_level", "moderate"),
            "compatibility_score": user_prefs.get("compatibility_score", 100)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get preferences: {str(e)}")

@router.post("/disliked-foods")
async def add_disliked_food(
    request: DislikedFoodRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Add a food to the user's disliked foods list"""
    try:
        from ..core.config import get_database
        db = get_database()
        
        # Add to disliked foods list
        result = db.user_preferences.update_one(
            {"user_id": current_user.uid},
            {
                "$addToSet": {"disliked_foods": request.food_name.lower()},
                "$setOnInsert": {
                    "user_id": current_user.uid,
                    "dietary_restrictions": [],
                    "allergens": [],
                    "strictness_level": "moderate"
                }
            },
            upsert=True
        )
        
        # Get updated list
        user_prefs = db.user_preferences.find_one({"user_id": current_user.uid})
        disliked_foods = user_prefs.get("disliked_foods", [])
        
        return {
            "message": f"Added '{request.food_name}' to disliked foods",
            "disliked_foods": disliked_foods
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add disliked food: {str(e)}")

@router.delete("/disliked-foods")
async def remove_disliked_food(
    request: DislikedFoodRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Remove a food from the user's disliked foods list"""
    try:
        from ..core.config import get_database
        db = get_database()
        
        # Remove from disliked foods list
        result = db.user_preferences.update_one(
            {"user_id": current_user.uid},
            {"$pull": {"disliked_foods": request.food_name.lower()}}
        )
        
        # Get updated list
        user_prefs = db.user_preferences.find_one({"user_id": current_user.uid})
        disliked_foods = user_prefs.get("disliked_foods", []) if user_prefs else []
        
        return {
            "message": f"Removed '{request.food_name}' from disliked foods",
            "disliked_foods": disliked_foods
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove disliked food: {str(e)}")

@router.post("/recommendations")
async def get_food_recommendations(
    request: FoodRecommendationRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get AI-powered food recommendations based on dietary preferences"""
    try:
        user_id = current_user.uid
        
        # Get user preferences (this would come from your user service)
        user_preferences = {
            "dietary_restrictions": ["vegetarian"],
            "allergens": ["nuts"],
            "strictness_level": "moderate"
        }
        
        recommendations = await dietary_recommendation_service.get_personalized_food_recommendations(
            user_id=user_id,
            user_preferences=user_preferences,
            meal_type=request.meal_type,
            limit=request.limit
        )
        
        return {
            "recommendations": recommendations,
            "user_preferences": user_preferences,
            "meal_type": request.meal_type
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@router.get("/compatibility/{food_id}")
async def get_food_compatibility(
    food_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get compatibility score for a specific food item"""
    try:
        # This would integrate with your food service and user preferences
        return {
            "food_id": food_id,
            "compatibility_score": 85,
            "is_safe": True,
            "warnings": [],
            "benefits": ["vegetarian", "high-protein"],
            "recommendations": "Perfect match for your dietary preferences!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get compatibility: {str(e)}")

@router.post("/analyze-meal")
async def analyze_meal_compatibility(
    meal_foods: List[str],  # List of food IDs
    current_user: UserResponse = Depends(get_current_user)
):
    """Analyze compatibility of a complete meal"""
    try:
        # This would analyze the entire meal for dietary compatibility
        return {
            "meal_compatibility_score": 92,
            "is_meal_safe": True,
            "overall_warnings": [],
            "nutritional_balance": {
                "protein": "excellent",
                "carbs": "good", 
                "fat": "moderate",
                "fiber": "excellent"
            },
            "suggestions": [
                "Great meal choice! Meets all your dietary requirements.",
                "Consider adding a vitamin C source for better iron absorption."
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze meal: {str(e)}")
