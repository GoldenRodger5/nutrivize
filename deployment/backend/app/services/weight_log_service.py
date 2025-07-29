from ..core.config import get_database
from ..core.redis_client import redis_client
from ..models.weight_log import WeightLogCreate, WeightLogEntry, WeightLogResponse
from typing import List, Optional
from datetime import datetime, date, timedelta
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
        
        # Write-through caching: immediately update weight logs cache
        if redis_client.is_connected():
            cached_logs = redis_client.get_weight_logs_cached(user_id)
            if cached_logs:
                # Create new weight log entry
                new_weight_entry = {
                    "id": result_id,
                    "date": log_data.date,
                    "weight": log_data.weight,
                    "notes": log_data.notes or "",
                    "logged_at": weight_log.logged_at
                }
                
                # Check if updating existing entry (same date)
                existing_index = None
                for i, cached_log in enumerate(cached_logs):
                    if cached_log.get("date") == log_data.date or cached_log.get("date") == log_data.date.isoformat():
                        existing_index = i
                        break
                
                if existing_index is not None:
                    # Update existing entry
                    cached_logs[existing_index] = new_weight_entry
                else:
                    # Add new entry and sort by date (most recent first)
                    cached_logs.append(new_weight_entry)
                    cached_logs.sort(key=lambda x: x.get("date", ""), reverse=True)
                
                # Update cache
                redis_client.cache_weight_logs_long_term(user_id, cached_logs)
            else:
                # No cache exists, will be created on next read
                pass
        
        return WeightLogResponse(
            id=result_id,
            **log_data.dict(),
            logged_at=weight_log.logged_at
        )
    
    async def get_weight_logs(self, user_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[WeightLogResponse]:
        """Get weight logs for a user with Redis caching, optionally filtered by date range"""
        # For filtered queries, skip cache (complex caching logic)
        if start_date or end_date:
            return await self._get_weight_logs_from_db(user_id, start_date, end_date)
        
        # Try Redis cache for full user weight logs
        if redis_client.is_connected():
            cached_logs = redis_client.get_weight_logs_cached(user_id)
            if cached_logs:
                return [WeightLogResponse(**log) for log in cached_logs]
        
        # Cache miss - fetch all logs from database
        logs_data = await self._get_weight_logs_from_db(user_id, None, None)
        
        # Cache for 48 hours (weight logs don't change frequently, accessed multiple times daily)
        if redis_client.is_connected() and logs_data:
            cache_data = [log.dict() for log in logs_data]
            redis_client.cache_weight_logs_long_term(user_id, cache_data)
        
        return logs_data
    
    async def _get_weight_logs_from_db(self, user_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[WeightLogResponse]:
        """Internal method to fetch weight logs from database"""
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

    async def get_weight_logs_range(self, user_id: str, start_date: str, end_date: str) -> List[dict]:
        """Get weight logs for a date range"""
        try:
            if not self.weight_logs_collection:
                return []
            
            # Query weight logs within the date range
            query = {
                "user_id": user_id,
                "date": {
                    "$gte": start_date,
                    "$lte": end_date
                }
            }
            
            # Get all weight logs in the range
            cursor = self.weight_logs_collection.find(query).sort("date", 1)
            weight_logs = []
            
            for doc in cursor:
                # Convert ObjectId to string
                doc["_id"] = str(doc["_id"])
                weight_logs.append(doc)
            
            return weight_logs
            
        except Exception as e:
            print(f"Error getting weight logs range: {e}")
            return []


# Global weight log service instance
weight_log_service = WeightLogService()
