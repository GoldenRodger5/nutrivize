from ..core.config import get_database
from ..models.food import FoodItem, FoodItemCreate, FoodItemResponse, FoodSearch, NutritionInfo, DietaryAttributes
from typing import List, Optional
from bson import ObjectId
import re
import logging

logger = logging.getLogger(__name__)


class FoodService:
    """Food service for managing food items"""
    
    def __init__(self):
        self.db = get_database()
        self.food_collection = None
        
        if self.db is not None:
            self.food_collection = self.db["foods"]  # Changed from "food_items" to "foods"
            # Create text index for search
            try:
                self.food_collection.create_index([("name", "text")])
                # Create compound index for user-specific searches
                self.food_collection.create_index([("user_id", 1), ("name", 1)])
            except:
                pass  # Index might already exist
        else:
            print("⚠️  FoodService initialized without database connection")
    
    def _check_database_available(self):
        """Check if database is available"""
        return self.db is not None and self.food_collection is not None
    
    def _get_mock_food_data(self):
        """Get mock food data for development when database is unavailable"""
        return [
            {
                "id": "mock_1",
                "name": "Chicken Breast",
                "serving_size": 100,
                "serving_unit": "g",
                "nutrition": {
                    "calories": 165,
                    "protein": 31.0,
                    "carbs": 0.0,
                    "fat": 3.6,
                    "fiber": 0.0,
                    "sugar": 0.0,
                    "sodium": 74.0
                },
                "source": "mock"
            },
            {
                "id": "mock_2",
                "name": "Apple",
                "serving_size": 1,
                "serving_unit": "medium",
                "nutrition": {
                    "calories": 95,
                    "protein": 0.5,
                    "carbs": 25.0,
                    "fat": 0.3,
                    "fiber": 4.0,
                    "sugar": 19.0,
                    "sodium": 2.0
                },
                "source": "mock"
            },
            {
                "id": "mock_3",
                "name": "Brown Rice",
                "serving_size": 100,
                "serving_unit": "g",
                "nutrition": {
                    "calories": 123,
                    "protein": 2.6,
                    "carbs": 23.0,
                    "fat": 0.9,
                    "fiber": 1.8,
                    "sugar": 0.4,
                    "sodium": 7.0
                },
                "source": "mock"
            }
        ]
    
    async def create_food_item(self, food_data: FoodItemCreate, user_id: str) -> FoodItemResponse:
        """Create a new food item with auto-generated dietary attributes"""
        
        # Generate dietary attributes using AI if not provided
        if not food_data.dietary_attributes:
            try:
                logger.info(f"Generating dietary attributes for food: {food_data.name}")
                
                # Import AI service here to avoid circular imports
                from ..services.ai_service import AIService
                ai_service = AIService()
                
                dietary_data = await ai_service.generate_dietary_attributes(
                    food_data.name, 
                    food_data.serving_size, 
                    food_data.serving_unit
                )
                food_data.dietary_attributes = DietaryAttributes(**dietary_data)
                logger.info(f"Generated dietary attributes: {dietary_data}")
            except Exception as e:
                logger.error(f"Failed to generate dietary attributes for {food_data.name}: {e}")
                # Continue with empty dietary attributes if generation fails
                food_data.dietary_attributes = DietaryAttributes()
        
        food_item = FoodItem(
            **food_data.dict(),
            created_by=None  # We'll override this below
        )
        
        food_dict = food_item.dict()
        food_dict["user_id"] = user_id  # Use user_id instead of created_by
        food_dict.pop("created_by", None)  # Remove created_by field
        
        result = self.food_collection.insert_one(food_dict)
        
        return FoodItemResponse(
            id=str(result.inserted_id),
            **food_data.dict(),
            source="user"
        )
    
    async def get_food_item(self, food_id: str, user_id: str = None) -> Optional[FoodItemResponse]:
        """Get food item by ID - only user-specific foods for data separation"""
        try:
            query = {"_id": ObjectId(food_id)}
            
            # Add user filtering for data separation
            if user_id:
                query["user_id"] = user_id
            else:
                # If no user_id provided, return None for security
                return None
                
            food_doc = self.food_collection.find_one(query)
            if not food_doc:
                return None
            
            return FoodItemResponse(
                id=str(food_doc["_id"]),
                name=food_doc["name"],
                serving_size=food_doc["serving_size"],
                serving_unit=food_doc["serving_unit"],
                nutrition=food_doc["nutrition"],
                source=food_doc.get("source", "user"),
                barcode=food_doc.get("barcode"),
                dietary_attributes=food_doc.get("dietary_attributes")
            )
        except:
            return None
    
    async def search_food_items(self, search_params: FoodSearch, user_id: str = None) -> List[FoodItemResponse]:
        """Search food items - only user-specific foods for data separation"""
        query = {}
        
        # User filtering for data separation
        if user_id:
            query["user_id"] = user_id
        else:
            # If no user_id provided, return empty results for security
            return []
        
        # Text search
        if search_params.query:
            # Create regex for partial matching
            regex_pattern = re.compile(search_params.query, re.IGNORECASE)
            query["name"] = {"$regex": regex_pattern}
        
        cursor = self.food_collection.find(query).skip(search_params.skip).limit(search_params.limit)
        
        results = []
        for food_doc in cursor:
            results.append(FoodItemResponse(
                id=str(food_doc["_id"]),
                name=food_doc["name"],
                serving_size=food_doc["serving_size"],
                serving_unit=food_doc["serving_unit"],
                nutrition=food_doc["nutrition"],
                source=food_doc.get("source", "user"),
                barcode=food_doc.get("barcode"),
                dietary_attributes=food_doc.get("dietary_attributes")
            ))
        
        return results
    
    async def update_food_item(self, food_id: str, updates: dict, user_id: str) -> Optional[FoodItemResponse]:
        """Update food item (only if user owns it)"""
        try:
            result = self.food_collection.update_one(
                {"_id": ObjectId(food_id), "user_id": user_id},
                {"$set": updates}
            )
            
            if result.modified_count == 0:
                return None
            
            return await self.get_food_item(food_id, user_id)
        except:
            return None
    
    async def delete_food_item(self, food_id: str, user_id: str) -> bool:
        """Delete food item (only if user owns it)"""
        try:
            result = self.food_collection.delete_one(
                {"_id": ObjectId(food_id), "user_id": user_id}
            )
            return result.deleted_count > 0
        except:
            return False
    
    async def seed_sample_foods(self):
        """Seed database with sample food items"""
        sample_foods = [
            {
                "name": "Banana",
                "serving_size": 100,
                "serving_unit": "g",
                "nutrition": {
                    "calories": 89,
                    "protein": 1.1,
                    "carbs": 22.8,
                    "fat": 0.3,
                    "fiber": 2.6,
                    "sugar": 12.2
                },
                "source": "usda"
            },
            {
                "name": "Chicken Breast",
                "serving_size": 100,
                "serving_unit": "g", 
                "nutrition": {
                    "calories": 165,
                    "protein": 31,
                    "carbs": 0,
                    "fat": 3.6,
                    "fiber": 0
                },
                "source": "usda"
            },
            {
                "name": "Brown Rice",
                "serving_size": 100,
                "serving_unit": "g",
                "nutrition": {
                    "calories": 111,
                    "protein": 2.6,
                    "carbs": 23,
                    "fat": 0.9,
                    "fiber": 1.8
                },
                "source": "usda"
            },
            {
                "name": "Greek Yogurt",
                "serving_size": 100,
                "serving_unit": "g",
                "nutrition": {
                    "calories": 59,
                    "protein": 10,
                    "carbs": 3.6,
                    "fat": 0.4,
                    "fiber": 0
                },
                "source": "usda"
            }
        ]
        
        for food in sample_foods:
            existing = self.food_collection.find_one({"name": food["name"], "source": "usda"})
            if not existing:
                self.food_collection.insert_one(food)
    
    async def list_food_items(
        self, 
        user_id: str,
        limit: int = 10, 
        skip: int = 0, 
        sort_by: str = "name", 
        sort_order: str = "asc"
    ) -> List[FoodItemResponse]:
        """List user's food items with pagination and sorting"""
        # Determine sort direction
        sort_direction = 1 if sort_order.lower() == "asc" else -1
        
        # Map sort fields to database fields
        sort_field_map = {
            "name": "name",
            "calories": "nutrition.calories",
            "protein": "nutrition.protein"
        }
        
        # Use mapped field or default to name
        db_sort_field = sort_field_map.get(sort_by, "name")
        
        # Filter by user_id for data separation
        query = {"user_id": user_id}
        cursor = self.food_collection.find(query).skip(skip).limit(limit).sort(db_sort_field, sort_direction)
        
        results = []
        for food_doc in cursor:
            results.append(FoodItemResponse(
                id=str(food_doc["_id"]),
                name=food_doc["name"],
                serving_size=food_doc["serving_size"],
                serving_unit=food_doc["serving_unit"],
                nutrition=food_doc["nutrition"],
                source=food_doc.get("source", "user"),
                barcode=food_doc.get("barcode"),
                dietary_attributes=food_doc.get("dietary_attributes")
            ))
        
        return results

    async def get_user_food_index(self, user_id: str) -> List[dict]:
        """Get all foods from user's personal food index"""
        if not self._check_database_available():
            return []
        
        try:
            # Get all user foods
            query = {"user_id": user_id}
            cursor = self.food_collection.find(query).sort("name", 1)
            
            food_index = []
            for food_doc in cursor:
                food_index.append({
                    "id": str(food_doc["_id"]),
                    "name": food_doc["name"],
                    "serving_size": food_doc["serving_size"],
                    "serving_unit": food_doc["serving_unit"],
                    "nutrition": food_doc["nutrition"],
                    "source": food_doc.get("source", "user")
                })
            
            return food_index
        except Exception as e:
            logger.error(f"Error getting user food index: {e}")
            return []

# Global food service instance
food_service = FoodService()
