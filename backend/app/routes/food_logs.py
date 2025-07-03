from fastapi import APIRouter, Depends, HTTPException, Query
from ..routes.auth import get_current_user
from ..models.user import UserResponse
from ..models.food_log import FoodLogCreate, FoodLogResponse, DailyNutritionSummary
from ..services.food_log_service import food_log_service
from ..services.ai_dashboard_cache_service import ai_dashboard_cache_service
from typing import List
from datetime import date
import logging

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/food-logs", tags=["food_logs"])


@router.post("/", response_model=FoodLogResponse)
async def log_food(
    log_data: FoodLogCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Log a food entry"""
    try:
        food_log = await food_log_service.log_food(log_data, current_user.uid)
        
        # Invalidate AI dashboard cache since nutrition data has changed
        try:
            await ai_dashboard_cache_service.invalidate_user_cache(current_user.uid)
            logger.info(f"Invalidated AI dashboard cache for user {current_user.uid} after food log")
        except Exception as cache_error:
            logger.warning(f"Failed to invalidate cache after food log: {cache_error}")
            # Don't fail the request if cache invalidation fails
        
        return food_log
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/daily/{target_date}", response_model=DailyNutritionSummary)
async def get_daily_logs(
    target_date: date,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all food logs for a specific date"""
    daily_summary = await food_log_service.get_daily_logs(current_user.uid, target_date)
    return daily_summary


@router.get("/daily/{target_date}/with-goals")
async def get_daily_logs_with_goals(
    target_date: date,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get daily food logs with active goal progress tracking"""
    try:
        daily_data = await food_log_service.get_daily_logs_with_goal_progress(current_user.uid, target_date)
        return daily_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get daily logs with goals: {str(e)}")


@router.get("/range", response_model=List[DailyNutritionSummary])
async def get_logs_range(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get food logs for a date range"""
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    try:
        summaries = await food_log_service.get_date_range_logs(current_user.uid, start_date, end_date)
        return summaries
    except Exception as e:
        logger.error(f"Error getting logs range for user {current_user.uid}: {str(e)}")
        # Return empty summaries instead of throwing a 500 error
        return []


@router.put("/{log_id}", response_model=FoodLogResponse)
async def update_food_log(
    log_id: str,
    updates: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update a food log entry"""
    food_log = await food_log_service.update_food_log(log_id, updates, current_user.uid)
    if not food_log:
        raise HTTPException(status_code=404, detail="Food log entry not found")
    
    # Invalidate AI dashboard cache since nutrition data has changed
    try:
        await ai_dashboard_cache_service.invalidate_user_cache(current_user.uid)
        logger.info(f"Invalidated AI dashboard cache for user {current_user.uid} after food log update")
    except Exception as cache_error:
        logger.warning(f"Failed to invalidate cache after food log update: {cache_error}")
        # Don't fail the request if cache invalidation fails
    
    return food_log


@router.delete("/{log_id}")
async def delete_food_log(
    log_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete a food log entry"""
    success = await food_log_service.delete_food_log(log_id, current_user.uid)
    if not success:
        raise HTTPException(status_code=404, detail="Food log entry not found")
    
    # Invalidate AI dashboard cache since nutrition data has changed
    try:
        await ai_dashboard_cache_service.invalidate_user_cache(current_user.uid)
        logger.info(f"Invalidated AI dashboard cache for user {current_user.uid} after food log deletion")
    except Exception as cache_error:
        logger.warning(f"Failed to invalidate cache after food log deletion: {cache_error}")
        # Don't fail the request if cache invalidation fails
    
    return {"message": "Food log entry deleted successfully"}
