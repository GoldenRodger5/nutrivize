from fastapi import APIRouter, Depends, HTTPException
from ..routes.auth import get_current_user
from ..models.user import UserResponse
from ..services.user_service import user_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])


@router.get("/profile")
async def get_user_profile(current_user: UserResponse = Depends(get_current_user)):
    """Get user profile information"""
    try:
        profile = await user_service.get_user_profile(current_user.uid)
        return profile
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user profile")


@router.put("/profile")
async def update_user_profile(
    profile_data: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update user profile information"""
    try:
        updated_profile = await user_service.update_user_profile(current_user.uid, profile_data)
        return updated_profile
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user profile")


@router.get("/preferences")
async def get_user_preferences(current_user: UserResponse = Depends(get_current_user)):
    """Get user preferences"""
    try:
        preferences = await user_service.get_user_preferences(current_user.uid)
        return preferences
    except Exception as e:
        logger.error(f"Error getting user preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user preferences")


@router.put("/preferences")
async def update_user_preferences(
    preferences_data: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update user preferences"""
    try:
        updated_preferences = await user_service.update_user_preferences(current_user.uid, preferences_data)
        return updated_preferences
    except Exception as e:
        logger.error(f"Error updating user preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user preferences")
