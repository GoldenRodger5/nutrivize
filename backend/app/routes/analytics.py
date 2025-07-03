from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List, Optional
from datetime import date, datetime, timedelta
from pydantic import BaseModel
import json

from .auth import get_current_user
from ..models.user import UserResponse
from ..services.analytics_service import analytics_service
from ..core.error_handler import handle_analytics_error, DataNotFoundError, DatabaseError

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Pydantic models for analytics responses
class InsightModel(BaseModel):
    id: str
    title: str
    content: str
    category: str  # nutrition, progress, habit, recommendation
    importance: int  # 1-3, with 3 being most important

class StatisticModel(BaseModel):
    name: str
    value: float
    unit: str
    trend: Optional[float] = None  # percentage change from previous period
    trend_direction: Optional[str] = None  # "up", "down", or "same"

class ChartDataModel(BaseModel):
    chart_type: str  # "line", "bar", "pie", etc.
    title: str
    data: Dict[str, Any]  # Flexible structure for chart data

class AnalyticsResponse(BaseModel):
    insights: List[InsightModel]
    statistics: List[StatisticModel]
    charts: List[ChartDataModel]
    generated_at: datetime
    is_cached: bool = False


@router.get("/weekly-summary")
async def get_weekly_summary
    args: Optional[str] = Query(None, description="Optional arguments"),
    kwargs: Optional[str] = Query(None, description="Optional keyword arguments"),
    
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
    args: Optional[str] = Query(None, description="Optional arguments"),
    kwargs: Optional[str] = Query(None, description="Optional keyword arguments"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get weekly nutrition summary"""
    try:
        user_id = current_user.uid
        
        # Parse end_date if provided
        parsed_end_date = None
        if end_date:
            try:
                parsed_end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        summary = await analytics_service.get_weekly_summary(user_id, parsed_end_date)
        return summary
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get weekly summary: {str(e)}")


@router.get("/monthly-summary")
async def get_monthly_summary
    args: Optional[str] = Query(None, description="Optional arguments"),
    kwargs: Optional[str] = Query(None, description="Optional keyword arguments"),
    
    year: Optional[int] = Query(None, description="Year (default: current year)"),
    month: Optional[int] = Query(None, description="Month 1-12 (default: current month)"),
    args: Optional[str] = Query(None, description="Optional arguments"),
    kwargs: Optional[str] = Query(None, description="Optional keyword arguments"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get monthly nutrition summary"""
    try:
        user_id = current_user.uid
        summary = await analytics_service.get_monthly_summary(user_id, year, month)
        return summary
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get monthly summary: {str(e)}")


@router.get("/insights")
@handle_analytics_error
async def get_ai_insights(
    timeframe: str = Query("week", description="Timeframe: 'week', 'month', or 'all'"),
    force_refresh: bool = Query(False, description="Force refresh insights (skip cache)"),
    args: Optional[str] = Query(None, description="Optional arguments"),
    kwargs: Optional[str] = Query(None, description="Optional keyword arguments"),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Generate AI-powered insights based on user's food logs, nutrition patterns, and goals.
    Returns personalized insights about nutrition habits, progress, and recommendations.
    """
    user_id = current_user.uid
    
    # Validate timeframe
    if timeframe not in ["week", "month", "all"]:
        raise HTTPException(status_code=400, detail="Timeframe must be 'week', 'month', or 'all'")
    
    # Get insights from analytics service
    insights_data = await analytics_service.generate_ai_insights(
        user_id=user_id,
        timeframe=timeframe,
        force_refresh=force_refresh
    )
    
    # If no insights, return empty structure
    if not insights_data or (isinstance(insights_data, dict) and not insights_data.get("insights")):
        return {
            "message": f"No insights available for {timeframe}. Try adding more food logs.",
            "insights": [],
            "summary": "No summary available",
            "insightsCount": 0,
            "trendsCount": 0
        }
    
    return insights_data


@router.get("/nutrition-trends")
@handle_analytics_error
async def get_nutrition_trends(
    days: int = Query(30, description="Number of days to analyze (default: 30)"),
    args: Optional[str] = Query(None, description="Optional arguments"),
    kwargs: Optional[str] = Query(None, description="Optional keyword arguments"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get nutrition trends over specified number of days"""
    user_id = current_user.uid
    
    if days < 1 or days > 365:
        raise HTTPException(status_code=400, detail="Days must be between 1 and 365")
    
    trends = await analytics_service.get_nutrition_trends(user_id, days)
    
    # If no data, return empty response instead of error
    if not trends or (isinstance(trends, dict) and not trends.get("data")):
        return {
            "message": f"No nutrition trend data available for the last {days} days",
            "data": [],
            "trends": []
        }
        
    return trends


@router.get("/goal-progress")
@handle_analytics_error
async def get_goal_progress(
    args: Optional[str] = Query(None, description="Optional arguments"),
    kwargs: Optional[str] = Query(None, description="Optional keyword arguments"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get progress towards user's nutrition and health goals"""
    user_id = current_user.uid
    progress = await analytics_service.get_goal_progress(user_id)
    
    # If no goals or progress data, return default empty structure
    if not progress or (isinstance(progress, dict) and not progress.get("goals")):
        return {
            "message": "No goal progress data available",
            "goals": [],
            "overall_progress": 0,
            "recent_achievements": []
        }
    
    return progress


@router.get("/food-patterns")
@handle_analytics_error
async def get_food_patterns(
    days: int = Query(30, description="Number of days to analyze (default: 30)"),
    args: Optional[str] = Query(None, description="Optional arguments"),
    kwargs: Optional[str] = Query(None, description="Optional keyword arguments"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Analyze food consumption patterns and habits"""
    user_id = current_user.uid
    
    if days < 1 or days > 365:
        raise HTTPException(status_code=400, detail="Days must be between 1 and 365")
    
    patterns = await analytics_service.analyze_food_patterns(user_id, days)
    
    # If no patterns found, return empty structure
    if not patterns or (isinstance(patterns, dict) and not patterns.get("patterns")):
        return {
            "message": f"No food pattern data available for the last {days} days",
            "patterns": [],
            "meal_frequency": {},
            "top_foods": []
        }
    
    return patterns


@router.get("/macro-breakdown")
@handle_analytics_error
async def get_macro_breakdown(
    timeframe: str = Query("week", description="Timeframe: 'week' or 'month'"),
    args: Optional[str] = Query(None, description="Optional arguments"),
    kwargs: Optional[str] = Query(None, description="Optional keyword arguments"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get detailed macronutrient breakdown with visualizations"""
    user_id = current_user.uid
    
    if timeframe not in ["week", "month"]:
        raise HTTPException(status_code=400, detail="Timeframe must be 'week' or 'month'")
    
    breakdown = await analytics_service.get_macro_breakdown(user_id, timeframe)
    
    # If no data, return empty response instead of error
    if not breakdown or (isinstance(breakdown, dict) and not breakdown.get("data")):
        return {
            "message": f"No macro data available for {timeframe}",
            "data": [],
            "total": {"protein": 0, "carbs": 0, "fat": 0},
            "percentages": {"protein": 0, "carbs": 0, "fat": 0}
        }
        
    return breakdown


@router.delete("/insights/cache")
async def clear_insights_cache(
    current_user: UserResponse = Depends(get_current_user)
):
    """Clear cached insights for the current user"""
    try:
        user_id = current_user.uid
        result = await analytics_service.clear_insights_cache(user_id)
        return {"message": f"Cleared {result} cached insights"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear insights cache: {str(e)}")
