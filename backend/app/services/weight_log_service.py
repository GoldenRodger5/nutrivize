from ..core.config import get_database
from ..models.weight_log import WeightLogCreate, WeightLogEntry, WeightLogResponse
from typing import List, Optional
from datetime import datetime, date
from bson import ObjectId


class WeightLogService:
    """Weight log service for managing weight tracking"""
    
    def __init__(self):
        self.db = get_database()
        self.weight_logs_collection = None
        
        if self.db is not None:
            self.weight_logs_collection = self.db["weight_logs"]
            # Create index for efficient queries
            try:
                self.weight_logs_collection.create_index([("user_id", 1), ("date", 1)])
            except:
                pass  # Index might already exist
        else:
            print("⚠️  WeightLogService initialized without database connection")
    
    async def log_weight(self, log_data: WeightLogCreate, user_id: str) -> WeightLogResponse:
        """Log a weight entry"""
        weight_log = WeightLogEntry(
            user_id=user_id,
            **log_data.dict()
        )
        
        log_dict = weight_log.dict()
        # Convert date to string for consistent storage
        if isinstance(log_dict['date'], date):
            log_dict['date'] = log_dict['date'].isoformat()
        
        # Check if entry already exists for this date and update instead of insert
        existing_entry = self.weight_logs_collection.find_one({
            "user_id": user_id,
            "date": log_dict['date']
        })
        
        if existing_entry:
            # Update existing entry
            self.weight_logs_collection.update_one(
                {"_id": existing_entry["_id"]},
                {"$set": {
                    "weight": log_dict["weight"],
                    "notes": log_dict.get("notes", ""),
                    "logged_at": log_dict["logged_at"]
                }}
            )
            result_id = str(existing_entry["_id"])
        else:
            # Insert new entry
            result = self.weight_logs_collection.insert_one(log_dict)
            result_id = str(result.inserted_id)
        
        return WeightLogResponse(
            id=result_id,
            **log_data.dict(),
            logged_at=weight_log.logged_at
        )
    
    async def get_weight_logs(self, user_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[WeightLogResponse]:
        """Get weight logs for a user, optionally filtered by date range"""
        query = {"user_id": user_id}
        
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date.isoformat()
            if end_date:
                date_filter["$lte"] = end_date.isoformat()
            query["date"] = date_filter
        
        logs = list(self.weight_logs_collection.find(query).sort("date", -1))
        
        weight_logs = []
        for log in logs:
            # Handle date parsing
            log_date = log["date"]
            if isinstance(log_date, str):
                from datetime import datetime as dt
                try:
                    log_date = dt.fromisoformat(log_date).date()
                except (ValueError, TypeError):
                    log_date = date.today()  # fallback to today's date
            
            # Handle logged_at timestamp
            logged_at = log.get("logged_at")
            if logged_at is None:
                logged_at = datetime.utcnow()  # fallback to current time
            
            weight_logs.append(WeightLogResponse(
                id=str(log["_id"]),
                date=log_date,
                weight=log.get("weight", 0.0),
                notes=log.get("notes", ""),
                logged_at=logged_at
            ))
        
        return weight_logs
    
    async def get_latest_weight(self, user_id: str) -> Optional[WeightLogResponse]:
        """Get the most recent weight entry for a user"""
        log = self.weight_logs_collection.find_one(
            {"user_id": user_id},
            sort=[("date", -1)]
        )
        
        if not log:
            return None
        
        # Handle date parsing
        log_date = log["date"]
        if isinstance(log_date, str):
            from datetime import datetime as dt
            log_date = dt.fromisoformat(log_date).date()
        
        return WeightLogResponse(
            id=str(log["_id"]),
            date=log_date,
            weight=log["weight"],
            notes=log.get("notes", ""),
            logged_at=log["logged_at"]
        )
    
    async def update_weight_log(self, log_id: str, updates: dict, user_id: str) -> Optional[WeightLogResponse]:
        """Update a weight log entry"""
        try:
            result = self.weight_logs_collection.update_one(
                {"_id": ObjectId(log_id), "user_id": user_id},
                {"$set": updates}
            )
            
            if result.modified_count == 0:
                return None
            
            # Get updated entry
            log_doc = self.weight_logs_collection.find_one({"_id": ObjectId(log_id)})
            if not log_doc:
                return None
            
            # Handle date parsing
            log_date = log_doc["date"]
            if isinstance(log_date, str):
                from datetime import datetime as dt
                log_date = dt.fromisoformat(log_date).date()
            
            return WeightLogResponse(
                id=str(log_doc["_id"]),
                date=log_date,
                weight=log_doc["weight"],
                notes=log_doc.get("notes", ""),
                logged_at=log_doc["logged_at"]
            )
        except:
            return None
    
    async def delete_weight_log(self, log_id: str, user_id: str) -> bool:
        """Delete a weight log entry"""
        try:
            result = self.weight_logs_collection.delete_one(
                {"_id": ObjectId(log_id), "user_id": user_id}
            )
            return result.deleted_count > 0
        except:
            return False


# Global weight log service instance
weight_log_service = WeightLogService()
