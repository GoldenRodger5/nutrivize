"""
Direct fixes for analytics endpoints
"""

import os
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List, Optional
from ..models.user import UserResponse
from .auth import get_current_user

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("nutrivize.analytics.hotfix")

# Replace these routes with simple implementations
router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/nutrition-trends")
async def get_nutrition_trends(
    days: int = Query(30, description="Number of days to analyze (default: 30)"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get nutrition trends over specified number of days"""
    logger.info(f"Nutrition trends requested for user {current_user.uid}, days={days}")
    
    # Return basic response until full implementation is fixed
    return {
        "message": "Nutrition trends data is currently being processed",
        "data": [],
        "status": "processing"
    }

@router.get("/goal-progress")
async def get_goal_progress(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get goal progress data"""
    logger.info(f"Goal progress requested for user {current_user.uid}")
    
    # Return basic response until full implementation is fixed
    return {
        "message": "Goal progress data is currently being processed",
        "data": [],
        "status": "processing"
    }

@router.get("/food-patterns")
async def get_food_patterns(
    days: int = Query(30, description="Number of days to analyze (default: 30)"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get food patterns data"""
    logger.info(f"Food patterns requested for user {current_user.uid}, days={days}")
    
    # Return basic response until full implementation is fixed
    return {
        "message": "Food patterns data is currently being processed",
        "data": [],
        "status": "processing"
    }

@router.get("/macro-breakdown")
async def get_macro_breakdown(
    timeframe: str = Query("week", description="Timeframe for analysis: day, week, month, all"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get macro breakdown data"""
    logger.info(f"Macro breakdown requested for user {current_user.uid}, timeframe={timeframe}")
    
    # Return basic response until full implementation is fixed
    return {
        "message": "Macro breakdown data is currently being processed",
        "data": [],
        "status": "processing"
    }

@router.get("/insights")
async def get_insights(
    timeframe: str = Query("week", description="Timeframe for analysis: day, week, month, all"),
    force_refresh: bool = Query(False, description="Force refresh of insights data"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get insights data"""
    logger.info(f"Insights requested for user {current_user.uid}, timeframe={timeframe}, force_refresh={force_refresh}")
    
    # Return basic response until full implementation is fixed
    return {
        "message": "Insights data is currently being processed",
        "data": [],
        "status": "processing"
    }


@router.get("/daily-summary")
async def get_daily_summary(
    date: str = Query(None, description="Date in YYYY-MM-DD format, defaults to today"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get daily nutrition summary from actual food logs"""
    from datetime import date as dt_date
    from ..services.food_log_service import food_log_service
    
    try:
        # Use today if no date provided
        target_date = date if date else dt_date.today().isoformat()
        
        # Get actual daily logs with goal progress
        daily_data = await food_log_service.get_daily_logs_with_goal_progress(current_user.uid, target_date)
        
        if not daily_data:
            # No food logs for this date
            return {
                "date": target_date,
                "calories": {
                    "consumed": 0,
                    "target": 2000,
                    "remaining": 2000,
                    "percentage": 0
                },
                "macros": {
                    "protein": {"consumed": 0, "target": 150, "percentage": 0},
                    "carbs": {"consumed": 0, "target": 250, "percentage": 0},
                    "fat": {"consumed": 0, "target": 65, "percentage": 0}
                },
                "foods_logged": 0,
                "meals": 0,
                "status": "success"
            }
        
        # Extract nutrition summary
        nutrition_summary = daily_data.get("nutrition_summary", {})
        goal_progress = daily_data.get("goal_progress", {})
        
        # Calculate actual consumed values
        calories_consumed = round(nutrition_summary.get("calories", 0))
        calories_target = goal_progress.get("calories", {}).get("target", 2000)
        calories_remaining = max(0, calories_target - calories_consumed)
        calories_percentage = min(100, round((calories_consumed / calories_target) * 100)) if calories_target > 0 else 0
        
        protein_consumed = round(nutrition_summary.get("protein", 0), 1)
        protein_target = goal_progress.get("protein", {}).get("target", 150)
        protein_percentage = min(100, round((protein_consumed / protein_target) * 100)) if protein_target > 0 else 0
        
        carbs_consumed = round(nutrition_summary.get("carbs", 0), 1)
        carbs_target = goal_progress.get("carbs", {}).get("target", 250)
        carbs_percentage = min(100, round((carbs_consumed / carbs_target) * 100)) if carbs_target > 0 else 0
        
        fat_consumed = round(nutrition_summary.get("fat", 0), 1)
        fat_target = goal_progress.get("fat", {}).get("target", 65)
        fat_percentage = min(100, round((fat_consumed / fat_target) * 100)) if fat_target > 0 else 0
        
        # Count foods and meals
        food_logs = daily_data.get("food_logs", [])
        foods_logged = len(food_logs)
        meals = len(set(log.get("meal_type", "unknown") for log in food_logs))
        
        return {
            "date": target_date,
            "calories": {
                "consumed": calories_consumed,
                "target": calories_target,
                "remaining": calories_remaining,
                "percentage": calories_percentage
            },
            "macros": {
                "protein": {"consumed": protein_consumed, "target": protein_target, "percentage": protein_percentage},
                "carbs": {"consumed": carbs_consumed, "target": carbs_target, "percentage": carbs_percentage},
                "fat": {"consumed": fat_consumed, "target": fat_target, "percentage": fat_percentage}
            },
            "foods_logged": foods_logged,
            "meals": meals,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error getting daily summary for user {current_user.uid}: {e}")
        # Return fallback data on error
        return {
            "date": date if date else dt_date.today().isoformat(),
            "calories": {
                "consumed": 0,
                "target": 2000,
                "remaining": 2000,
                "percentage": 0
            },
            "macros": {
                "protein": {"consumed": 0, "target": 150, "percentage": 0},
                "carbs": {"consumed": 0, "target": 250, "percentage": 0},
                "fat": {"consumed": 0, "target": 65, "percentage": 0}
            },
            "foods_logged": 0,
            "meals": 0,
            "status": "error",
            "error": str(e)
        }
