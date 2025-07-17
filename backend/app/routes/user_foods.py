from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from .auth import get_current_user
from ..models.user import UserResponse
from ..services.user_service import user_service
from ..services.food_log_service import food_log_service

router = APIRouter(prefix="/foods", tags=["user-foods"])

class FavoriteFoodItem(BaseModel):
    food_id: str
    food_name: str
    serving_size: float = 100
    serving_unit: str = "g"
    added_at: Optional[datetime] = None

class RecentFoodItem(BaseModel):
    food_id: str
    food_name: str
    serving_size: float
    serving_unit: str
    last_used: datetime
    usage_count: int = 1

@router.get("/favorites")
async def get_favorite_foods(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's favorite foods"""
    try:
        user_id = current_user.uid
        
        # Get user preferences which now include favorite foods
        preferences = await user_service.get_user_preferences(user_id)
        favorite_foods = preferences.get("favorite_foods", [])
        
        return JSONResponse(
            content={
                "success": True,
                "favorite_foods": favorite_foods
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get favorite foods: {str(e)}")

@router.post("/favorites")
async def add_favorite_food(
    favorite_food: FavoriteFoodItem,
    current_user: UserResponse = Depends(get_current_user)
):
    """Add a food to favorites"""
    try:
        user_id = current_user.uid
        
        # Get current favorites
        preferences = await user_service.get_user_preferences(user_id)
        favorite_foods = preferences.get("favorite_foods", [])
        
        # Check if already in favorites
        existing_favorite = next((f for f in favorite_foods if f["food_id"] == favorite_food.food_id), None)
        if existing_favorite:
            raise HTTPException(status_code=400, detail="Food already in favorites")
        
        # Add to favorites
        favorite_food.added_at = datetime.utcnow()
        favorite_foods.append(favorite_food.dict())
        
        # Update user preferences
        await user_service.update_user_preferences(user_id, {
            "favorite_foods": favorite_foods
        })
        
        return JSONResponse(
            content={
                "success": True,
                "message": "Food added to favorites successfully"
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
        raise HTTPException(status_code=500, detail=f"Failed to add favorite food: {str(e)}")

@router.delete("/favorites/{food_id}")
async def remove_favorite_food(
    food_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Remove a food from favorites"""
    try:
        user_id = current_user.uid
        
        # Get current favorites
        preferences = await user_service.get_user_preferences(user_id)
        favorite_foods = preferences.get("favorite_foods", [])
        
        # Remove from favorites
        favorite_foods = [f for f in favorite_foods if f["food_id"] != food_id]
        
        # Update user preferences
        await user_service.update_user_preferences(user_id, {
            "favorite_foods": favorite_foods
        })
        
        return JSONResponse(
            content={
                "success": True,
                "message": "Food removed from favorites successfully"
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove favorite food: {str(e)}")

@router.get("/recent")
async def get_recent_foods(
    days: int = Query(5, description="Number of days to look back for recent foods"),
    limit: int = Query(20, description="Maximum number of recent foods to return"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's recent foods from food logs (last N days)"""
    try:
        user_id = current_user.uid
        
        # Calculate date range
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Get food logs from the specified date range
        daily_summaries = await food_log_service.get_date_range_logs(user_id, start_date, end_date)
        
        # Aggregate recent foods with usage count
        recent_foods_map = {}
        
        for daily_summary in daily_summaries:
            for meal in daily_summary.meals:
                food_id = meal.food_id
                food_name = meal.food_name
                amount = meal.amount
                unit = meal.unit
                logged_at = meal.logged_at
                
                if food_id and food_name:
                    if food_id in recent_foods_map:
                        recent_foods_map[food_id]["usage_count"] += 1
                        # Update last_used to the most recent usage
                        if logged_at > recent_foods_map[food_id]["last_used"]:
                            recent_foods_map[food_id]["last_used"] = logged_at
                            recent_foods_map[food_id]["serving_size"] = amount
                            recent_foods_map[food_id]["serving_unit"] = unit
                    else:
                        recent_foods_map[food_id] = {
                            "food_id": food_id,
                            "food_name": food_name,
                            "serving_size": amount,
                            "serving_unit": unit,
                            "last_used": logged_at,
                            "usage_count": 1
                        }
        
        # Sort by last_used (most recent first) and limit results
        recent_foods = sorted(
            recent_foods_map.values(), 
            key=lambda x: x["last_used"], 
            reverse=True
        )[:limit]
        
        # Convert datetime objects to ISO strings for JSON serialization
        for food in recent_foods:
            if isinstance(food["last_used"], datetime):
                food["last_used"] = food["last_used"].isoformat()
        
        return JSONResponse(
            content={
                "success": True,
                "recent_foods": recent_foods,
                "days_searched": days,
                "total_found": len(recent_foods)
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recent foods: {str(e)}")

# CORS OPTIONS handlers
@router.options("/favorites")
async def options_favorites():
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

@router.options("/favorites/{food_id}")
async def options_favorites_delete():
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

@router.options("/recent")
async def options_recent():
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
