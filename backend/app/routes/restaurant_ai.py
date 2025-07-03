"""
Restaurant AI API Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
import logging

from ..services.restaurant_ai_service import (
    restaurant_ai_service,
    MenuAnalysisRequest,
    MenuAnalysisResult,
    VisualNutritionRequest,
    VisualNutritionResult
)
from ..routes.auth import get_current_user
from ..models.user import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/restaurant-ai", tags=["restaurant-ai"])

@router.post("/analyze", response_model=MenuAnalysisResult)
async def analyze_menu(
    request: MenuAnalysisRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Analyze a restaurant menu and get AI-powered recommendations"""
    try:
        result = await restaurant_ai_service.analyze_menu(request, current_user.uid)
        return result
    except Exception as e:
        logger.error(f"Error analyzing menu for user {current_user.uid}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/analyses", response_model=List[MenuAnalysisResult])
async def get_user_analyses(
    limit: Optional[int] = 20,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's previous menu analyses"""
    try:
        analyses = await restaurant_ai_service.get_user_analyses(current_user.uid, limit)
        return analyses
    except Exception as e:
        logger.error(f"Error getting analyses for user {current_user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get analyses")

@router.get("/analyses/{analysis_id}", response_model=MenuAnalysisResult)
async def get_analysis(
    analysis_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a specific menu analysis by ID"""
    try:
        analysis = await restaurant_ai_service.get_analysis_by_id(analysis_id, current_user.uid)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return analysis
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analysis {analysis_id} for user {current_user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get analysis")

@router.post("/visual-nutrition", response_model=VisualNutritionResult)
async def analyze_visual_nutrition(
    request: VisualNutritionRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Analyze meal image for accurate portion-based nutrition estimation"""
    try:
        result = await restaurant_ai_service.analyze_visual_nutrition(request, current_user.uid)
        return result
    except Exception as e:
        logger.error(f"Error analyzing visual nutrition for user {current_user.uid}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/visual-nutrition/{menu_analysis_id}/{item_id}", response_model=VisualNutritionResult)
async def get_cached_visual_nutrition(
    menu_analysis_id: str,
    item_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get cached visual nutrition analysis for a menu item"""
    try:
        result = await restaurant_ai_service.get_cached_visual_nutrition(
            current_user.uid, menu_analysis_id, item_id
        )
        if not result:
            raise HTTPException(status_code=404, detail="Visual nutrition analysis not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting cached visual nutrition for user {current_user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get visual nutrition analysis")
