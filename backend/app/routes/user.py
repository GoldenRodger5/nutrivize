from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from datetime import datetime, timedelta
import logging

from .auth import get_current_user
from ..models.user import UserResponse, AddToRecentsRequest, AddToFavoritesRequest, RecentFood, FavoriteFood
from ..services.user_service import user_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/recent-foods")
async def get_recent_foods(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's recent foods (last 5 days)"""
    try:
        user_data = await user_service.get_user_document_by_uid(current_user.uid)
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Filter recent foods to only include those from last 5 days
        five_days_ago = datetime.utcnow() - timedelta(days=5)
        recent_foods = []
        for food in user_data.get("recent_foods", []):
            try:
                last_used = food.get("last_used")
                if isinstance(last_used, datetime):
                    # Already a datetime object
                    last_used_dt = last_used
                elif isinstance(last_used, str):
                    # Parse string datetime
                    last_used_dt = datetime.fromisoformat(last_used.replace("Z", "+00:00"))
                else:
                    # Skip invalid entries
                    continue
                
                if last_used_dt > five_days_ago:
                    recent_foods.append(food)
            except Exception:
                # Skip invalid entries
                continue
        
        # Sort by last_used descending (most recent first)
        recent_foods.sort(key=lambda x: x["last_used"], reverse=True)
        
        return {"recent_foods": recent_foods}
        
    except Exception as e:
        logger.error(f"Error getting recent foods: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get recent foods")


@router.post("/recent-foods")
async def add_to_recent_foods(
    request: AddToRecentsRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Add food to recent foods"""
    try:
        user_data = await user_service.get_user_document_by_uid(current_user.uid)
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create new recent food entry
        new_recent_food = {
            "food_id": request.food_id,
            "food_name": request.food_name,
            "quantity": request.quantity,
            "unit": request.unit,
            "calories": request.calories,
            "protein": request.protein,
            "carbs": request.carbs,
            "fat": request.fat,
            "fiber": request.fiber,
            "sugar": request.sugar,
            "sodium": request.sodium,
            "last_used": datetime.utcnow()
        }
        
        # Get existing recent foods
        recent_foods = user_data.get("recent_foods", [])
        
        # Remove if already exists (to update last_used)
        recent_foods = [f for f in recent_foods if f["food_id"] != request.food_id]
        
        # Add to beginning of list
        recent_foods.insert(0, new_recent_food)
        
        # Keep only last 20 items
        recent_foods = recent_foods[:20]
        
        # Clean up old entries (older than 5 days)
        five_days_ago = datetime.utcnow() - timedelta(days=5)
        cleaned_foods = []
        for food in recent_foods:
            try:
                last_used = food.get("last_used")
                if isinstance(last_used, datetime):
                    # Already a datetime object
                    last_used_dt = last_used
                elif isinstance(last_used, str):
                    # Parse string datetime
                    last_used_dt = datetime.fromisoformat(last_used.replace("Z", "+00:00"))
                else:
                    # Skip invalid entries
                    continue
                
                if last_used_dt > five_days_ago:
                    cleaned_foods.append(food)
            except Exception:
                # Skip invalid entries
                continue
        
        # Update user
        await user_service.update_user_data(current_user.uid, {
            "recent_foods": cleaned_foods
        })
        
        return {"success": True, "message": "Food added to recent foods"}
        
    except Exception as e:
        logger.error(f"Error adding to recent foods: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add to recent foods")


@router.get("/favorite-foods")
async def get_favorite_foods(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's favorite foods"""
    try:
        user_data = await user_service.get_user_document_by_uid(current_user.uid)
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        favorite_foods = user_data.get("favorite_foods", [])
        
        # Sort by added_date descending (most recent first)
        def get_sort_key(food):
            added_date = food.get("added_date", "")
            if isinstance(added_date, datetime):
                # Make sure it's timezone-naive for comparison
                if added_date.tzinfo is not None:
                    return added_date.replace(tzinfo=None)
                return added_date
            elif isinstance(added_date, str):
                try:
                    # Parse and make timezone-naive
                    dt = datetime.fromisoformat(added_date.replace("Z", "+00:00"))
                    return dt.replace(tzinfo=None)
                except:
                    return datetime.min
            else:
                return datetime.min
        
        favorite_foods.sort(key=get_sort_key, reverse=True)
        
        return {"favorite_foods": favorite_foods}
        
    except Exception as e:
        logger.error(f"Error getting favorite foods: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get favorite foods")


@router.post("/favorite-foods")
async def add_to_favorite_foods(
    request: AddToFavoritesRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Add food to favorite foods"""
    try:
        user_data = await user_service.get_user_document_by_uid(current_user.uid)
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if already in favorites
        favorite_foods = user_data.get("favorite_foods", [])
        if any(f["food_id"] == request.food_id for f in favorite_foods):
            raise HTTPException(status_code=400, detail="Food already in favorites")
        
        # Create new favorite food entry
        new_favorite_food = {
            "food_id": request.food_id,
            "food_name": request.food_name,
            "default_quantity": request.default_quantity,
            "default_unit": request.default_unit,
            "calories": request.calories,
            "protein": request.protein,
            "carbs": request.carbs,
            "fat": request.fat,
            "fiber": request.fiber,
            "sugar": request.sugar,
            "sodium": request.sodium,
            "added_date": datetime.utcnow()
        }
        
        # Add to favorites
        favorite_foods.append(new_favorite_food)
        
        # Update user
        await user_service.update_user_data(current_user.uid, {
            "favorite_foods": favorite_foods
        })
        
        return {"success": True, "message": "Food added to favorites"}
        
    except Exception as e:
        logger.error(f"Error adding to favorites: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add to favorites")


@router.delete("/favorite-foods/{food_id}")
async def remove_from_favorite_foods(
    food_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Remove food from favorite foods"""
    try:
        user_data = await user_service.get_user_document_by_uid(current_user.uid)
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Remove from favorites
        favorite_foods = user_data.get("favorite_foods", [])
        original_count = len(favorite_foods)
        favorite_foods = [f for f in favorite_foods if f["food_id"] != food_id]
        
        if len(favorite_foods) == original_count:
            raise HTTPException(status_code=404, detail="Food not found in favorites")
        
        # Update user
        await user_service.update_user_data(current_user.uid, {
            "favorite_foods": favorite_foods
        })
        
        return {"success": True, "message": "Food removed from favorites"}
        
    except Exception as e:
        logger.error(f"Error removing from favorites: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to remove from favorites")


@router.delete("/recent-foods")
async def clear_recent_foods(
    current_user: UserResponse = Depends(get_current_user)
):
    """Clear all recent foods"""
    try:
        # Update user to clear recent foods
        await user_service.update_user_data(current_user.uid, {
            "recent_foods": []
        })
        
        return {
            "success": True,
            "message": "Recent foods cleared successfully"
        }
        
    except Exception as e:
        logger.error(f"Error clearing recent foods: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear recent foods")


@router.post("/cleanup-recent-foods")
async def cleanup_recent_foods(
    current_user: UserResponse = Depends(get_current_user)
):
    """Cleanup recent foods older than 5 days"""
    try:
        user_data = await user_service.get_user_document_by_uid(current_user.uid)
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Clean up old entries (older than 5 days)
        five_days_ago = datetime.utcnow() - timedelta(days=5)
        recent_foods = user_data.get("recent_foods", [])
        
        cleaned_foods = []
        for food in recent_foods:
            try:
                last_used = food.get("last_used")
                if isinstance(last_used, datetime):
                    # Already a datetime object
                    last_used_dt = last_used
                elif isinstance(last_used, str):
                    # Parse string datetime
                    last_used_dt = datetime.fromisoformat(last_used.replace("Z", "+00:00"))
                else:
                    # Skip invalid entries
                    continue
                
                if last_used_dt > five_days_ago:
                    cleaned_foods.append(food)
            except Exception:
                # Skip invalid entries
                continue
        
        # Update user
        await user_service.update_user_data(current_user.uid, {
            "recent_foods": cleaned_foods
        })
        
        removed_count = len(recent_foods) - len(cleaned_foods)
        
        return {
            "success": True,
            "message": f"Cleaned up {removed_count} old recent foods",
            "removed_count": removed_count
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up recent foods: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cleanup recent foods")


@router.get("/favorite-foods")
async def get_favorite_foods(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's favorite foods - Alias for /favorites endpoint"""
    try:
        from ..services.user_favorites_service import user_favorites_service
        
        # Get user's favorite foods
        favorites = await user_favorites_service.get_user_favorites(current_user.uid)
        
        return {"favorites": favorites}
        
    except Exception as e:
        logger.error(f"Error getting favorite foods: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get favorite foods")
