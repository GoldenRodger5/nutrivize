from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from datetime import datetime

from .auth import get_current_user
from ..models.user import (
    UserResponse, 
    OnboardingStepRequest, 
    OnboardingCompleteRequest,
    OnboardingStatusResponse,
    OnboardingBasicProfile,
    OnboardingHealthGoals,
    OnboardingNutritionTargets,
    OnboardingAppPreferences
)
from ..services.user_service import user_service
from ..services.onboarding_service import onboarding_service

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post("/start")
async def start_onboarding(current_user: UserResponse = Depends(get_current_user)):
    """Initialize onboarding session for user"""
    try:
        result = await onboarding_service.start_onboarding(current_user.uid)
        return {
            "message": "Onboarding started successfully",
            "user_id": current_user.uid,
            "current_step": result["current_step"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start onboarding: {str(e)}")


@router.get("/status")
async def get_onboarding_status(current_user: UserResponse = Depends(get_current_user)) -> OnboardingStatusResponse:
    """Get current onboarding status and progress"""
    try:
        status = await onboarding_service.get_onboarding_status(current_user.uid)
        return OnboardingStatusResponse(**status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get onboarding status: {str(e)}")


@router.post("/step/{step_number}")
async def save_onboarding_step(
    step_number: int,
    step_data: Dict[str, Any],
    current_user: UserResponse = Depends(get_current_user)
):
    """Save progress for a specific onboarding step"""
    try:
        # Validate step number
        if step_number < 1 or step_number > 6:
            raise HTTPException(status_code=400, detail="Invalid step number. Must be between 1 and 6.")
        
        result = await onboarding_service.save_step_data(
            user_id=current_user.uid,
            step=step_number,
            data=step_data
        )
        
        return {
            "message": f"Step {step_number} saved successfully",
            "current_step": result["current_step"],
            "profile_completeness_score": result["profile_completeness_score"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save step data: {str(e)}")


@router.post("/complete")
async def complete_onboarding(
    onboarding_data: OnboardingCompleteRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Complete the onboarding process with all collected data"""
    try:
        result = await onboarding_service.complete_onboarding(
            user_id=current_user.uid,
            onboarding_data=onboarding_data
        )
        
        return {
            "message": "Onboarding completed successfully",
            "profile_completeness_score": result["profile_completeness_score"],
            "user_profile": result["user_profile"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete onboarding: {str(e)}")


@router.post("/skip")
async def skip_onboarding(current_user: UserResponse = Depends(get_current_user)):
    """Skip onboarding with minimal profile setup"""
    try:
        result = await onboarding_service.skip_onboarding(current_user.uid)
        return {
            "message": "Onboarding skipped. You can complete your profile later in settings.",
            "profile_completeness_score": result["profile_completeness_score"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to skip onboarding: {str(e)}")


@router.get("/recommendations")
async def get_personalized_recommendations(current_user: UserResponse = Depends(get_current_user)):
    """Get personalized recommendations based on current profile data"""
    try:
        recommendations = await onboarding_service.get_recommendations(current_user.uid)
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")


@router.post("/calculate-calories")
async def calculate_recommended_calories(
    basic_profile: OnboardingBasicProfile,
    health_goals: OnboardingHealthGoals,
    current_user: UserResponse = Depends(get_current_user)
):
    """Calculate recommended daily calories based on profile and goals"""
    try:
        calories = await onboarding_service.calculate_calorie_needs(
            user_id=current_user.uid,
            basic_profile=basic_profile,
            health_goals=health_goals
        )
        return {
            "recommended_calories": calories["daily_calories"],
            "bmr": calories["bmr"],
            "tdee": calories["tdee"],
            "adjustment_factor": calories["adjustment_factor"],
            "explanation": calories["explanation"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate calories: {str(e)}")
