from fastapi import APIRouter, Depends, HTTPException
from ..routes.auth import get_current_user
from ..models.user import UserResponse
from ..models.goal import GoalCreate, GoalResponse, NutritionTargets
from ..services.goals_service import goals_service
from typing import List


router = APIRouter(prefix="/goals", tags=["goals"])


@router.post("/", response_model=GoalResponse)
async def create_goal(
    goal_data: GoalCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new nutrition/fitness goal"""
    try:
        # Deactivate existing goals if this is set as active
        if goal_data.is_active:
            await goals_service.deactivate_all_goals(current_user.uid)
        
        goal = await goals_service.create_goal(goal_data, current_user.uid)
        return goal
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[GoalResponse])
async def get_user_goals(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all goals for the current user"""
    goals = await goals_service.get_user_goals(current_user.uid)
    return goals


@router.get("/active", response_model=GoalResponse)
async def get_active_goal(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get the current active goal"""
    goal = await goals_service.get_active_goal(current_user.uid)
    if not goal:
        raise HTTPException(status_code=404, detail="No active goal found")
    return goal


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str,
    updates: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update a goal"""
    # If setting as active, deactivate others
    if updates.get("is_active"):
        await goals_service.deactivate_all_goals(current_user.uid)
    
    goal = await goals_service.update_goal(goal_id, updates, current_user.uid)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete a goal"""
    success = await goals_service.delete_goal(goal_id, current_user.uid)
    if not success:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted successfully"}


@router.get("/user-goals", response_model=List[GoalResponse])
async def get_user_goals_alias(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all goals for the current user (alias endpoint)"""
    goals = await goals_service.get_user_goals(current_user.uid)
    return goals


@router.post("/calculate-targets", response_model=NutritionTargets)
async def calculate_nutrition_targets(
    user_data: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    """Calculate nutrition targets based on user data"""
    try:
        targets = await goals_service.calculate_nutrition_targets(user_data)
        return targets
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
