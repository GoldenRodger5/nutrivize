from fastapi import APIRouter, Depends, HTTPException, Query
from ..routes.auth import get_current_user
from ..models.user import UserResponse
from ..models.food import FoodItemCreate, FoodItemResponse, FoodSearch
from ..services.food_service import food_service
from ..services.food_recommendations_service import food_recommendations_service
from typing import List, Dict, Any


router = APIRouter(prefix="/foods", tags=["foods"])


@router.post("/", response_model=FoodItemResponse)
async def create_food_item(
    food_data: FoodItemCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new food item"""
    try:
        food_item = await food_service.create_food_item(food_data, current_user.uid)
        return food_item
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/search", response_model=List[FoodItemResponse])
async def search_foods(
    q: str = Query(..., description="Search query"),
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: UserResponse = Depends(get_current_user)
):
    """Search food items"""
    search_params = FoodSearch(query=q, limit=limit, skip=skip)
    results = await food_service.search_food_items(search_params, current_user.uid)
    return results


@router.get("/{food_id}", response_model=FoodItemResponse)
async def get_food_item(
    food_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get food item by ID"""
    food_item = await food_service.get_food_item(food_id, current_user.uid)
    if not food_item:
        raise HTTPException(status_code=404, detail="Food item not found")
    return food_item


@router.put("/{food_id}", response_model=FoodItemResponse)
async def update_food_item(
    food_id: str,
    updates: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update food item"""
    food_item = await food_service.update_food_item(food_id, updates, current_user.uid)
    if not food_item:
        raise HTTPException(status_code=404, detail="Food item not found or not owned by user")
    return food_item


@router.delete("/{food_id}")
async def delete_food_item(
    food_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete food item"""
    success = await food_service.delete_food_item(food_id, current_user.uid)
    if not success:
        raise HTTPException(status_code=404, detail="Food item not found or not owned by user")
    return {"message": "Food item deleted successfully"}


@router.post("/seed")
async def seed_sample_foods():
    """Seed database with sample foods (for development)"""
    await food_service.seed_sample_foods()
    return {"message": "Sample foods seeded successfully"}


@router.get("/", response_model=List[FoodItemResponse])
async def list_foods(
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0),
    filter_query: str = Query("", description="Optional filter query"),
    sort_by: str = Query("name", description="Field to sort by: name, calories, protein"),
    sort_order: str = Query("asc", description="Sort order: asc or desc"),
    current_user: UserResponse = Depends(get_current_user)
):
    """List all food items with pagination, filtering, and sorting"""
    try:
        if filter_query.strip():
            # Use search if filter query is provided
            search_params = FoodSearch(query=filter_query, limit=limit, skip=skip)
            results = await food_service.search_food_items(search_params, current_user.uid)
            # Apply sorting to search results
            if sort_by in ['name', 'calories', 'protein']:
                reverse = sort_order.lower() == 'desc'
                if sort_by == 'name':
                    results.sort(key=lambda x: x.name.lower(), reverse=reverse)
                elif sort_by == 'calories':
                    results.sort(key=lambda x: x.nutrition.calories, reverse=reverse)
                elif sort_by == 'protein':
                    results.sort(key=lambda x: x.nutrition.protein, reverse=reverse)
        else:
            # List all foods with pagination and sorting
            results = await food_service.list_food_items(
                user_id=current_user.uid,
                limit=limit, 
                skip=skip, 
                sort_by=sort_by, 
                sort_order=sort_order
            )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/recent")
async def get_recent_foods(
    limit: int = Query(10, ge=1, le=20, description="Number of recent foods to return"),
    current_user: UserResponse = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get user's recently logged foods"""
    try:
        recent_foods = await food_recommendations_service.get_recent_foods(current_user.uid, limit)
        return recent_foods
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recent foods: {str(e)}")


@router.get("/recommendations/popular")
async def get_popular_foods_ai(
    limit: int = Query(10, ge=1, le=20, description="Number of popular foods to return"),
    current_user: UserResponse = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get AI-generated popular food recommendations"""
    try:
        popular_foods = await food_recommendations_service.get_popular_foods_ai(current_user.uid, limit)
        return popular_foods
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get popular foods: {str(e)}")


@router.get("/recommendations/combined")
async def get_food_suggestions_combined(
    current_user: UserResponse = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get combined recent and popular food suggestions"""
    try:
        suggestions = await food_recommendations_service.get_food_suggestions_combined(current_user.uid)
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get food suggestions: {str(e)}")
