"""
Redis client for caching and real-time features
"""
import redis
import json
import logging
from typing import Any, Optional, Dict, List
from datetime import timedelta
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
    
    # Caching helpers for common operations
    def cache_user_data(self, user_id: str, data: Dict[str, Any], expiry: timedelta = timedelta(hours=1)) -> bool:
        """Cache user data"""
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
        """Cache food logs for a specific date"""
        return self.set(f"food_logs:{user_id}:{date}", logs, expiry)
    
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

# Global Redis client instance
redis_client = RedisClient()
