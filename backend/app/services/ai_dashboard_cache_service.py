"""
AI Dashboard Cache Service - Handles caching of AI-generated insights
"""

import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from ..core.config import get_database
import logging

logger = logging.getLogger(__name__)

class AIDashboardCacheService:
    """
    Service to cache AI dashboard data and regenerate every 2 DAYS for optimal performance
    """
    
    def __init__(self):
        self.db = get_database()
        self.cache_duration_hours = 48  # Extended to 2 days
    
    async def get_cached_data(self, user_id: str, data_type: str) -> Optional[Dict[str, Any]]:
        """Get cached data if it exists and is not expired"""
        try:
            cache_doc = self.db.ai_dashboard_cache.find_one({
                "user_id": user_id,
                "data_type": data_type
            })
            
            if not cache_doc:
                return None
            
            # Check if cache is expired (older than 2 days)
            cache_time = cache_doc.get("generated_at")
            if isinstance(cache_time, str):
                cache_time = datetime.fromisoformat(cache_time)
            
            expiry_time = cache_time + timedelta(hours=self.cache_duration_hours)
            
            if datetime.utcnow() > expiry_time:
                # Cache expired, remove it
                self.db.ai_dashboard_cache.delete_one({
                    "user_id": user_id,
                    "data_type": data_type
                })
                return None
            
            # Return cached data
            return cache_doc.get("data")
            
        except Exception as e:
            logger.error(f"Error getting cached data: {e}")
            return None
    
    async def cache_data(self, user_id: str, data_type: str, data: Dict[str, Any]) -> bool:
        """Cache AI dashboard data"""
        try:
            cache_doc = {
                "user_id": user_id,
                "data_type": data_type,
                "data": data,
                "generated_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(hours=self.cache_duration_hours)
            }
            
            # Upsert the cache document
            self.db.ai_dashboard_cache.update_one(
                {"user_id": user_id, "data_type": data_type},
                {"$set": cache_doc},
                upsert=True
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error caching data: {e}")
            return False
    
    async def invalidate_cache(self, user_id: str, data_type: Optional[str] = None) -> bool:
        """Invalidate cache for user (all types or specific type)"""
        try:
            query = {"user_id": user_id}
            if data_type:
                query["data_type"] = data_type
            
            self.db.ai_dashboard_cache.delete_many(query)
            return True
            
        except Exception as e:
            logger.error(f"Error invalidating cache: {e}")
            return False
    
    async def get_cache_status(self, user_id: str) -> Dict[str, Any]:
        """Get cache status for user"""
        try:
            cache_docs = list(self.db.ai_dashboard_cache.find({"user_id": user_id}))
            
            status = {
                "cached_types": [],
                "cache_info": {}
            }
            
            for doc in cache_docs:
                data_type = doc.get("data_type")
                generated_at = doc.get("generated_at")
                expires_at = doc.get("expires_at")
                
                status["cached_types"].append(data_type)
                status["cache_info"][data_type] = {
                    "generated_at": generated_at.isoformat() if isinstance(generated_at, datetime) else generated_at,
                    "expires_at": expires_at.isoformat() if isinstance(expires_at, datetime) else expires_at,
                    "is_expired": datetime.utcnow() > expires_at if isinstance(expires_at, datetime) else False
                }
            
            return status
            
        except Exception as e:
            logger.error(f"Error getting cache status: {e}")
            return {"cached_types": [], "cache_info": {}}

# Global instance
ai_dashboard_cache_service = AIDashboardCacheService()
