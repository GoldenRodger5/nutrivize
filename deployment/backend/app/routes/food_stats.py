"""
Food stats routes for providing statistics about the user's food inventory
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
from .auth import get_current_user

router = APIRouter(
    tags=["food-stats"]
)

@router.get("/stats")
async def get_food_stats(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Get statistics about the user's food inventory including compatibility with dietary preferences
    """
    try:
        # In a production environment, this would query the database
        # For demo purposes, we're returning mock data
        stats = {
            "total_foods": 142,
            "compatible_foods": 98,
            "compatibility_percentage": 69,
            "recent_conflicts": 5,
            "dietary_categories": {
                "vegetarian": 84,
                "vegan": 56,
                "gluten_free": 72,
                "dairy_free": 63,
                "keto_friendly": 48
            },
            "nutrient_averages": {
                "calories": 210,
                "protein": 12,
                "carbs": 24,
                "fat": 8,
                "fiber": 4
            }
        }
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve food statistics: {str(e)}")
