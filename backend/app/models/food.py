from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
import re


class DietaryAttributes(BaseModel):
    """Dietary attributes for food items"""
    dietary_restrictions: List[str] = Field(
        default=[],
        description="Dietary restrictions (vegetarian, vegan, gluten-free, etc.)",
        max_items=20
    )
    allergens: List[str] = Field(
        default=[],
        description="Common allergens (nuts, dairy, eggs, soy, etc.)",
        max_items=15
    )
    food_categories: List[str] = Field(
        default=[],
        description="Food categories (fruit, vegetable, meat, dairy, etc.)",
        max_items=10
    )

    @validator('dietary_restrictions', 'allergens', 'food_categories')
    def validate_list_items(cls, v):
        """Ensure all list items are sanitized strings"""
        if not isinstance(v, list):
            return []
        return [item.strip().lower() for item in v if item and len(item.strip()) <= 50]


class NutritionInfo(BaseModel):
    """Nutrition information with comprehensive validation"""
    calories: float = Field(
        default=0,
        ge=0,
        le=10000,
        description="Calories per serving",
        examples=[250, 120, 500]
    )
    protein: float = Field(
        default=0,
        ge=0,
        le=500,
        description="Protein in grams",
        examples=[25.5, 10.2, 45.0]
    )
    carbs: float = Field(
        default=0,
        ge=0,
        le=1000,
        description="Carbohydrates in grams",
        examples=[30.0, 15.5, 60.2]
    )
    fat: float = Field(
        default=0,
        ge=0,
        le=500,
        description="Fat in grams",
        examples=[12.5, 5.0, 25.8]
    )
    fiber: Optional[float] = Field(
        default=0,
        ge=0,
        le=100,
        description="Fiber in grams",
        examples=[5.0, 2.5, 8.2]
    )
    sugar: Optional[float] = Field(
        default=0,
        ge=0,
        le=500,
        description="Sugar in grams",
        examples=[12.0, 3.5, 25.0]
    )
    sodium: Optional[float] = Field(
        default=0,
        ge=0,
        le=50000,
        description="Sodium in milligrams",
        examples=[240, 85, 1200]
    )

    @validator('*')
    def validate_nutrition_values(cls, v):
        """Ensure nutrition values are reasonable"""
        if v is None:
            return 0
        return round(float(v), 2) if v >= 0 else 0


class FoodItem(BaseModel):
    """Food item model with comprehensive validation"""
    name: str = Field(
        min_length=1,
        max_length=200,
        description="Food name",
        examples=["Apple", "Chicken Breast", "Brown Rice"]
    )
    brand: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Brand name",
        examples=["Dole", "Tyson", "Uncle Ben's"]
    )
    serving_size: float = Field(
        gt=0,
        le=10000,
        description="Serving size amount",
        examples=[1.0, 100.0, 0.5]
    )
    serving_unit: str = Field(
        min_length=1,
        max_length=50,
        description="Serving unit",
        examples=["cup", "piece", "gram", "ounce", "slice"]
    )
    nutrition: NutritionInfo
    source: str = Field(
        default="manual",
        description="Source of food data",
        pattern=r'^(user|usda|branded|manual)$',
        examples=["user", "usda", "branded", "manual"]
    )
    barcode: Optional[str] = Field(
        default=None,
        pattern=r'^\d{8,14}$',
        description="UPC/EAN barcode for branded foods",
        examples=["012345678901"]
    )
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    dietary_attributes: Optional[DietaryAttributes] = None

    @validator('name', 'brand')
    def validate_name_fields(cls, v):
        """Sanitize and validate name fields"""
        if not v:
            return v
        # Remove excessive whitespace and sanitize
        cleaned = re.sub(r'\s+', ' ', str(v).strip())
        # Remove special characters except basic punctuation
        cleaned = re.sub(r'[^\w\s\-\'\.\,\(\)]', '', cleaned)
        return cleaned if len(cleaned) >= 1 else None

    @validator('serving_unit')
    def validate_serving_unit(cls, v):
        """Validate serving unit against common units"""
        if not v:
            raise ValueError("Serving unit is required")
        
        # Common serving units
        common_units = {
            'g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms',
            'oz', 'ounce', 'ounces', 'lb', 'pound', 'pounds',
            'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters',
            'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons',
            'tsp', 'teaspoon', 'teaspoons', 'piece', 'pieces',
            'slice', 'slices', 'serving', 'servings', 'portion',
            'can', 'bottle', 'package', 'container', 'each'
        }
        
        unit_clean = str(v).strip().lower()
        if unit_clean in common_units:
            return unit_clean
        return v.strip()  # Allow custom units but clean them


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
