"""
AI Health Routes - Enhanced health analytics endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from ..routes.auth import get_current_user
from ..models.user import UserResponse
from ..services.ai_health_analysis import ai_health_analysis_service
from typing import Dict, Any

router = APIRouter(prefix="/ai-health", tags=["ai-health"])

@router.get("/health-score", response_model=Dict[str, Any])
async def get_enhanced_health_score(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get comprehensive AI-powered health score with detailed insights"""
    try:
        health_score_data = await ai_health_analysis_service.get_enhanced_health_score(current_user.uid)
        return health_score_data
    except Exception as e:
        print(f"Error in health-score endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating health score: {str(e)}")

@router.get("/progress-analytics", response_model=Dict[str, Any])
async def get_progress_analytics(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get detailed progress analytics with milestones and predictions"""
    try:
        progress_data = await ai_health_analysis_service.get_progress_analytics(current_user.uid)
        return progress_data
    except Exception as e:
        print(f"Error in progress-analytics endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating progress analytics: {str(e)}")

@router.get("/insights", response_model=Dict[str, Any])
async def get_ai_health_insights(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get AI-powered health insights and recommendations"""
    try:
        # Get both health score and progress data for comprehensive insights
        health_score = await ai_health_analysis_service.get_enhanced_health_score(current_user.uid)
        progress_analytics = await ai_health_analysis_service.get_progress_analytics(current_user.uid)
        
        return {
            "health_score": health_score,
            "progress_analytics": progress_analytics,
            "last_updated": health_score.get("last_updated")
        }
    except Exception as e:
        print(f"Error in insights endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")
