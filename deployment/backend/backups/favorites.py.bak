from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Optional, Set
from datetime import datetime
from pydantic import BaseModel

from .auth import get_current_user
from ..models.user import UserResponse
from ..services.food_service import food_service
from ..core.config import get_database

router = APIRouter(prefix="/favorites", tags=["favorites"])

class FavoriteFood(BaseModel):
    food_id: str
    food_name: str
    added_at: datetime

class FavoriteRequest(BaseModel):
    food_id: str

class FavoriteStats(BaseModel):
    total_count: int
    most_recent: Optional[datetime] = None

@router.get("/", response_model=List[str])
async def get_favorites(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's favorite food IDs"""
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        favorites_collection = db["user_favorites"]
        
        # Get user's favorites
        user_favorites = favorites_collection.find_one({"user_id": current_user.uid})
        
        if not user_favorites:
            return []
        
        # Return list of food IDs
        return user_favorites.get("favorites", [])
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching favorites: {str(e)}")

@router.post("/")
async def add_favorite(
    favorite_request: FavoriteRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Add a food to user's favorites"""
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        favorites_collection = db["user_favorites"]
        
        # Check if food exists
        food_exists = food_service.get_food_by_id(favorite_request.food_id)
        if not food_exists:
            raise HTTPException(status_code=404, detail="Food not found")
        
        # Add to favorites using upsert
        result = favorites_collection.update_one(
            {"user_id": current_user.uid},
            {
                "$addToSet": {"favorites": favorite_request.food_id},
                "$set": {"updated_at": datetime.utcnow()}
            },
            upsert=True
        )
        
        return {"message": "Added to favorites", "food_id": favorite_request.food_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding favorite: {str(e)}")

@router.delete("/{food_id}")
async def remove_favorite(
    food_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Remove a food from user's favorites"""
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        favorites_collection = db["user_favorites"]
        
        # Remove from favorites
        result = favorites_collection.update_one(
            {"user_id": current_user.uid},
            {
                "$pull": {"favorites": food_id},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Food not found in favorites")
        
        return {"message": "Removed from favorites", "food_id": food_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing favorite: {str(e)}")

@router.get("/check/{food_id}")
async def check_favorite_status(
    food_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Check if a food is in user's favorites"""
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        favorites_collection = db["user_favorites"]
        
        # Check if food is in favorites
        user_favorites = favorites_collection.find_one({"user_id": current_user.uid})
        
        if not user_favorites:
            return {"food_id": food_id, "is_favorite": False}
        
        favorites_list = user_favorites.get("favorites", [])
        is_favorite = food_id in favorites_list
        
        return {"food_id": food_id, "is_favorite": is_favorite}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking favorite status: {str(e)}")

@router.get("/stats", response_model=FavoriteStats)
async def get_favorite_stats(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's favorite statistics"""
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        favorites_collection = db["user_favorites"]
        
        # Get user's favorites
        user_favorites = favorites_collection.find_one({"user_id": current_user.uid})
        
        if not user_favorites:
            return FavoriteStats(total_count=0, most_recent=None)
        
        favorites_list = user_favorites.get("favorites", [])
        updated_at = user_favorites.get("updated_at")
        
        return FavoriteStats(
            total_count=len(favorites_list),
            most_recent=updated_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching favorite stats: {str(e)}")

@router.get("/with-details")
async def get_favorites_with_details(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's favorites with food details"""
    try:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        favorites_collection = db["user_favorites"]
        
        # Get user's favorites
        user_favorites = favorites_collection.find_one({"user_id": current_user.uid})
        
        if not user_favorites:
            return []
        
        favorites_list = user_favorites.get("favorites", [])
        
        # Get food details for each favorite
        favorites_with_details = []
        for food_id in favorites_list:
            food = food_service.get_food_by_id(food_id)
            if food:
                favorites_with_details.append({
                    "food_id": food_id,
                    "food_name": food.get("name", "Unknown"),
                    "brand": food.get("brand", ""),
                    "nutrition": food.get("nutrition", {}),
                    "dietary_attributes": food.get("dietary_attributes", {}),
                    "added_at": user_favorites.get("updated_at")
                })
        
        return favorites_with_details
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching favorites with details: {str(e)}")
