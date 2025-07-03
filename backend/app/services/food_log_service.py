from ..core.config import get_database
from ..models.food_log import FoodLogEntry, FoodLogCreate, FoodLogResponse, DailyNutritionSummary
from ..models.food import NutritionInfo
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from bson import ObjectId
from collections import defaultdict


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
    
    async def log_food(self, log_data: FoodLogCreate, user_id: str) -> FoodLogResponse:
        """Log a food entry"""
        food_log = FoodLogEntry(
            user_id=user_id,
            **log_data.dict()
        )
        
        log_dict = food_log.dict()
        # Convert date to string for consistent storage
        if isinstance(log_dict['date'], date):
            log_dict['date'] = log_dict['date'].isoformat()
        
        result = self.food_logs_collection.insert_one(log_dict)
        
        return FoodLogResponse(
            id=str(result.inserted_id),
            **log_data.dict(),
            logged_at=food_log.logged_at
        )
    
    async def get_daily_logs(self, user_id: str, target_date: date) -> DailyNutritionSummary:
        """Get all food logs for a specific date"""
        # Convert date to string for MongoDB comparison (since we store dates as strings)
        target_date_str = target_date.isoformat() if isinstance(target_date, date) else target_date
        
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
                food_id=log["food_id"],
                food_name=log["food_name"],
                amount=log["amount"],
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
        
        return DailyNutritionSummary(
            date=target_date,
            total_nutrition=total_nutrition,
            meals=meal_entries,
            meal_breakdown=dict(meal_breakdown)
        )
    
    async def get_date_range_logs(self, user_id: str, start_date: date, end_date: date) -> List[DailyNutritionSummary]:
        """Get food logs for a date range"""
        from datetime import timedelta
        
        current_date = start_date
        summaries = []
        
        while current_date <= end_date:
            daily_summary = await self.get_daily_logs(user_id, current_date)
            summaries.append(daily_summary)
            current_date = current_date + timedelta(days=1)
        
        return summaries
    
    async def update_food_log(self, log_id: str, updates: dict, user_id: str) -> Optional[FoodLogResponse]:
        """Update a food log entry"""
        try:
            result = self.food_logs_collection.update_one(
                {"_id": ObjectId(log_id), "user_id": user_id},
                {"$set": updates}
            )
            
            if result.modified_count == 0:
                return None
            
            # Get updated entry
            log_doc = self.food_logs_collection.find_one({"_id": ObjectId(log_id)})
            if not log_doc:
                return None
            
            return FoodLogResponse(
                id=str(log_doc["_id"]),
                date=log_doc["date"],
                meal_type=log_doc["meal_type"],
                food_id=log_doc["food_id"],
                food_name=log_doc["food_name"],
                amount=log_doc["amount"],
                unit=log_doc["unit"],
                nutrition=log_doc["nutrition"],
                notes=log_doc.get("notes", ""),
                logged_at=log_doc["logged_at"]
            )
        except:
            return None
    
    async def delete_food_log(self, log_id: str, user_id: str) -> bool:
        """Delete a food log entry"""
        try:
            result = self.food_logs_collection.delete_one(
                {"_id": ObjectId(log_id), "user_id": user_id}
            )
            return result.deleted_count > 0
        except:
            return False
    
    async def get_daily_logs_with_goal_progress(self, user_id: str, target_date: date) -> Dict[str, Any]:
        """Get daily food logs with active goal progress"""
        try:
            from ..services.goals_service import goals_service
            from ..services.water_log_service import water_log_service
            
            # Get daily summary
            daily_summary = await self.get_daily_logs(user_id, target_date)
            
            # Get water summary
            water_summary = await water_log_service.get_daily_water_summary(user_id, target_date)
            
            # Get active goal nutrition targets
            goal_targets = await goals_service.get_active_goal_nutrition_targets(user_id)
            
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
