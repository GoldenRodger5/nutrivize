from pydantic import BaseModel
from typing import List, Dict, Optional, Any


class ChatMessage(BaseModel):
    """Chat message model"""
    role: str  # user or assistant
    content: str


class ChatRequest(BaseModel):
    """Chat request model"""
    message: str
    conversation_history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    """Chat response model"""
    response: str
    conversation_history: List[ChatMessage]


class MealSuggestionRequest(BaseModel):
    """Meal suggestion request"""
    meal_type: str  # breakfast, lunch, dinner, snack
    remaining_calories: Optional[float] = None
    remaining_protein: Optional[float] = None
    remaining_carbs: Optional[float] = None
    remaining_fat: Optional[float] = None
    dietary_preferences: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    prep_time_preference: Optional[str] = None  # "quick" (<=15min), "moderate" (15-45min), "complex" (45min+)
    main_ingredients: Optional[List[str]] = []  # Up to 3 main ingredients to focus on
    use_food_index_only: Optional[bool] = False
    special_requests: Optional[str] = ""  # Custom user instructions for meal suggestions


class Ingredient(BaseModel):
    """Meal ingredient"""
    name: str
    amount: float
    unit: str
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None


class MealSuggestion(BaseModel):
    """Meal suggestion"""
    name: str
    description: str
    ingredients: List[Ingredient]
    instructions: List[str]
    prep_time: Optional[int] = None  # minutes
    nutrition: Dict[str, float]  # calories, protein, carbs, fat


class MealSuggestionResponse(BaseModel):
    """Meal suggestion response"""
    suggestions: List[MealSuggestion]
