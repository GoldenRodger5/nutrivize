from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, date
from enum import Enum


class GoalType(str, Enum):
    """Goal types"""
    WEIGHT_LOSS = "weight_loss"
    WEIGHT_GAIN = "weight_gain"
    MAINTENANCE = "maintenance"
    MUSCLE_GAIN = "muscle_gain"


class NutritionTargets(BaseModel):
    """Daily nutrition targets"""
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: Optional[float] = None
    water_target: Optional[float] = 64.0  # fl oz per day


class WeightTarget(BaseModel):
    """Weight target information"""
    current_weight: float
    target_weight: float
    weekly_rate: float  # kg or lbs per week


class Goal(BaseModel):
    """Goal model"""
    user_id: str
    title: str
    goal_type: GoalType
    start_date: date
    end_date: Optional[date] = None
    active: bool = True
    weight_target: Optional[WeightTarget] = None
    nutrition_targets: NutritionTargets
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class GoalCreate(BaseModel):
    """Goal creation model"""
    title: str
    goal_type: GoalType
    start_date: date
    end_date: Optional[date] = None
    weight_target: Optional[WeightTarget] = None
    nutrition_targets: NutritionTargets
    is_active: bool = True


class GoalResponse(BaseModel):
    """Goal response model"""
    id: str
    title: str = ""
    goal_type: GoalType
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    active: bool = True
    weight_target: Optional[WeightTarget] = None
    nutrition_targets: Optional[NutritionTargets] = None
    created_at: Optional[datetime] = None


class GoalProgress(BaseModel):
    """Goal progress tracking"""
    goal_id: str
    date: date
    weight: Optional[float] = None
    notes: Optional[str] = ""
