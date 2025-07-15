# Meal Plan Endpoints Comparison

## Overview
There are two meal plan generation endpoints in the Nutrivize backend:
1. `/ai/meal-plan` - Unified AI service endpoint
2. `/meal-planning/generate-plan` - Traditional meal planning service endpoint

## Key Differences

### 1. **Service Layer**
- **`/ai/meal-plan`**: Uses `unified_ai_service.generate_intelligent_meal_plan()` with the new Claude Sonnet 4 model
- **`/meal-planning/generate-plan`**: Uses `ai_service.generate_meal_plan()` with the updated Claude Sonnet 4 model

### 2. **Request Schema**
**`/ai/meal-plan` (MealPlanRequest)**:
```python
class MealPlanRequest(BaseModel):
    name: str = "My Meal Plan"
    duration: int = 7                    # Note: "duration" vs "days"
    meals_per_day: int = 3
    budget: str = "moderate"
    prep_time: str = "moderate"
    variety: str = "high"
    special_requests: str = ""           # ✅ Has special requests field
```

**`/meal-planning/generate-plan` (MealPlanRequest)**:
```python
class MealPlanRequest(BaseModel):
    name: Optional[str] = None
    days: int = 7                        # Note: "days" vs "duration"
    dietary_restrictions: Optional[List[str]] = []
    preferred_cuisines: Optional[List[str]] = []
    calories_per_day: Optional[int] = None
    protein_target: Optional[float] = None
    carbs_target: Optional[float] = None
    fat_target: Optional[float] = None
    exclude_foods: Optional[List[str]] = []
    meal_types: Optional[List[str]] = ["breakfast", "lunch", "dinner"]
    complexity_level: Optional[str] = "any"
    use_food_index_only: Optional[bool] = False
    # ❌ No special requests field
```

### 3. **Parameter Handling**
**`/ai/meal-plan`**:
- **Duration limit**: Enforced maximum of 3 days
- **Simplified parameters**: Uses high-level descriptors (budget, prep_time, variety)
- **Special requests**: Built-in support for custom user instructions
- **Meal structure**: Fixed 3 meals per day approach

**`/meal-planning/generate-plan`**:
- **Duration limit**: Up to 30 days allowed
- **Detailed parameters**: Precise nutrition targets, dietary restrictions, cuisine preferences
- **User preferences**: Automatically merges user's disliked foods with excluded foods
- **Flexible meal structure**: Configurable meal types and complexity

### 4. **Timeout Handling**
- **`/ai/meal-plan`**: No explicit timeout handling
- **`/meal-planning/generate-plan`**: 60-second timeout with fallback to async endpoint

### 5. **Auto-save Behavior**
- **`/ai/meal-plan`**: Returns generated plan (save behavior depends on service implementation)
- **`/meal-planning/generate-plan`**: Automatically saves generated plan to database

### 6. **Frontend Usage**
- **Current frontend**: Uses `/meal-planning/generate-plan` in `MealPlans.tsx`
- **Parameters sent**: Full nutrition targets, dietary restrictions, cuisine preferences, etc.
- **Missing feature**: No special requests field in frontend form

## Recommendations

### 1. **Primary Endpoint Selection**
**Use `/meal-planning/generate-plan`** as the primary endpoint because:
- More comprehensive parameter support
- Better timeout handling
- Auto-save functionality
- Already integrated with frontend
- Supports longer meal plans (up to 30 days)

### 2. **Special Requests Integration**
**Add special requests support to `/meal-planning/generate-plan`**:
- Update the `MealPlanRequest` schema to include `special_requests: Optional[str] = ""`
- Modify the meal planning service to incorporate special requests into AI prompts
- Add special requests text area to frontend form

### 3. **Endpoint Consolidation**
Consider deprecating `/ai/meal-plan` in favor of enhancing `/meal-planning/generate-plan` with:
- Optional unified AI service integration
- Special requests support
- Improved AI prompting from the unified service

## Current Status
- ✅ Both endpoints updated to use Claude Sonnet 4 model
- ✅ `/ai/meal-plan` has 3-day duration limit enforced
- ✅ Comprehensive testing completed for both endpoints
- ⏳ **PENDING**: Add special requests field to frontend
- ⏳ **PENDING**: Add special requests support to `/meal-planning/generate-plan` backend

## Next Steps
1. Add `special_requests` field to `/meal-planning/generate-plan` backend
2. Add special requests text area to frontend meal plan creation form
3. Test end-to-end special requests functionality
4. Consider consolidating endpoints for better maintainability
