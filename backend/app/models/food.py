from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DietaryAttributes(BaseModel):
    """Dietary attributes for food items"""
    dietary_restrictions: List[str] = []  # ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'halal', 'kosher']
    allergens: List[str] = []            # ['nuts', 'dairy', 'eggs', 'soy', 'shellfish', 'fish', 'wheat', 'sesame']
    food_categories: List[str] = []      # ['fruit', 'vegetable', 'meat', 'dairy', 'grain', 'legume', 'processed']


class NutritionInfo(BaseModel):
    """Nutrition information"""
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    fiber: Optional[float] = 0
    sugar: Optional[float] = 0
    sodium: Optional[float] = 0


class FoodItem(BaseModel):
    """Food item model"""
    name: str
    brand: Optional[str] = None
    serving_size: float
    serving_unit: str
    nutrition: NutritionInfo
    source: str = "user"  # user, usda, etc.
    barcode: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    dietary_attributes: Optional[DietaryAttributes] = None


class FoodItemCreate(BaseModel):
    """Food item creation model"""
    name: str
    brand: Optional[str] = None
    serving_size: float
    serving_unit: str
    nutrition: NutritionInfo
    barcode: Optional[str] = None
    dietary_attributes: Optional[DietaryAttributes] = None


class FoodItemResponse(BaseModel):
    """Food item response model"""
    id: str
    name: str
    brand: Optional[str] = None
    serving_size: float
    serving_unit: str
    nutrition: NutritionInfo
    source: str
    barcode: Optional[str] = None
    dietary_attributes: Optional[DietaryAttributes] = None


class FoodSearch(BaseModel):
    """Food search parameters"""
    query: str
    limit: int = 20
    skip: int = 0
