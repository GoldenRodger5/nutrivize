from fastapi import APIRouter, Depends, HTTPException, Query
from ..routes.auth import get_current_user
from ..models.user import UserResponse
from ..models.water_log import WaterLogCreate, WaterLogResponse, DailyWaterSummary
from ..services.water_log_service import water_log_service
from ..services.ai_dashboard_cache_service import ai_dashboard_cache_service
from typing import List, Optional
from datetime import date
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/water-logs", tags=["water_logs"])


@router.post("/", response_model=WaterLogResponse)
async def log_water(
    log_data: WaterLogCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Log a water intake entry"""
    try:
        water_log = await water_log_service.log_water(log_data, current_user.uid)
        
        # Invalidate AI dashboard cache since hydration data has changed
        try:
            await ai_dashboard_cache_service.invalidate_user_cache(current_user.uid)
            logger.info(f"Invalidated AI dashboard cache for user {current_user.uid} after water log")
        except Exception as cache_error:
            logger.warning(f"Failed to invalidate cache after water log: {cache_error}")
        
        return water_log
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[WaterLogResponse])
async def get_water_logs(
    start_date: Optional[date] = Query(None, description="Start date for filtering"),
    end_date: Optional[date] = Query(None, description="End date for filtering"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get water logs for the current user"""
    water_logs = await water_log_service.get_water_logs(
        current_user.uid, start_date, end_date
    )
    return water_logs


@router.get("/daily/{target_date}", response_model=DailyWaterSummary)
async def get_daily_water_summary(
    target_date: date,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get daily water intake summary"""
    summary = await water_log_service.get_daily_water_summary(current_user.uid, target_date)
    return summary


@router.get("/recent", response_model=List[WaterLogResponse])
async def get_recent_water_logs(
    limit: int = Query(5, ge=1, le=20, description="Number of recent logs to return"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get recent water logs"""
    logs = await water_log_service.get_latest_water_logs(current_user.uid, limit)
    return logs


@router.put("/{log_id}", response_model=WaterLogResponse)
async def update_water_log(
    log_id: str,
    updates: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update a water log entry"""
    water_log = await water_log_service.update_water_log(log_id, updates, current_user.uid)
    if not water_log:
        raise HTTPException(status_code=404, detail="Water log entry not found")
    
    # Invalidate AI dashboard cache since hydration data has changed
    try:
        await ai_dashboard_cache_service.invalidate_user_cache(current_user.uid)
        logger.info(f"Invalidated AI dashboard cache for user {current_user.uid} after water log update")
    except Exception as cache_error:
        logger.warning(f"Failed to invalidate cache after water log update: {cache_error}")
    
    return water_log


@router.delete("/{log_id}")
async def delete_water_log(
    log_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete a water log entry"""
    success = await water_log_service.delete_water_log(log_id, current_user.uid)
    if not success:
        raise HTTPException(status_code=404, detail="Water log entry not found")
    
    # Invalidate AI dashboard cache since hydration data has changed
    try:
        await ai_dashboard_cache_service.invalidate_user_cache(current_user.uid)
        logger.info(f"Invalidated AI dashboard cache for user {current_user.uid} after water log deletion")
    except Exception as cache_error:
        logger.warning(f"Failed to invalidate cache after water log deletion: {cache_error}")
    
    return {"message": "Water log entry deleted successfully"}
