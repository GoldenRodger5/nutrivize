"""
User Favorites Service - Manages user favorite foods
"""

import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from ..core.config import get_database
from ..models.user_favorite import (
    UserFavoriteCreate, UserFavorite, UserFavoriteResponse, 
    UserFavoriteUpdate, UserFavoriteStats, FavoriteCategory
)

logger = logging.getLogger(__name__)

class UserFavoritesService:
    """Service for managing user favorite foods"""
    
    def __init__(self):
        self.db = get_database()
        self.favorites_collection = self.db.user_favorites
        self.foods_collection = self.db.foods
        
        # Create indexes for efficient querying
        try:
            self.favorites_collection.create_index([("user_id", 1), ("food_id", 1)], unique=True)
            self.favorites_collection.create_index([("user_id", 1), ("category", 1)])
            self.favorites_collection.create_index([("user_id", 1), ("usage_count", -1)])
            self.favorites_collection.create_index([("user_id", 1), ("created_at", -1)])
        except Exception as e:
            logger.warning(f"Could not create indexes: {e}")
    
    async def add_favorite(self, user_id: str, favorite_data: UserFavoriteCreate) -> UserFavoriteResponse:
        """Add a food to user's favorites"""
        try:
            # Check if food exists
            food = self.foods_collection.find_one({"_id": ObjectId(favorite_data.food_id)})
            if not food:
                raise ValueError(f"Food with ID {favorite_data.food_id} not found")
            
            # Check if already in favorites
            existing = self.favorites_collection.find_one({
                "user_id": user_id,
                "food_id": favorite_data.food_id
            })
            if existing:
                raise ValueError("Food is already in favorites")
            
            # Create favorite document
            favorite_doc = {
                "user_id": user_id,
                "food_id": favorite_data.food_id,
                "custom_name": favorite_data.custom_name,
                "default_serving_size": favorite_data.default_serving_size,
                "default_serving_unit": favorite_data.default_serving_unit,
                "category": favorite_data.category.value,
                "notes": favorite_data.notes,
                "tags": favorite_data.tags,
                "usage_count": 0,
                "last_used": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = self.favorites_collection.insert_one(favorite_doc)
            
            # Return the created favorite with food details
            return await self._get_favorite_with_food_details(str(result.inserted_id))
            
        except Exception as e:
            logger.error(f"Error adding favorite: {e}")
            raise e
    
    async def remove_favorite(self, user_id: str, food_id: str) -> bool:
        """Remove a food from user's favorites"""
        try:
            result = self.favorites_collection.delete_one({
                "user_id": user_id,
                "food_id": food_id
            })
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error removing favorite: {e}")
            return False
    
    async def get_user_favorites(self, user_id: str, 
                                category: Optional[FavoriteCategory] = None,
                                limit: int = 100) -> List[UserFavoriteResponse]:
        """Get user's favorite foods"""
        try:
            query = {"user_id": user_id}
            if category:
                query["category"] = category.value
            
            favorites = list(self.favorites_collection.find(query)
                           .sort("created_at", -1)
                           .limit(limit))
            
            # Get food details for each favorite
            result = []
            for fav in favorites:
                try:
                    favorite_response = await self._get_favorite_with_food_details(str(fav["_id"]))
                    result.append(favorite_response)
                except Exception as e:
                    logger.warning(f"Could not get details for favorite {fav['_id']}: {e}")
                    continue
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting user favorites: {e}")
            return []
    
    async def update_favorite(self, user_id: str, food_id: str, 
                            update_data: UserFavoriteUpdate) -> Optional[UserFavoriteResponse]:
        """Update a favorite food"""
        try:
            # Build update document
            update_doc = {"updated_at": datetime.utcnow()}
            
            if update_data.custom_name is not None:
                update_doc["custom_name"] = update_data.custom_name
            if update_data.default_serving_size is not None:
                update_doc["default_serving_size"] = update_data.default_serving_size
            if update_data.default_serving_unit is not None:
                update_doc["default_serving_unit"] = update_data.default_serving_unit
            if update_data.category is not None:
                update_doc["category"] = update_data.category.value
            if update_data.notes is not None:
                update_doc["notes"] = update_data.notes
            if update_data.tags is not None:
                update_doc["tags"] = update_data.tags
            
            result = self.favorites_collection.update_one(
                {"user_id": user_id, "food_id": food_id},
                {"$set": update_doc}
            )
            
            if result.matched_count == 0:
                return None
            
            # Get updated favorite
            updated_fav = self.favorites_collection.find_one({
                "user_id": user_id,
                "food_id": food_id
            })
            
            return await self._get_favorite_with_food_details(str(updated_fav["_id"]))
            
        except Exception as e:
            logger.error(f"Error updating favorite: {e}")
            return None
    
    async def increment_usage(self, user_id: str, food_id: str) -> bool:
        """Increment usage count when favorite is used"""
        try:
            result = self.favorites_collection.update_one(
                {"user_id": user_id, "food_id": food_id},
                {
                    "$inc": {"usage_count": 1},
                    "$set": {"last_used": datetime.utcnow(), "updated_at": datetime.utcnow()}
                }
            )
            return result.matched_count > 0
            
        except Exception as e:
            logger.error(f"Error incrementing usage: {e}")
            return False
    
    async def is_favorite(self, user_id: str, food_id: str) -> bool:
        """Check if a food is in user's favorites"""
        try:
            return self.favorites_collection.find_one({
                "user_id": user_id,
                "food_id": food_id
            }) is not None
            
        except Exception as e:
            logger.error(f"Error checking favorite status: {e}")
            return False
    
    async def get_favorites_stats(self, user_id: str) -> UserFavoriteStats:
        """Get user's favorites statistics"""
        try:
            favorites = list(self.favorites_collection.find({"user_id": user_id}))
            
            # Calculate stats
            total_favorites = len(favorites)
            categories_breakdown = {}
            tags_summary = {}
            
            for fav in favorites:
                # Category breakdown
                category = fav.get("category", "general")
                categories_breakdown[category] = categories_breakdown.get(category, 0) + 1
                
                # Tags summary
                for tag in fav.get("tags", []):
                    tags_summary[tag] = tags_summary.get(tag, 0) + 1
            
            # Most used favorites
            most_used = list(self.favorites_collection.find({"user_id": user_id})
                           .sort("usage_count", -1)
                           .limit(5))
            
            # Recent additions
            recent = list(self.favorites_collection.find({"user_id": user_id})
                        .sort("created_at", -1)
                        .limit(5))
            
            # Convert to response objects
            most_used_responses = []
            for fav in most_used:
                try:
                    response = await self._get_favorite_with_food_details(str(fav["_id"]))
                    most_used_responses.append(response)
                except:
                    continue
            
            recent_responses = []
            for fav in recent:
                try:
                    response = await self._get_favorite_with_food_details(str(fav["_id"]))
                    recent_responses.append(response)
                except:
                    continue
            
            return UserFavoriteStats(
                total_favorites=total_favorites,
                categories_breakdown=categories_breakdown,
                most_used_favorites=most_used_responses,
                recent_additions=recent_responses,
                tags_summary=tags_summary
            )
            
        except Exception as e:
            logger.error(f"Error getting favorites stats: {e}")
            return UserFavoriteStats(
                total_favorites=0,
                categories_breakdown={},
                most_used_favorites=[],
                recent_additions=[],
                tags_summary={}
            )
    
    async def _get_favorite_with_food_details(self, favorite_id: str) -> UserFavoriteResponse:
        """Helper to get favorite with food details"""
        try:
            favorite = self.favorites_collection.find_one({"_id": ObjectId(favorite_id)})
            if not favorite:
                raise ValueError(f"Favorite {favorite_id} not found")
            
            # Get food details
            food = self.foods_collection.find_one({"_id": ObjectId(favorite["food_id"])})
            if not food:
                raise ValueError(f"Food {favorite['food_id']} not found")
            
            return UserFavoriteResponse(
                id=str(favorite["_id"]),
                food_id=favorite["food_id"],
                food_name=food.get("name", "Unknown Food"),
                custom_name=favorite.get("custom_name"),
                default_serving_size=favorite.get("default_serving_size"),
                default_serving_unit=favorite.get("default_serving_unit"),
                category=FavoriteCategory(favorite.get("category", "general")),
                notes=favorite.get("notes"),
                tags=favorite.get("tags", []),
                usage_count=favorite.get("usage_count", 0),
                last_used=favorite.get("last_used"),
                created_at=favorite.get("created_at"),
                updated_at=favorite.get("updated_at"),
                nutrition=food.get("nutrition"),
                dietary_attributes=food.get("dietary_attributes")
            )
            
        except Exception as e:
            logger.error(f"Error getting favorite details: {e}")
            raise e

    async def update_favorite_usage(self, user_id: str, food_id: str) -> bool:
        """Update usage count and last used timestamp for a favorite food"""
        try:
            result = self.favorites_collection.update_one(
                {"user_id": user_id, "food_id": food_id},
                {
                    "$inc": {"usage_count": 1},
                    "$set": {"last_used": datetime.utcnow()}
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating favorite usage: {e}")
            return False

# Create singleton instance
user_favorites_service = UserFavoritesService()
