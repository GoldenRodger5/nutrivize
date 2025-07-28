from ..core.config import get_database
from ..core.redis_client import redis_client
from ..models.food_log import FoodLogEntry, FoodLogCreate, FoodLogResponse, DailyNutritionSummary
from ..models.food import NutritionInfo
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from bson import ObjectId
from collections import defaultdict
import re
import logging

logger = logging.getLogger(__name__)


class FoodLogService:
    """Food log service for managing food logging"""
    
    def __init__(self):
        self.db = get_database()
        self.food_logs_collection = None
        
        if self.db is not None:
            self.food_logs_collection = self.db["food_logs"]
            # Create index for efficient queries
            try:
                self.food_logs_collection.create_index([("user_id", 1), ("date", 1)])
            except:
                pass  # Index might already exist
        else:
            print("⚠️  FoodLogService initialized without database connection")
    
    def _parse_amount(self, amount_value: Any) -> float:
        """Parse amount value, handling both strings and numbers"""
        if isinstance(amount_value, (int, float)):
            return float(amount_value)
        
        if isinstance(amount_value, str):
            # Extract numeric part from strings like "200g" or "1.5 cups"
            match = re.search(r'(\d+\.?\d*)', amount_value)
            if match:
                return float(match.group(1))
            else:
                return 1.0  # Default fallback
        
        return 1.0  # Default fallback for any other type
    
    async def log_food(self, log_data: FoodLogCreate, user_id: str) -> FoodLogResponse:
        """Log a food entry and invalidate cache"""
        food_log = FoodLogEntry(
            user_id=user_id,
            **log_data.dict()
        )
        
        log_dict = food_log.dict()
        # Convert date to string for consistent storage
        if isinstance(log_dict['date'], date):
            log_dict['date'] = log_dict['date'].isoformat()
        
        result = self.food_logs_collection.insert_one(log_dict)
        
        # ✅ VECTORIZE NEW FOOD LOG FOR AI CONTEXT
        try:
            from .vector_management_service import vector_management_service
            # Add the document ID to the log data for vectorization
            log_dict_with_id = {**log_dict, "_id": str(result.inserted_id)}
            await vector_management_service.on_food_log_created(user_id, log_dict_with_id)
            logger.info(f"✅ Vectorized new food log for user {user_id}")
        except Exception as vector_error:
            logger.warning(f"⚠️ Failed to vectorize food log: {vector_error}")
            # Don't fail the request if vectorization fails
        
        # Write-through caching: immediately update cache with new log
        if redis_client.is_connected():
            date_str = log_data.date.isoformat() if isinstance(log_data.date, date) else log_data.date
            cached_summary = redis_client.get_food_logs(user_id, date_str)
            if cached_summary:
                # Create new log entry
                new_log_entry = {
                    "id": str(result.inserted_id),
                    "date": log_data.date,
                    "meal_type": log_data.meal_type,
                    "food_id": log_data.food_id,
                    "food_name": log_data.food_name,
                    "amount": self._parse_amount(log_data.amount),
                    "unit": log_data.unit,
                    "nutrition": log_data.nutrition.dict(),
                    "notes": log_data.notes or "",
                    "logged_at": log_dict["logged_at"]
                }
                
                # Add to cached meals
                cached_summary["meals"].append(new_log_entry)
                
                # Update totals
                nutrition = log_data.nutrition.dict()
                cached_summary["total_nutrition"]["calories"] += nutrition.get("calories", 0)
                cached_summary["total_nutrition"]["protein"] += nutrition.get("protein", 0)
                cached_summary["total_nutrition"]["carbs"] += nutrition.get("carbs", 0)
                cached_summary["total_nutrition"]["fat"] += nutrition.get("fat", 0)
                cached_summary["total_nutrition"]["fiber"] += nutrition.get("fiber", 0)
                cached_summary["total_nutrition"]["sugar"] += nutrition.get("sugar", 0)
                cached_summary["total_nutrition"]["sodium"] += nutrition.get("sodium", 0)
                
                # Update meal breakdown
                meal_type = log_data.meal_type
                if meal_type not in cached_summary["meal_breakdown"]:
                    cached_summary["meal_breakdown"][meal_type] = {
                        "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0, "sodium": 0
                    }
                
                cached_summary["meal_breakdown"][meal_type]["calories"] += nutrition.get("calories", 0)
                cached_summary["meal_breakdown"][meal_type]["protein"] += nutrition.get("protein", 0)
                cached_summary["meal_breakdown"][meal_type]["carbs"] += nutrition.get("carbs", 0)
                cached_summary["meal_breakdown"][meal_type]["fat"] += nutrition.get("fat", 0)
                cached_summary["meal_breakdown"][meal_type]["fiber"] += nutrition.get("fiber", 0)
                
                # Update cache with new summary
                redis_client.cache_food_logs_smart(user_id, date_str, cached_summary)
        
        return FoodLogResponse(
            id=str(result.inserted_id),
            date=log_data.date,
            meal_type=log_data.meal_type,
            food_id=log_data.food_id,
            food_name=log_data.food_name,
            amount=self._parse_amount(log_data.amount),  # Parse amount safely
            unit=log_data.unit,
            nutrition=log_data.nutrition,
            notes=log_data.notes,
            logged_at=food_log.logged_at
        )
    
    async def get_daily_logs(self, user_id: str, target_date: date) -> DailyNutritionSummary:
        """Get all food logs for a specific date with Redis caching"""
        # Convert date to string for caching and MongoDB comparison
        target_date_str = target_date.isoformat() if isinstance(target_date, date) else target_date
        
        # Try to get from Redis cache first
        if redis_client.is_connected():
            cached_data = redis_client.get_food_logs(user_id, target_date_str)
            if cached_data:
                return DailyNutritionSummary(**cached_data)
        
        logs = list(self.food_logs_collection.find({
            "user_id": user_id,
            "date": target_date_str
        }).sort("logged_at", 1))
        
        # Convert to response models
        meal_entries = []
        total_nutrition = NutritionInfo()
        meal_breakdown = defaultdict(lambda: NutritionInfo())
        
        for log in logs:
            # Handle date parsing (could be string or date object)
            log_date = log["date"]
            if isinstance(log_date, str):
                from datetime import datetime as dt
                log_date = dt.fromisoformat(log_date).date()
            
            entry = FoodLogResponse(
                id=str(log["_id"]),
                date=log_date,
                meal_type=log["meal_type"],
                food_id=log.get("food_id", ""),  # Handle missing food_id gracefully
                food_name=log["food_name"],
                amount=self._parse_amount(log["amount"]),  # Parse amount safely
                unit=log["unit"],
                nutrition=log["nutrition"],
                notes=log.get("notes", ""),
                logged_at=log["logged_at"]
            )
            meal_entries.append(entry)
            
            # Add to totals
            nutrition = log["nutrition"]
            total_nutrition.calories += nutrition.get("calories", 0)
            total_nutrition.protein += nutrition.get("protein", 0)
            total_nutrition.carbs += nutrition.get("carbs", 0)
            total_nutrition.fat += nutrition.get("fat", 0)
            total_nutrition.fiber += nutrition.get("fiber", 0)
            total_nutrition.sugar += nutrition.get("sugar", 0)
            total_nutrition.sodium += nutrition.get("sodium", 0)
            
            # Add to meal breakdown
            meal_type = log["meal_type"]
            meal_breakdown[meal_type].calories += nutrition.get("calories", 0)
            meal_breakdown[meal_type].protein += nutrition.get("protein", 0)
            meal_breakdown[meal_type].carbs += nutrition.get("carbs", 0)
            meal_breakdown[meal_type].fat += nutrition.get("fat", 0)
            meal_breakdown[meal_type].fiber += nutrition.get("fiber", 0)
        
        # Get unique meal types for the meals field
        unique_meals = list(set(log["meal_type"] for log in logs))
        
        result = DailyNutritionSummary(
            date=target_date,
            total_nutrition=total_nutrition,
            meals=unique_meals,
            total_foods=len(meal_entries)
        )
        
        # Cache the result in Redis with smart TTL based on date recency
        if redis_client.is_connected():
            # Convert to dict for caching
            cache_data = result.dict()
            redis_client.cache_food_logs_smart(user_id, target_date_str, cache_data)
        
        return result
    
    async def get_date_range_logs(self, user_id: str, start_date: date, end_date: date) -> List[DailyNutritionSummary]:
        """Get food logs for a date range"""
        from datetime import timedelta
        import logging
        
        logger = logging.getLogger(__name__)
        current_date = start_date
        summaries = []
        
        # Safety check for too large date ranges
        days_difference = (end_date - start_date).days
        if days_difference > 60:  # Limit to 60 days to avoid performance issues
            logger.warning(f"Requested date range too large: {days_difference} days")
            end_date = start_date + timedelta(days=60)
            logger.info(f"Limiting to 60 days: {start_date} to {end_date}")
        
        try:
            while current_date <= end_date:
                try:
                    daily_summary = await self.get_daily_logs(user_id, current_date)
                    summaries.append(daily_summary)
                except Exception as e:
                    logger.error(f"Error getting daily logs for {current_date}: {str(e)}")
                    # Create an empty summary for this day to maintain continuity
                    summaries.append(DailyNutritionSummary(
                        date=current_date,
                        total_nutrition=NutritionInfo(),
                        meals=[],
                        meal_breakdown={}
                    ))
                
                current_date = current_date + timedelta(days=1)
            
            return summaries
        except Exception as e:
            logger.error(f"Error in get_date_range_logs: {str(e)}")
            return []  # Return empty list instead of failing
    
    async def update_food_log(self, log_id: str, updates: dict, user_id: str) -> Optional[FoodLogResponse]:
        """Update a food log entry and invalidate cache"""
        try:
            # First get the original entry to know which date to invalidate
            log_doc = self.food_logs_collection.find_one({"_id": ObjectId(log_id), "user_id": user_id})
            if not log_doc:
                return None
            
            result = self.food_logs_collection.update_one(
                {"_id": ObjectId(log_id), "user_id": user_id},
                {"$set": updates}
            )
            
            if result.modified_count == 0:
                return None
            
            # Cache invalidation for updates (write-through would require complex total recalculation)
            if redis_client.is_connected():
                date_str = log_doc["date"]
                if not isinstance(date_str, str):
                    date_str = date_str.isoformat()
                redis_client.delete(f"food_logs:{user_id}:{date_str}")
            
            # Get updated entry
            updated_log_doc = self.food_logs_collection.find_one({"_id": ObjectId(log_id)})
            if not updated_log_doc:
                return None
            
            return FoodLogResponse(
                id=str(updated_log_doc["_id"]),
                date=updated_log_doc["date"],
                meal_type=updated_log_doc["meal_type"],
                food_id=updated_log_doc["food_id"],
                food_name=updated_log_doc["food_name"],
                amount=self._parse_amount(updated_log_doc["amount"]),  # Parse amount safely
                unit=updated_log_doc["unit"],
                nutrition=updated_log_doc["nutrition"],
                notes=updated_log_doc.get("notes", ""),
                logged_at=updated_log_doc["logged_at"]
            )
        except:
            return None
    
    async def delete_food_log(self, log_id: str, user_id: str) -> bool:
        """Delete a food log entry and invalidate cache"""
        try:
            # First get the entry to know which date to invalidate
            log_doc = self.food_logs_collection.find_one({"_id": ObjectId(log_id), "user_id": user_id})
            if not log_doc:
                return False
            
            result = self.food_logs_collection.delete_one(
                {"_id": ObjectId(log_id), "user_id": user_id}
            )
            
            success = result.deleted_count > 0
            
            # Cache invalidation for deletes (write-through would require complex total recalculation)
            if success and redis_client.is_connected():
                date_str = log_doc["date"]
                if not isinstance(date_str, str):
                    date_str = date_str.isoformat()
                redis_client.delete(f"food_logs:{user_id}:{date_str}")
            
            return success
        except:
            return False
    
    async def get_daily_logs_with_goal_progress(self, user_id: str, target_date: date) -> Dict[str, Any]:
        """Get daily food logs with active goal progress"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            logger.info(f"🔍 Getting daily logs with goals for user {user_id} on {target_date}")
            
            # Get daily summary - wrap in try-catch for specific error handling
            try:
                daily_summary = await self.get_daily_logs(user_id, target_date)
                logger.info(f"✅ Successfully got daily logs: {len(daily_summary.meals)} meals")
            except Exception as e:
                logger.error(f"❌ Error getting daily logs for {user_id} on {target_date}: {e}")
                # Create empty summary as fallback
                from ..models.food_log import DailyNutritionSummary, NutritionInfo
                daily_summary = DailyNutritionSummary(
                    date=target_date,
                    meals=[],
                    total_nutrition=NutritionInfo(),
                    meal_breakdown={}
                )
            
            # Get water summary - wrap in try-catch
            try:
                from ..services.water_log_service import water_log_service
                water_summary = await water_log_service.get_daily_water_summary(user_id, target_date)
                logger.info(f"✅ Successfully got water summary: {water_summary.total_amount}oz")
            except Exception as e:
                logger.error(f"❌ Error getting water summary for {user_id} on {target_date}: {e}")
                # Create fallback water summary
                from collections import namedtuple
                WaterSummary = namedtuple('WaterSummary', ['total_amount', 'target_amount', 'percentage'])
                water_summary = WaterSummary(total_amount=0, target_amount=64, percentage=0)
            
            # Get active goal nutrition targets - wrap in try-catch
            try:
                from ..services.goals_service import goals_service
                goal_targets = await goals_service.get_active_goal_nutrition_targets(user_id)
                logger.info(f"✅ Successfully got goal targets: {bool(goal_targets)}")
            except Exception as e:
                logger.error(f"❌ Error getting goal targets for {user_id}: {e}")
                goal_targets = None
            
            result = {
                "date": target_date.isoformat(),
                "food_logs": daily_summary.meals,
                "nutrition_summary": daily_summary.total_nutrition.dict(),
                "water_summary": {
                    "current": water_summary.total_amount,
                    "target": water_summary.target_amount,
                    "percentage": water_summary.percentage
                },
                "goal_progress": None
            }
            
            if goal_targets:
                # Calculate progress toward goals
                consumed = daily_summary.total_nutrition
                progress = {
                    "calories": {
                        "consumed": consumed.calories,
                        "target": goal_targets.get("calories"),
                        "remaining": max(0, goal_targets.get("calories", 0) - consumed.calories),
                        "percentage": min(100, (consumed.calories / goal_targets.get("calories", 1)) * 100) if goal_targets.get("calories") else 0
                    },
                    "protein": {
                        "consumed": consumed.protein,
                        "target": goal_targets.get("protein"),
                        "remaining": max(0, goal_targets.get("protein", 0) - consumed.protein),
                        "percentage": min(100, (consumed.protein / goal_targets.get("protein", 1)) * 100) if goal_targets.get("protein") else 0
                    },
                    "carbs": {
                        "consumed": consumed.carbs,
                        "target": goal_targets.get("carbs"),
                        "remaining": max(0, goal_targets.get("carbs", 0) - consumed.carbs),
                        "percentage": min(100, (consumed.carbs / goal_targets.get("carbs", 1)) * 100) if goal_targets.get("carbs") else 0
                    },
                    "fat": {
                        "consumed": consumed.fat,
                        "target": goal_targets.get("fat"),
                        "remaining": max(0, goal_targets.get("fat", 0) - consumed.fat),
                        "percentage": min(100, (consumed.fat / goal_targets.get("fat", 1)) * 100) if goal_targets.get("fat") else 0
                    }
                }
                
                if goal_targets.get("fiber"):
                    progress["fiber"] = {
                        "consumed": consumed.fiber,
                        "target": goal_targets.get("fiber"),
                        "remaining": max(0, goal_targets.get("fiber", 0) - consumed.fiber),
                        "percentage": min(100, (consumed.fiber / goal_targets.get("fiber", 1)) * 100)
                    }
                
                result["goal_progress"] = progress
            
            return result
            
        except Exception as e:
            # Fallback to regular daily logs if goal integration fails
            daily_summary = await self.get_daily_logs(user_id, target_date)
            return {
                "date": target_date.isoformat(),
                "food_logs": daily_summary.meals,  # Changed from food_logs to meals
                "nutrition_summary": daily_summary.total_nutrition.dict(),
                "goal_progress": None,
                "error": f"Goal integration failed: {str(e)}"
            }

# Global food log service instance
food_log_service = FoodLogService()
