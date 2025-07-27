"""
Redis client for caching and real-time features
"""
import redis
import json
import logging
from typing import Any, Optional, Dict, List
from datetime import timedelta, datetime
import os

logger = logging.getLogger(__name__)

class RedisClient:
    """Redis client for caching and real-time features"""
    
    def __init__(self):
        self.client = None
        self._connect()
    
    def _connect(self):
        """Connect to Redis"""
        try:
            # Try to connect to Redis
            redis_url = os.getenv("REDIS_URL", "")
            
            if redis_url and redis_url.startswith("redis://"):
                self.client = redis.from_url(redis_url, decode_responses=True)
            else:
                # Use Redis Cloud credentials
                self.client = redis.Redis(
                    host=os.getenv("REDIS_HOST", "redis-12387.c102.us-east-1-mz.ec2.redns.redis-cloud.com"),
                    port=int(os.getenv("REDIS_PORT", 12387)),
                    username=os.getenv("REDIS_USERNAME", "admin"),
                    password=os.getenv("REDIS_PASSWORD", "Buddydog#41"),
                    decode_responses=True
                )
            
            # Test connection
            self.client.ping()
            logger.info("✅ Connected to Redis successfully")
            
        except Exception as e:
            logger.warning(f"Redis not available: {e}. Continuing without caching.")
            self.client = None
    
    def is_connected(self) -> bool:
        """Check if Redis is connected"""
        return self.client is not None
    
    def set(self, key: str, value: Any, expiry: Optional[timedelta] = None) -> bool:
        """Set a value in Redis with optional expiry"""
        if not self.client:
            return False
        
        try:
            # Serialize the value
            serialized_value = json.dumps(value, default=str)
            
            if expiry:
                return self.client.setex(key, expiry, serialized_value)
            else:
                return self.client.set(key, serialized_value)
        except Exception as e:
            logger.error(f"Error setting Redis key {key}: {e}")
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from Redis"""
        if not self.client:
            return None
        
        try:
            value = self.client.get(key)
            if value is None:
                return None
            
            return json.loads(value)
        except Exception as e:
            logger.error(f"Error getting Redis key {key}: {e}")
            return None
    
    def delete(self, key: str) -> bool:
        """Delete a key from Redis"""
        if not self.client:
            return False
        
        try:
            return bool(self.client.delete(key))
        except Exception as e:
            logger.error(f"Error deleting Redis key {key}: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Check if a key exists in Redis"""
        if not self.client:
            return False
        
        try:
            return bool(self.client.exists(key))
        except Exception as e:
            logger.error(f"Error checking Redis key {key}: {e}")
            return False
    
    def expire(self, key: str, expiry: timedelta) -> bool:
        """Set expiry for a key"""
        if not self.client:
            return False
        
        try:
            return self.client.expire(key, expiry)
        except Exception as e:
            logger.error(f"Error setting expiry for Redis key {key}: {e}")
            return False
    
    def keys(self, pattern: str = "*") -> List[str]:
        """Get all keys matching a pattern"""
        if not self.client:
            return []
        
        try:
            return self.client.keys(pattern)
        except Exception as e:
            logger.error(f"Error getting Redis keys with pattern {pattern}: {e}")
            return []
    
    def flush_pattern(self, pattern: str) -> int:
        """Delete all keys matching a pattern"""
        if not self.client:
            return 0
        
        try:
            keys = self.keys(pattern)
            if keys:
                return self.client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Error flushing Redis keys with pattern {pattern}: {e}")
            return 0
    
    # Caching helpers for common operations with optimized TTLs for 6-8 daily visits
    def cache_user_data(self, user_id: str, data: Dict[str, Any], expiry: timedelta = timedelta(hours=24)) -> bool:
        """Cache user data for 24 hours - profile changes are rare, accessed every session"""
        return self.set(f"user:{user_id}", data, expiry)
    
    def get_user_data(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached user data"""
        return self.get(f"user:{user_id}")
    
    def cache_shopping_list(self, plan_id: str, shopping_list: Dict[str, Any], expiry: timedelta = timedelta(hours=6)) -> bool:
        """Cache shopping list"""
        return self.set(f"shopping_list:{plan_id}", shopping_list, expiry)
    
    def get_shopping_list(self, plan_id: str) -> Optional[Dict[str, Any]]:
        """Get cached shopping list"""
        return self.get(f"shopping_list:{plan_id}")
    
    def cache_food_logs(self, user_id: str, date: str, logs: List[Dict[str, Any]], expiry: timedelta = timedelta(minutes=30)) -> bool:
        """Cache food logs for a specific date with smart TTL"""
        # Use graduated TTL based on date recency for better performance
        smart_expiry = self.get_smart_food_logs_ttl(date)
        return self.set(f"food_logs:{user_id}:{date}", logs, smart_expiry)
    
    def get_smart_food_logs_ttl(self, date_str: str) -> timedelta:
        """Get appropriate cache duration based on date recency - optimized for frequent daily visits"""
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            today = datetime.now().date()
            days_old = (today - target_date).days
            
            if days_old == 0:
                return timedelta(hours=2)     # Today - still changing but cache longer between visits
            elif days_old <= 2:
                return timedelta(hours=8)     # Recent - occasional changes, cache for most of day
            else:
                return timedelta(hours=48)    # Historical - rarely changes, multi-day cache
        except:
            # Fallback to default if date parsing fails
            return timedelta(hours=2)
    
    def get_food_logs(self, user_id: str, date: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached food logs"""
        return self.get(f"food_logs:{user_id}:{date}")
    
    def invalidate_user_cache(self, user_id: str) -> int:
        """Invalidate all cache for a user"""
        patterns = [
            f"user:{user_id}",
            f"food_logs:{user_id}:*",
            f"meal_plans:{user_id}:*"
        ]
        
        total_deleted = 0
        for pattern in patterns:
            total_deleted += self.flush_pattern(pattern)
        
        return total_deleted
    
    def cache_food_search(self, query: str, results: List[Dict[str, Any]], expiry: timedelta = timedelta(hours=2)) -> bool:
        """Cache food search results"""
        # Create a simple hash of the query for the key
        import hashlib
        query_hash = hashlib.md5(query.lower().encode()).hexdigest()[:8]
        return self.set(f"food_search:{query_hash}", results, expiry)
    
    def get_food_search(self, query: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached food search results"""
        import hashlib
        query_hash = hashlib.md5(query.lower().encode()).hexdigest()[:8]
        return self.get(f"food_search:{query_hash}")
    
    # Optimized caching methods for high-frequency data with multi-day TTLs
    def cache_food_index_long_term(self, user_id: str, food_index: List[Dict[str, Any]]) -> bool:
        """Cache food index for 72 hours - foods are rarely deleted, accessed constantly"""
        return self.set(f"food_index:{user_id}", food_index, timedelta(hours=72))
    
    def get_food_index(self, user_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached food index"""
        return self.get(f"food_index:{user_id}")
    
    def invalidate_food_index(self, user_id: str) -> bool:
        """Invalidate food index cache when foods are added/modified"""
        return self.delete(f"food_index:{user_id}")
    
    def cache_food_logs_smart(self, user_id: str, date: str, logs: Dict[str, Any]) -> bool:
        """Cache food logs with smart TTL based on date recency"""
        smart_expiry = self.get_smart_food_logs_ttl(date)
        return self.set(f"food_logs:{user_id}:{date}", logs, smart_expiry)
    
    # New helper methods for write-through caching
    def cache_goals_long_term(self, user_id: str, goals: List[Dict[str, Any]]) -> bool:
        """Cache user goals for 24 hours - goals change weekly/monthly, checked daily"""
        return self.set(f"goals:{user_id}", goals, timedelta(hours=24))
    
    def get_goals(self, user_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached goals"""
        return self.get(f"goals:{user_id}")
    
    def cache_active_goal(self, user_id: str, goal: Dict[str, Any]) -> bool:
        """Cache active goal for 24 hours"""
        return self.set(f"active_goal:{user_id}", goal, timedelta(hours=24))
    
    def get_active_goal(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached active goal"""
        return self.get(f"active_goal:{user_id}")
    
    def cache_weight_logs_long_term(self, user_id: str, weight_logs: List[Dict[str, Any]]) -> bool:
        """Cache weight logs for 48 hours - weight logged daily, viewed multiple times"""
        return self.set(f"weight_logs:{user_id}", weight_logs, timedelta(hours=48))
    
    def get_weight_logs_cached(self, user_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached weight logs"""
        return self.get(f"weight_logs:{user_id}")
    
    def invalidate_goals_cache(self, user_id: str) -> bool:
        """Invalidate goals cache when goals are modified"""
        deleted_goals = self.delete(f"goals:{user_id}")
        deleted_active = self.delete(f"active_goal:{user_id}")
        return deleted_goals or deleted_active

# Global Redis client instance
redis_client = RedisClient()
