"""
Enhanced AI Health Routes - Supports both old and new endpoint names for smooth transition
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
from datetime import date, datetime, timedelta
from pydantic import BaseModel

from .auth import get_current_user
from ..models.user import UserResponse
from ..services.ai_dashboard_service import ai_dashboard_service
from ..services.analytics_service import analytics_service

router = APIRouter(prefix="/ai-health", tags=["ai-health"])

class HealthQuestion(BaseModel):
    question: str

# Define the common function to avoid code duplication
async def _get_health_score(current_user: UserResponse) -> Dict[str, Any]:
    """Internal function to get user health score"""
    try:
        user_id = current_user.uid
        # Use the unified AI service through the dashboard service to get health score
        health_score = await ai_dashboard_service.unified_ai.get_dashboard_data(user_id, "health_score")
        return health_score
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get health score: {str(e)}")

# New preferred endpoint name
@router.get("/user-health-score", response_model=Dict[str, Any])
async def get_user_health_score(current_user: UserResponse = Depends(get_current_user)):
    """Get user health score based on nutrition and activity data"""
    return await _get_health_score(current_user)

# Keep old endpoint for backward compatibility during transition
# This helps prevent breaking changes in production
@router.get("/health-score", response_model=Dict[str, Any])
async def get_health_score_legacy(current_user: UserResponse = Depends(get_current_user)):
    """[DEPRECATED] Get user health score - Use /user-health-score instead"""
    # Log deprecation warning (if you have a logger set up)
    print("WARNING: The endpoint /ai-health/health-score is deprecated. Use /ai-health/user-health-score instead.")
    return await _get_health_score(current_user)

# Define progress analytics endpoint
async def _get_progress_analytics(current_user: UserResponse) -> Dict[str, Any]:
    """Internal function to get progress analytics"""
    try:
        user_id = current_user.uid
        # Use dashboard service for progress analytics
        progress = await ai_dashboard_service.unified_ai.get_dashboard_data(user_id, "predictions")
        return progress
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get progress analytics: {str(e)}")

@router.get("/progress-analytics", response_model=Dict[str, Any])
async def get_progress_analytics(current_user: UserResponse = Depends(get_current_user)):
    """Get progress analytics for the user"""
    return await _get_progress_analytics(current_user)

# Define health insights endpoint
async def _get_health_insights(current_user: UserResponse) -> Dict[str, Any]:
    """Internal function to get health insights"""
    try:
        user_id = current_user.uid
        # Get various analytics data for insights
        goal_progress = await analytics_service.get_goal_progress(user_id)
        nutrition_trends = await analytics_service.get_nutrition_trends(user_id, days=7)
        weekly_summary = await analytics_service.get_weekly_summary(user_id)
        
        # Combine into insights format
        insights = {
            "goal_progress": goal_progress,
            "nutrition_trends": nutrition_trends,
            "weekly_summary": weekly_summary,
            "summary": "Your health insights based on recent nutrition data"
        }
        
        return {"insights": insights, "status": "success", "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get health insights: {str(e)}")

@router.get("/insights", response_model=Dict[str, Any])
async def get_health_insights(current_user: UserResponse = Depends(get_current_user)):
    """Get AI-generated health insights based on user data"""
    return await _get_health_insights(current_user)

@router.post("/ask", response_model=Dict[str, Any])
async def ask_health_question(
    question_data: HealthQuestion,
    current_user: UserResponse = Depends(get_current_user)
):
    """Ask a health-related question to the AI assistant"""
    try:
        user_id = current_user.uid
        question = question_data.question
        
        # Get user's recent nutrition data for context
        goal_progress = await analytics_service.get_goal_progress(user_id)
        
        # Generate a response based on the question and user data
        response = {
            "question": question,
            "answer": f"Based on your nutrition data, here's my insight about '{question}': {goal_progress.get('summary', 'Keep maintaining your current healthy habits!')} For specific medical advice, please consult with a healthcare professional.",
            "generated_at": datetime.now().isoformat(),
            "user_id": user_id,
            "context_used": True
        }
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process health question: {str(e)}")
