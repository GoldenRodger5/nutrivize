from fastapi import APIRouter, Depends, HTTPException, Query
from ..routes.auth import get_current_user
from ..models.user import UserResponse
from ..models.weight_log import WeightLogCreate, WeightLogResponse
from ..services.weight_log_service import weight_log_service
from typing import List, Optional
from datetime import date


router = APIRouter(prefix="/weight-logs", tags=["weight_logs"])


@router.post("/", response_model=WeightLogResponse)
async def log_weight(
    log_data: WeightLogCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Log a weight entry"""
    try:
        weight_log = await weight_log_service.log_weight(log_data, current_user.uid)
        return weight_log
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[WeightLogResponse])
async def get_weight_logs(
    start_date: Optional[date] = Query(None, description="Start date for filtering"),
    end_date: Optional[date] = Query(None, description="End date for filtering"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get weight logs for the current user"""
    weight_logs = await weight_log_service.get_weight_logs(
        current_user.uid, start_date, end_date
    )
    return weight_logs


@router.get("/latest", response_model=WeightLogResponse)
async def get_latest_weight(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get the most recent weight entry"""
    latest_weight = await weight_log_service.get_latest_weight(current_user.uid)
    if not latest_weight:
        raise HTTPException(status_code=404, detail="No weight logs found")
    return latest_weight


@router.put("/{log_id}", response_model=WeightLogResponse)
async def update_weight_log(
    log_id: str,
    updates: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update a weight log entry"""
    weight_log = await weight_log_service.update_weight_log(log_id, updates, current_user.uid)
    if not weight_log:
        raise HTTPException(status_code=404, detail="Weight log entry not found")
    return weight_log


@router.delete("/{log_id}")
async def delete_weight_log(
    log_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete a weight log entry"""
    success = await weight_log_service.delete_weight_log(log_id, current_user.uid)
    if not success:
        raise HTTPException(status_code=404, detail="Weight log entry not found")
    return {"message": "Weight log entry deleted successfully"}
