from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class RecentFood(BaseModel):
    """Recent food entry"""
    food_id: str
    food_name: str
    quantity: float
    unit: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    sugar: float
    sodium: float
    last_used: datetime = Field(default_factory=datetime.utcnow)


class FavoriteFood(BaseModel):
    """Favorite food entry"""
    food_id: str
    food_name: str
    default_quantity: float = 100
    default_unit: str = "g"
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    sugar: float
    sodium: float
    added_date: datetime = Field(default_factory=datetime.utcnow)


class UserPreferences(BaseModel):
    """User preferences"""
    units: str = "metric"  # metric or imperial
    theme: str = "light"   # light or dark
    timezone: str = "UTC"


class User(BaseModel):
    """User model"""
    uid: str
    email: str
    name: str
    preferences: Dict[str, Any] = {}
    recent_foods: List[RecentFood] = []
    favorite_foods: List[FavoriteFood] = []
    # Onboarding fields
    onboarding_completed: bool = False
    onboarding_step: Optional[int] = None
    profile_completeness_score: Optional[int] = None
    # Profile fields
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None  # in cm
    current_weight: Optional[float] = None  # in kg
    activity_level: Optional[str] = None
    health_goals: List[str] = []
    target_weight: Optional[float] = None
    daily_calorie_goal: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(BaseModel):
    """User creation model"""
    email: str
    name: str
    preferences: Optional[Dict[str, Any]] = None


class UserLogin(BaseModel):
    """User login request"""
    email: str
    password: str


class UserRegister(BaseModel):
    """User registration request"""
    email: str
    password: str
    name: str


class UserResponse(BaseModel):
    """User response model"""
    uid: str
    email: str
    name: str
    preferences: Dict[str, Any] = {}
    recent_foods: List[RecentFood] = []
    favorite_foods: List[FavoriteFood] = []
    # Onboarding fields
    onboarding_completed: bool = False
    onboarding_step: Optional[int] = None
    profile_completeness_score: Optional[int] = None
    # Profile fields
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    current_weight: Optional[float] = None
    activity_level: Optional[str] = None
    health_goals: List[str] = []
    target_weight: Optional[float] = None
    daily_calorie_goal: Optional[int] = None


class AuthResponse(BaseModel):
    """Authentication response with token"""
    user: UserResponse
    token: str
    message: str


class AddToRecentsRequest(BaseModel):
    """Add food to recent foods"""
    food_id: str
    food_name: str
    quantity: float
    unit: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    sugar: float
    sodium: float


class AddToFavoritesRequest(BaseModel):
    """Add food to favorite foods"""
    food_id: str
    food_name: str
    default_quantity: float = 100
    default_unit: str = "g"
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    sugar: float
    sodium: float


# Onboarding Models
class OnboardingBasicProfile(BaseModel):
    """Basic profile information for onboarding"""
    age: Optional[int] = Field(None, ge=13, le=120)
    gender: Optional[str] = Field(None, pattern="^(male|female|other|prefer_not_to_say)$")
    height: Optional[float] = Field(None, ge=50, le=300)  # cm
    current_weight: Optional[float] = Field(None, ge=20, le=500)  # kg
    activity_level: Optional[str] = Field(None, pattern="^(sedentary|lightly_active|moderately_active|very_active|extremely_active)$")


class OnboardingHealthGoals(BaseModel):
    """Health goals for onboarding"""
    health_goals: List[str] = []  # lose_weight, gain_muscle, maintain_weight, improve_health
    target_weight: Optional[float] = Field(None, ge=20, le=500)
    timeline: Optional[str] = None  # 1_month, 3_months, 6_months, 1_year, gradual


class OnboardingNutritionTargets(BaseModel):
    """Nutrition targets for onboarding"""
    daily_calorie_goal: Optional[int] = Field(None, ge=800, le=5000)
    protein_percent: Optional[int] = Field(None, ge=10, le=50)
    carbs_percent: Optional[int] = Field(None, ge=20, le=70)
    fat_percent: Optional[int] = Field(None, ge=10, le=50)
    meal_frequency: Optional[int] = Field(None, ge=2, le=8)


class OnboardingAppPreferences(BaseModel):
    """App preferences for onboarding"""
    units: str = Field("metric", pattern="^(metric|imperial)$")
    notifications_enabled: bool = True
    meal_reminders: bool = True
    weekly_insights: bool = True
    theme: str = Field("light", pattern="^(light|dark)$")


class OnboardingStepRequest(BaseModel):
    """Request for updating onboarding step data"""
    step: int = Field(..., ge=1, le=7)
    data: Dict[str, Any]


class OnboardingCompleteRequest(BaseModel):
    """Request for completing onboarding"""
    basic_profile: Optional[OnboardingBasicProfile] = None
    health_goals: Optional[OnboardingHealthGoals] = None
    nutrition_targets: Optional[OnboardingNutritionTargets] = None
    app_preferences: Optional[OnboardingAppPreferences] = None


class OnboardingStatusResponse(BaseModel):
    """Response for onboarding status"""
    onboarding_completed: bool
    current_step: Optional[int]
    profile_completeness_score: int
    completed_steps: List[int]
    next_step: Optional[int]
