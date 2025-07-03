from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from .food import NutritionInfo


class MealType(str):
    """Meal type enum"""
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"


class FoodLogEntry(BaseModel):
    """Food log entry model"""
    user_id: str
    date: date
    meal_type: str  # breakfast, lunch, dinner, snack
    food_id: str
    food_name: str
    brand: Optional[str] = None
    amount: float
    unit: str
    nutrition: NutritionInfo
    notes: Optional[str] = ""
    logged_at: datetime = Field(default_factory=datetime.utcnow)


class FoodLogCreate(BaseModel):
    """Food log creation model"""
    date: date
    meal_type: str
    food_id: str
    food_name: str
    brand: Optional[str] = None
    amount: float
    unit: str
    nutrition: NutritionInfo
    notes: Optional[str] = ""


class FoodLogResponse(BaseModel):
    """Food log response model"""
    id: str
    date: date
    meal_type: str
    food_id: str
    food_name: str
    brand: Optional[str] = None
    amount: float
    unit: str
    nutrition: NutritionInfo
    notes: str
    logged_at: datetime


class DailyNutritionSummary(BaseModel):
    """Daily nutrition summary"""
    date: date
    total_nutrition: NutritionInfo
    meals: List[FoodLogResponse]
    meal_breakdown: dict  # breakdown by meal type
