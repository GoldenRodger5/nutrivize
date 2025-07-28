from fastapi import APIRouter, Depends, HTTPException, Query
from ..routes.auth import get_current_user
from ..models.user import UserResponse
from ..models.food_log import FoodLogCreate, FoodLogResponse, DailyNutritionSummary
from ..services.food_log_service import food_log_service
from ..services.ai_dashboard_cache_service import ai_dashboard_cache_service
from ..services.user_service import user_service
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
        
        # Automatically add to recent foods
        try:
            nutrition_dict = {
                "calories": log_data.nutrition.calories,
                "protein": log_data.nutrition.protein,
                "carbs": log_data.nutrition.carbs,
                "fat": log_data.nutrition.fat,
                "fiber": log_data.nutrition.fiber,
                "sugar": log_data.nutrition.sugar,
                "sodium": log_data.nutrition.sodium,
            }
            await user_service.add_to_recent_foods_from_log(
                current_user.uid,
                log_data.food_id,
                log_data.food_name,
                log_data.amount,
                log_data.unit,
                nutrition_dict
            )
            logger.info(f"Added food {log_data.food_name} to recent foods for user {current_user.uid}")
        except Exception as recent_error:
            logger.warning(f"Failed to add to recent foods: {recent_error}")
            # Don't fail the request if adding to recent foods fails
        
        # Update favorite usage if this food is in favorites
        try:
            from ..services.user_favorites_service import user_favorites_service
            await user_favorites_service.update_favorite_usage(current_user.uid, log_data.food_id)
            logger.info(f"Updated favorite usage for food {log_data.food_id} for user {current_user.uid}")
        except Exception as favorite_error:
            logger.warning(f"Failed to update favorite usage: {favorite_error}")
            # Don't fail the request if updating favorite usage fails
        
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
    import logging
    log = logging.getLogger(__name__)
    
    try:
        log.info(f"🔍 Getting daily logs with goals for user {current_user.uid} on {target_date}")
        daily_data = await food_log_service.get_daily_logs_with_goal_progress(current_user.uid, target_date)
        log.info(f"✅ Successfully returned daily logs with goals for {target_date}")
        return daily_data
    except ValueError as ve:
        log.error(f"❌ Validation error for {current_user.uid} on {target_date}: {ve}")
        raise HTTPException(status_code=400, detail=f"Invalid data for date {target_date}: {str(ve)}")
    except KeyError as ke:
        log.error(f"❌ Missing field error for {current_user.uid} on {target_date}: {ke}")
        raise HTTPException(status_code=500, detail=f"Missing required field: {str(ke)}")
    except Exception as e:
        log.error(f"❌ Unexpected error for {current_user.uid} on {target_date}: {e}")
        log.exception("Full traceback:")
        # Return a safe fallback instead of 500 error
        return {
            "date": target_date.isoformat(),
            "food_logs": [],
            "nutrition_summary": {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fat": 0,
                "fiber": 0,
                "sugar": 0,
                "sodium": 0
            },
            "water_summary": {
                "current": 0,
                "target": 64,
                "percentage": 0
            },
            "goal_progress": None,
            "error": f"Data temporarily unavailable for {target_date}"
        }


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


@router.get("/range")
async def get_food_logs_range(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get food logs for a date range"""
    try:
        food_logs = await food_log_service.get_food_logs_range(current_user.uid, start_date, end_date)
        return food_logs
    except Exception as e:
        logger.error(f"Error fetching food logs range: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching food logs: {str(e)}")
