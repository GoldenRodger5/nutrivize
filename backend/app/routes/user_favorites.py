"""
User Favorites Routes - API endpoints for managing user favorite foods
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
from ..routes.auth import get_current_user
from ..models.user import UserResponse
from ..models.user_favorite import (
    UserFavoriteCreate, UserFavoriteResponse, UserFavoriteUpdate, 
    UserFavoriteStats, FavoriteCategory
)
from ..services.user_favorites_service import user_favorites_service

router = APIRouter(prefix="/favorites", tags=["user-favorites"])


@router.options("/")
async def options_favorites():
    """Handle preflight CORS requests for favorites endpoint"""
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


@router.options("/{food_id}")
async def options_favorite_by_id():
    """Handle preflight CORS requests for specific favorite endpoints"""
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


@router.post("/", response_model=UserFavoriteResponse)
async def add_favorite(
    favorite_data: UserFavoriteCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Add a food to user's favorites"""
    try:
        favorite = await user_favorites_service.add_favorite(current_user.uid, favorite_data)
        return JSONResponse(
            content=favorite.dict() if hasattr(favorite, 'dict') else favorite,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding favorite: {str(e)}")


@router.delete("/{food_id}")
async def remove_favorite(
    food_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Remove a food from user's favorites"""
    try:
        success = await user_favorites_service.remove_favorite(current_user.uid, food_id)
        if not success:
            raise HTTPException(status_code=404, detail="Favorite not found")
        return JSONResponse(
            content={"message": "Favorite removed successfully"},
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
        raise HTTPException(status_code=500, detail=f"Error removing favorite: {str(e)}")


@router.get("/", response_model=List[UserFavoriteResponse])
async def get_favorites(
    category: Optional[FavoriteCategory] = Query(None, description="Filter by category"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of favorites to return"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's favorite foods"""
    try:
        favorites = await user_favorites_service.get_user_favorites(
            current_user.uid, category, limit
        )
        return JSONResponse(
            content=[fav.dict() if hasattr(fav, 'dict') else fav for fav in favorites],
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting favorites: {str(e)}")


@router.put("/{food_id}", response_model=UserFavoriteResponse)
async def update_favorite(
    food_id: str,
    update_data: UserFavoriteUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update a favorite food"""
    try:
        updated_favorite = await user_favorites_service.update_favorite(
            current_user.uid, food_id, update_data
        )
        if not updated_favorite:
            raise HTTPException(status_code=404, detail="Favorite not found")
        return updated_favorite
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating favorite: {str(e)}")


@router.get("/check/{food_id}")
async def check_favorite_status(
    food_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Check if a food is in user's favorites"""
    try:
        is_favorite = await user_favorites_service.is_favorite(current_user.uid, food_id)
        return {"food_id": food_id, "is_favorite": is_favorite}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking favorite status: {str(e)}")


@router.post("/usage/{food_id}")
async def increment_usage(
    food_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Increment usage count when favorite is used (called when user logs a favorite food)"""
    try:
        success = await user_favorites_service.increment_usage(current_user.uid, food_id)
        if not success:
            raise HTTPException(status_code=404, detail="Favorite not found")
        return {"message": "Usage count incremented"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error incrementing usage: {str(e)}")


@router.get("/stats", response_model=UserFavoriteStats)
async def get_favorites_stats(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's favorites statistics"""
    try:
        stats = await user_favorites_service.get_favorites_stats(current_user.uid)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting favorites stats: {str(e)}")


@router.get("/categories")
async def get_favorite_categories():
    """Get available favorite categories"""
    return {
        "categories": [
            {"value": category.value, "label": category.value.title()}
            for category in FavoriteCategory
        ]
    }


@router.options("/check/{food_id}")
async def options_check_favorite():
    """Handle preflight CORS requests for check favorite endpoint"""
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


@router.options("/usage/{food_id}")
async def options_usage():
    """Handle preflight CORS requests for usage endpoint"""
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


@router.options("/stats")
async def options_stats():
    """Handle preflight CORS requests for stats endpoint"""
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


@router.options("/categories")
async def options_categories():
    """Handle preflight CORS requests for categories endpoint"""
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
