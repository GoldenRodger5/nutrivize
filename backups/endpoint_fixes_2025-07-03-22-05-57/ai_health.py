from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
from datetime import date, datetime, timedelta

from .auth import get_current_user
from ..models.user import UserResponse
from ..services.ai_service import AIService
from ..services.analytics_service import analytics_service

router = APIRouter(prefix="/ai-health", tags=["ai-health"])

# Renamed endpoint to avoid conflict with ai_dashboard.py
@router.get("/user-health-score", response_model=Dict[str, Any])
async def get_health_score(current_user: UserResponse = Depends(get_current_user)):
    """Get user health score based on nutrition and activity data"""
    try:
        user_id = current_user.uid
        ai_service = AIService()
        health_score = await ai_service.get_user_health_score(user_id)
        return health_score
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get health score: {str(e)}")

@router.get("/progress-analytics", response_model=Dict[str, Any])
async def get_progress_analytics(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get progress analytics for the user"""
    try:
        user_id = current_user.uid
        ai_service = AIService()
        progress = await ai_service.get_progress_analytics(user_id)
        return progress
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get progress analytics: {str(e)}")

@router.get("/insights", response_model=Dict[str, Any])
async def get_health_insights(current_user: UserResponse = Depends(get_current_user)):
    """Get AI-generated health insights based on user data"""
    try:
        user_id = current_user.uid
        ai_service = AIService()
        insights = await ai_service.get_health_insights(user_id)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get health insights: {str(e)}")
