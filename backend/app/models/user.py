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
