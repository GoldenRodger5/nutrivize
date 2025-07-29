from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date as date_type
from .food import NutritionInfo
import re


class MealType(str):
    """Meal type enum with validation"""
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """Check if meal type is valid"""
        return value.lower() in {cls.BREAKFAST, cls.LUNCH, cls.DINNER, cls.SNACK}


class FoodLogEntry(BaseModel):
    """Food log entry model with comprehensive validation"""
    user_id: str = Field(
        min_length=1,
        max_length=100,
        description="User ID"
    )
    date: date_type = Field(
        description="Date of the food log entry"
    )
    meal_type: str = Field(
        description="Type of meal (breakfast, lunch, dinner, snack)"
    )
    food_id: str = Field(
        min_length=1,
        max_length=100,
        description="Food item ID"
    )
    food_name: str = Field(
        min_length=1,
        max_length=200,
        description="Food name (1-200 characters)"
    )
    brand: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Brand name (max 100 characters)"
    )
    amount: float = Field(
        gt=0,
        le=10000,
        description="Amount consumed (must be positive, max 10000)"
    )
    unit: str = Field(
        min_length=1,
        max_length=50,
        description="Unit of measurement"
    )
    nutrition: NutritionInfo
    notes: Optional[str] = Field(
        default="",
        max_length=500,
        description="Optional notes (max 500 characters)"
    )
    logged_at: datetime = Field(default_factory=datetime.utcnow)

    @validator('date')
    def validate_date(cls, v):
        """Validate log date"""
        today = date_type.today()
        # Allow dates up to 1 year in the past and 1 day in the future
        if v < date_type(today.year - 1, today.month, today.day):
            raise ValueError('Date cannot be more than 1 year in the past')
        if v > date_type(today.year, today.month, today.day + 1):
            raise ValueError('Date cannot be more than 1 day in the future')
        return v

    @validator('meal_type')
    def validate_meal_type(cls, v):
        """Validate meal type"""
        if not MealType.is_valid(v):
            raise ValueError(f'Invalid meal type. Must be one of: {", ".join([MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, MealType.SNACK])}')
        return v.lower()

    @validator('food_name')
    def validate_food_name(cls, v):
        """Validate and clean food name"""
        if not v or not v.strip():
            raise ValueError('Food name cannot be empty')
        
        cleaned = re.sub(r'\s+', ' ', v.strip())
        if not re.match(r'^[a-zA-Z0-9\s\-.,()&\'"%]+$', cleaned):
            raise ValueError('Food name contains invalid characters')
        
        return cleaned

    @validator('brand')
    def validate_brand(cls, v):
        """Validate brand name"""
        if v is not None and v.strip():
            cleaned = re.sub(r'\s+', ' ', v.strip())
            if not re.match(r'^[a-zA-Z0-9\s\-.,()&\'"%]+$', cleaned):
                raise ValueError('Brand name contains invalid characters')
            return cleaned
        return None

    @validator('unit')
    def validate_unit(cls, v):
        """Validate serving unit"""
        if not v or not v.strip():
            raise ValueError('Unit cannot be empty')
        
        cleaned = v.strip().lower()
        if not re.match(r'^[a-zA-Z0-9\s\-./()]+$', cleaned):
            raise ValueError('Unit contains invalid characters')
        
        return cleaned

    @validator('notes')
    def validate_notes(cls, v):
        """Validate notes field"""
        if v is not None:
            return v.strip()
        return ""



class FoodLogCreate(BaseModel):
    """Food log creation model with validation"""
    date: date_type = Field(
        description="Date of the food log entry"
    )
    meal_type: str = Field(
        description="Type of meal (breakfast, lunch, dinner, snack)"
    )
    food_id: str = Field(
        min_length=1,
        max_length=100,
        description="Food item ID"
    )
    food_name: str = Field(
        min_length=1,
        max_length=200,
        description="Food name (1-200 characters)"
    )
    brand: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Brand name (max 100 characters)"
    )
    amount: float = Field(
        gt=0,
        le=10000,
        description="Amount consumed (must be positive, max 10000)"
    )
    unit: str = Field(
        min_length=1,
        max_length=50,
        description="Unit of measurement"
    )
    nutrition: NutritionInfo
    notes: Optional[str] = Field(
        default="",
        max_length=500,
        description="Optional notes (max 500 characters)"
    )

    # Reuse validators from FoodLogEntry
    _validate_date = validator('date', allow_reuse=True)(FoodLogEntry.validate_date.__func__)
    _validate_meal_type = validator('meal_type', allow_reuse=True)(FoodLogEntry.validate_meal_type.__func__)
    _validate_food_name = validator('food_name', allow_reuse=True)(FoodLogEntry.validate_food_name.__func__)
    _validate_brand = validator('brand', allow_reuse=True)(FoodLogEntry.validate_brand.__func__)
    _validate_unit = validator('unit', allow_reuse=True)(FoodLogEntry.validate_unit.__func__)
    _validate_notes = validator('notes', allow_reuse=True)(FoodLogEntry.validate_notes.__func__)


class FoodLogResponse(BaseModel):
    """Food log response model"""
    id: str
    date: date_type
    meal_type: str
    food_id: str
    food_name: str
    brand: Optional[str] = None
    amount: float
    unit: str
    nutrition: NutritionInfo
    notes: Optional[str] = ""
    logged_at: datetime


class DailyNutritionSummary(BaseModel):
    """Daily nutrition summary with validation"""
    date: date_type
    total_nutrition: NutritionInfo
    meals: List[str] = Field(
        description="List of meal types logged for the day"
    )
    total_foods: int = Field(
        ge=0,
        description="Total number of food items logged"
    )
