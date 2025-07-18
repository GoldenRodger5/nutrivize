from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from ..routes.auth import get_current_user
from ..models.user import UserResponse
from ..services.ai_coaching_service import ai_coaching_service
from ..services.unified_ai_service import unified_ai_service
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import logging
import base64
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai-coaching"])

# Pydantic models for AI coaching
class RestaurantMenuAnalysisRequest(BaseModel):
    analysis_type: str = Field(..., description="Type of analysis: 'text', 'image', or 'url'")
    content: str = Field(..., description="Menu text, base64 image, or URL")
    dietary_preferences: Optional[List[str]] = Field(default=[], description="User dietary preferences")
    health_goals: Optional[List[str]] = Field(default=[], description="User health goals")

class RestaurantMenuAnalysisResponse(BaseModel):
    analysis_id: str
    restaurant_name: Optional[str] = None
    menu_items: List[Dict[str, Any]]
    nutritional_analysis: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    confidence_score: float
    health_score: float
    dietary_compatibility: Dict[str, Any]

class HealthInsightsRequest(BaseModel):
    time_range: str = Field(default="30d", description="Time range for analysis")
    insight_types: List[str] = Field(default=["nutrition", "activity", "trends"], description="Types of insights to generate")
    include_recommendations: bool = Field(default=True, description="Include actionable recommendations")

class HealthInsightsResponse(BaseModel):
    insights: List[Dict[str, Any]]
    health_score: float
    trends: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    next_review_date: str

class CoachingSessionRequest(BaseModel):
    question: str = Field(..., description="User's question or concern")
    category: str = Field(default="general", description="Category of question")
    context: Optional[Dict[str, Any]] = Field(default={}, description="Additional context")

class CoachingSessionResponse(BaseModel):
    session_id: str
    response: str
    recommendations: List[Dict[str, Any]]
    follow_up_questions: List[str]
    resources: List[Dict[str, Any]]

class PersonalizedPlanRequest(BaseModel):
    goal_type: str = Field(..., description="Type of goal: weight_loss, muscle_gain, maintenance, etc.")
    target_timeframe: str = Field(..., description="Target timeframe for goal")
    current_metrics: Dict[str, Any] = Field(..., description="Current health metrics")
    preferences: Dict[str, Any] = Field(default={}, description="User preferences and constraints")

class PersonalizedPlanResponse(BaseModel):
    plan_id: str
    plan_type: str
    duration_weeks: int
    daily_targets: Dict[str, Any]
    meal_plan: Dict[str, Any]
    exercise_plan: Dict[str, Any]
    milestones: List[Dict[str, Any]]
    tracking_recommendations: List[str]

@router.post("/analyze-restaurant-menu", response_model=RestaurantMenuAnalysisResponse)
async def analyze_restaurant_menu(
    request: RestaurantMenuAnalysisRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """AI-powered restaurant menu analysis with nutritional insights"""
    try:
        # Get user preferences and health goals
        user_context = await ai_coaching_service.get_user_context(current_user.uid)
        
        # Perform menu analysis
        analysis = await ai_coaching_service.analyze_restaurant_menu(
            analysis_type=request.analysis_type,
            content=request.content,
            dietary_preferences=request.dietary_preferences or user_context.get("dietary_preferences", []),
            health_goals=request.health_goals or user_context.get("health_goals", []),
            user_id=current_user.uid
        )
        
        return analysis
    except Exception as e:
        logger.error(f"Restaurant menu analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Menu analysis failed: {str(e)}")

@router.post("/analyze-restaurant-menu/image")
async def analyze_restaurant_menu_image(
    image: UploadFile = File(...),
    dietary_preferences: str = Form(default="[]"),
    health_goals: str = Form(default="[]"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Analyze restaurant menu from uploaded image"""
    try:
        # Validate image type
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and encode image
        image_data = await image.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Parse form data
        try:
            dietary_prefs = json.loads(dietary_preferences) if dietary_preferences else []
            health_goals_list = json.loads(health_goals) if health_goals else []
        except json.JSONDecodeError:
            dietary_prefs = []
            health_goals_list = []
        
        # Create analysis request
        analysis_request = RestaurantMenuAnalysisRequest(
            analysis_type="image",
            content=image_base64,
            dietary_preferences=dietary_prefs,
            health_goals=health_goals_list
        )
        
        # Perform analysis
        analysis = await ai_coaching_service.analyze_restaurant_menu(
            analysis_type="image",
            content=image_base64,
            dietary_preferences=dietary_prefs,
            health_goals=health_goals_list,
            user_id=current_user.uid
        )
        
        return analysis
    except Exception as e:
        logger.error(f"Restaurant menu image analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")

@router.post("/health-insights", response_model=HealthInsightsResponse)
async def get_ai_health_insights(
    request: HealthInsightsRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Generate comprehensive AI-powered health insights"""
    try:
        insights = await ai_coaching_service.generate_health_insights(
            user_id=current_user.uid,
            time_range=request.time_range,
            insight_types=request.insight_types,
            include_recommendations=request.include_recommendations
        )
        
        return insights
    except Exception as e:
        logger.error(f"Health insights generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Health insights failed: {str(e)}")

@router.post("/coaching/ask", response_model=CoachingSessionResponse)
async def ask_nutrition_coach(
    request: CoachingSessionRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Interactive AI nutrition coaching session"""
    try:
        session = await ai_coaching_service.create_coaching_session(
            user_id=current_user.uid,
            question=request.question,
            category=request.category,
            context=request.context
        )
        
        return session
    except Exception as e:
        logger.error(f"Coaching session error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Coaching session failed: {str(e)}")

@router.get("/coaching/sessions")
async def get_coaching_sessions(
    current_user: UserResponse = Depends(get_current_user),
    limit: int = 10,
    offset: int = 0
):
    """Get user's coaching session history"""
    try:
        sessions = await ai_coaching_service.get_coaching_sessions(
            user_id=current_user.uid,
            limit=limit,
            offset=offset
        )
        
        return sessions
    except Exception as e:
        logger.error(f"Get coaching sessions error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get coaching sessions: {str(e)}")

@router.post("/coaching/plans", response_model=PersonalizedPlanResponse)
async def create_personalized_plan(
    request: PersonalizedPlanRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create AI-generated personalized nutrition and fitness plan"""
    try:
        plan = await ai_coaching_service.create_personalized_plan(
            user_id=current_user.uid,
            goal_type=request.goal_type,
            target_timeframe=request.target_timeframe,
            current_metrics=request.current_metrics,
            preferences=request.preferences
        )
        
        return plan
    except Exception as e:
        logger.error(f"Personalized plan creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Plan creation failed: {str(e)}")

@router.get("/coaching/plans")
async def get_personalized_plans(
    current_user: UserResponse = Depends(get_current_user),
    active_only: bool = False
):
    """Get user's personalized plans"""
    try:
        plans = await ai_coaching_service.get_personalized_plans(
            user_id=current_user.uid,
            active_only=active_only
        )
        
        return plans
    except Exception as e:
        logger.error(f"Get personalized plans error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get plans: {str(e)}")

@router.get("/coaching/recommendations")
async def get_coaching_recommendations(
    current_user: UserResponse = Depends(get_current_user),
    category: Optional[str] = None,
    limit: int = 10
):
    """Get AI-generated coaching recommendations"""
    try:
        recommendations = await ai_coaching_service.get_coaching_recommendations(
            user_id=current_user.uid,
            category=category,
            limit=limit
        )
        
        return recommendations
    except Exception as e:
        logger.error(f"Get coaching recommendations error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@router.put("/coaching/recommendations/{recommendation_id}")
async def update_recommendation_status(
    recommendation_id: str,
    status: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update recommendation status (completed, dismissed, etc.)"""
    try:
        result = await ai_coaching_service.update_recommendation_status(
            recommendation_id=recommendation_id,
            status=status,
            user_id=current_user.uid
        )
        
        return result
    except Exception as e:
        logger.error(f"Update recommendation status error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update recommendation: {str(e)}")

@router.post("/coaching/feedback")
async def submit_coaching_feedback(
    session_id: str,
    feedback: Dict[str, Any],
    current_user: UserResponse = Depends(get_current_user)
):
    """Submit feedback for a coaching session"""
    try:
        result = await ai_coaching_service.submit_coaching_feedback(
            session_id=session_id,
            feedback=feedback,
            user_id=current_user.uid
        )
        
        return result
    except Exception as e:
        logger.error(f"Submit coaching feedback error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")

@router.get("/coaching/analytics")
async def get_coaching_analytics(
    current_user: UserResponse = Depends(get_current_user),
    time_range: str = "30d"
):
    """Get coaching analytics and progress metrics"""
    try:
        analytics = await ai_coaching_service.get_coaching_analytics(
            user_id=current_user.uid,
            time_range=time_range
        )
        
        return analytics
    except Exception as e:
        logger.error(f"Get coaching analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")
