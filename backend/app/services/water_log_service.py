"""
Water Log Service - Handles water intake logging and tracking
"""

import logging
from datetime import date, datetime, timedelta
from typing import List, Optional
from bson import ObjectId
from ..core.config import get_database
from ..models.water_log import WaterLogCreate, WaterLogEntry, WaterLogResponse, DailyWaterSummary

logger = logging.getLogger(__name__)

class WaterLogService:
    """Service for managing water intake logs"""
    
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.water_logs
    
    async def log_water(self, log_data: WaterLogCreate, user_id: str) -> WaterLogResponse:
        """Log a water intake entry"""
        try:
            water_log_data = {
                "user_id": user_id,
                "date": log_data.date.isoformat(),  # Convert date to string
                "amount": log_data.amount,
                "notes": log_data.notes,
                "logged_at": datetime.utcnow()
            }
            
            # Insert into database
            result = self.collection.insert_one(water_log_data)
            
            # Return the created log
            created_log = self.collection.find_one({"_id": result.inserted_id})
            return WaterLogResponse(
                id=str(created_log["_id"]),
                date=created_log["date"],
                amount=created_log["amount"],
                notes=created_log["notes"],
                logged_at=created_log["logged_at"]
            )
            
        except Exception as e:
            logger.error(f"Error logging water intake: {e}")
            raise Exception(f"Failed to log water intake: {str(e)}")
    
    async def get_water_logs(self, user_id: str, start_date: Optional[date] = None, 
                            end_date: Optional[date] = None) -> List[WaterLogResponse]:
        """Get water logs for a user within a date range"""
        try:
            query = {"user_id": user_id}
            
            if start_date or end_date:
                date_filter = {}
                if start_date:
                    date_filter["$gte"] = start_date.isoformat()
                if end_date:
                    date_filter["$lte"] = end_date.isoformat()
                query["date"] = date_filter
            
            logs = list(self.collection.find(query).sort("date", -1))
            
            return [
                WaterLogResponse(
                    id=str(log["_id"]),
                    date=log["date"],
                    amount=log["amount"],
                    notes=log["notes"],
                    logged_at=log["logged_at"]
                )
                for log in logs
            ]
            
        except Exception as e:
            logger.error(f"Error getting water logs: {e}")
            raise Exception(f"Failed to get water logs: {str(e)}")
    
    async def get_daily_water_summary(self, user_id: str, target_date: date) -> DailyWaterSummary:
        """Get daily water intake summary"""
        try:
            query = {"user_id": user_id, "date": target_date.isoformat()}
            logs = list(self.collection.find(query))
            
            total_amount = sum(log["amount"] for log in logs)
            target_amount = 64.0  # 64 fluid ounces per day
            percentage = min((total_amount / target_amount) * 100, 100) if target_amount > 0 else 0
            
            return DailyWaterSummary(
                date=target_date,
                total_amount=total_amount,
                target_amount=target_amount,
                percentage=percentage,
                logs_count=len(logs)
            )
            
        except Exception as e:
            logger.error(f"Error getting daily water summary: {e}")
            raise Exception(f"Failed to get daily water summary: {str(e)}")
    
    async def get_latest_water_logs(self, user_id: str, limit: int = 5) -> List[WaterLogResponse]:
        """Get the most recent water logs"""
        try:
            logs = list(self.collection.find({"user_id": user_id})
                       .sort("logged_at", -1)
                       .limit(limit))
            
            return [
                WaterLogResponse(
                    id=str(log["_id"]),
                    date=log["date"],
                    amount=log["amount"],
                    notes=log["notes"],
                    logged_at=log["logged_at"]
                )
                for log in logs
            ]
            
        except Exception as e:
            logger.error(f"Error getting latest water logs: {e}")
            raise Exception(f"Failed to get latest water logs: {str(e)}")
    
    async def update_water_log(self, log_id: str, updates: dict, user_id: str) -> Optional[WaterLogResponse]:
        """Update a water log entry"""
        try:
            # Only allow the owner to update
            query = {"_id": ObjectId(log_id), "user_id": user_id}
            
            # Update the log
            result = self.collection.update_one(query, {"$set": updates})
            
            if result.matched_count == 0:
                return None
            
            # Return the updated log
            updated_log = self.collection.find_one({"_id": ObjectId(log_id)})
            return WaterLogResponse(
                id=str(updated_log["_id"]),
                date=updated_log["date"],
                amount=updated_log["amount"],
                notes=updated_log["notes"],
                logged_at=updated_log["logged_at"]
            )
            
        except Exception as e:
            logger.error(f"Error updating water log: {e}")
            raise Exception(f"Failed to update water log: {str(e)}")
    
    async def delete_water_log(self, log_id: str, user_id: str) -> bool:
        """Delete a water log entry"""
        try:
            # Only allow the owner to delete
            query = {"_id": ObjectId(log_id), "user_id": user_id}
            result = self.collection.delete_one(query)
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting water log: {e}")
            raise Exception(f"Failed to delete water log: {str(e)}")

# Create a singleton instance
water_log_service = WaterLogService()
