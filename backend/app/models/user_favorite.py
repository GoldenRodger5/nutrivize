"""
User Favorite Food Model - Separate collection for user favorites
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class FavoriteCategory(str, Enum):
    """Favorite food categories"""
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"
    DESSERT = "dessert"
    DRINK = "drink"
    INGREDIENT = "ingredient"
    GENERAL = "general"


class UserFavoriteCreate(BaseModel):
    """Create a new user favorite"""
    food_id: str
    custom_name: Optional[str] = None  # User's custom name for the food
    default_serving_size: Optional[float] = None
    default_serving_unit: Optional[str] = None
    category: Optional[FavoriteCategory] = FavoriteCategory.GENERAL
    notes: Optional[str] = None
    tags: List[str] = []  # User-defined tags like "quick", "healthy", etc.


class UserFavorite(BaseModel):
    """User favorite food entry"""
    user_id: str
    food_id: str
    custom_name: Optional[str] = None
    default_serving_size: Optional[float] = None
    default_serving_unit: Optional[str] = None
    category: FavoriteCategory = FavoriteCategory.GENERAL
    notes: Optional[str] = None
    tags: List[str] = []
    usage_count: int = 0  # How many times this favorite has been logged
    last_used: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserFavoriteResponse(BaseModel):
    """User favorite response with food details"""
    id: str
    food_id: str
    food_name: str  # From the referenced food
    custom_name: Optional[str] = None
    default_serving_size: Optional[float] = None
    default_serving_unit: Optional[str] = None
    category: FavoriteCategory
    notes: Optional[str] = None
    tags: List[str] = []
    usage_count: int = 0
    last_used: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Nutrition data from the referenced food
    nutrition: Optional[Dict[str, Any]] = None
    dietary_attributes: Optional[Dict[str, Any]] = None


class UserFavoriteUpdate(BaseModel):
    """Update user favorite"""
    custom_name: Optional[str] = None
    default_serving_size: Optional[float] = None
    default_serving_unit: Optional[str] = None
    category: Optional[FavoriteCategory] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class UserFavoriteStats(BaseModel):
    """User favorite statistics"""
    total_favorites: int
    categories_breakdown: Dict[str, int]
    most_used_favorites: List[UserFavoriteResponse]
    recent_additions: List[UserFavoriteResponse]
    tags_summary: Dict[str, int]  # Tag usage counts
