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
    
    # Caching helpers for common operations with EXTENDED TTLs for optimal performance
    def cache_user_data(self, user_id: str, data: Dict[str, Any], expiry: timedelta = timedelta(days=7)) -> bool:
        """Cache user data for 7 DAYS - profile changes are rare, accessed every session"""
        return self.set(f"user:{user_id}", data, expiry)
    
    def get_user_data(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached user data"""
        return self.get(f"user:{user_id}")
    
    def cache_shopping_list(self, plan_id: str, shopping_list: Dict[str, Any], expiry: timedelta = timedelta(days=3)) -> bool:
        """Cache shopping list for 3 DAYS - rarely changes once generated"""
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
        """Get appropriate cache duration based on date recency - EXTENDED for multi-day caching"""
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            today = datetime.now().date()
            days_old = (today - target_date).days
            
            if days_old == 0:
                return timedelta(hours=6)     # Today - cache for 6 hours between updates
            elif days_old <= 2:
                return timedelta(days=1)      # Recent - cache for 1 day
            elif days_old <= 7:
                return timedelta(days=3)      # Last week - cache for 3 days
            else:
                return timedelta(days=7)      # Historical - cache for 7 days (rarely changes)
        except:
            # Fallback to default if date parsing fails
            return timedelta(hours=6)
    
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
    
    def cache_food_search(self, cache_key: str, results: List[Dict[str, Any]], expiry: timedelta = timedelta(days=2)) -> bool:
        """Cache food search results for 2 DAYS - food data rarely changes"""
        return self.set(cache_key, results, expiry)
    
    def get_food_search(self, cache_key: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached food search results with custom cache key"""
        return self.get(cache_key)
    
    # Optimized caching methods for high-frequency data with EXTENDED multi-day TTLs
    def cache_food_index_long_term(self, user_id: str, food_index: List[Dict[str, Any]]) -> bool:
        """Cache food index for 7 DAYS - foods are rarely deleted, accessed constantly"""
        return self.set(f"food_index:{user_id}", food_index, timedelta(days=7))
    
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
    
    # Extended TTL helper methods for write-through caching
    def cache_goals_long_term(self, user_id: str, goals: List[Dict[str, Any]]) -> bool:
        """Cache user goals for 5 DAYS - goals change weekly/monthly, checked daily"""
        return self.set(f"goals:{user_id}", goals, timedelta(days=5))
    
    def get_goals(self, user_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached goals"""
        return self.get(f"goals:{user_id}")
    
    def cache_active_goal(self, user_id: str, goal: Dict[str, Any]) -> bool:
        """Cache active goal for 5 DAYS - active goals rarely change"""
        return self.set(f"active_goal:{user_id}", goal, timedelta(days=5))
    
    def get_active_goal(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached active goal"""
        return self.get(f"active_goal:{user_id}")
    
    def cache_weight_logs_long_term(self, user_id: str, weight_logs: List[Dict[str, Any]]) -> bool:
        """Cache weight logs for 7 DAYS - weight logged daily, viewed multiple times"""
        return self.set(f"weight_logs:{user_id}", weight_logs, timedelta(days=7))
    
    def get_weight_logs_cached(self, user_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached weight logs"""
        return self.get(f"weight_logs:{user_id}")
    
    # New extended cache methods for other frequently accessed data
    def cache_preferences_long_term(self, user_id: str, preferences: Dict[str, Any]) -> bool:
        """Cache user preferences for 10 DAYS - preferences rarely change"""
        return self.set(f"preferences:{user_id}", preferences, timedelta(days=10))
    
    def get_preferences_cached(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached preferences"""
        return self.get(f"preferences:{user_id}")
    
    def cache_analytics_smart(self, user_id: str, analytics_type: str, data: Dict[str, Any]) -> bool:
        """Smart analytics caching with different TTLs based on data type"""
        # AI-generated insights should be fresher, computational analytics can be cached longer
        if "ai_insights" in analytics_type or "coaching" in analytics_type:
            # AI insights: 2 hours max - want fresh insights based on recent data
            return self.set(f"analytics:{user_id}:{analytics_type}", data, timedelta(hours=2))
        elif "weekly_summary" in analytics_type:
            # Weekly summaries: 6 hours - calculated data but should reflect same-day updates  
            return self.set(f"analytics:{user_id}:{analytics_type}", data, timedelta(hours=6))
        elif "monthly_summary" in analytics_type:
            # Monthly summaries: 1 day - historical data changes less frequently
            return self.set(f"analytics:{user_id}:{analytics_type}", data, timedelta(days=1))
        elif "trends" in analytics_type or "macro_breakdown" in analytics_type:
            # Trends/breakdowns: 8 hours - computational but should stay reasonably fresh
            return self.set(f"analytics:{user_id}:{analytics_type}", data, timedelta(hours=8))
        else:
            # Default analytics: 12 hours - balance between computation cost and freshness
            return self.set(f"analytics:{user_id}:{analytics_type}", data, timedelta(hours=12))
    
    def get_analytics_cached(self, user_id: str, analytics_type: str) -> Optional[Dict[str, Any]]:
        """Get cached analytics data"""
        return self.get(f"analytics:{user_id}:{analytics_type}")
    
    # Legacy method for backward compatibility
    def cache_analytics_long_term(self, user_id: str, analytics_type: str, data: Dict[str, Any]) -> bool:
        """Legacy method - redirects to smart caching"""
        return self.cache_analytics_smart(user_id, analytics_type, data)
    
    def cache_meal_plans_long_term(self, user_id: str, meal_plans: List[Dict[str, Any]]) -> bool:
        """Cache meal plans for 5 DAYS - meal plans change weekly"""
        return self.set(f"meal_plans:{user_id}", meal_plans, timedelta(days=5))
    
    def get_meal_plans_cached(self, user_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached meal plans"""
        return self.get(f"meal_plans:{user_id}")
    
    # Enhanced invalidation methods for write-through caching
    def invalidate_goals_cache(self, user_id: str) -> bool:
        """Invalidate goals cache when goals are modified - for write-through updates"""
        deleted_goals = self.delete(f"goals:{user_id}")
        deleted_active = self.delete(f"active_goal:{user_id}")
        return deleted_goals or deleted_active
    
    def invalidate_preferences_cache(self, user_id: str) -> bool:
        """Invalidate preferences cache when preferences are modified"""
        return self.delete(f"preferences:{user_id}")
    
    def invalidate_weight_logs_cache(self, user_id: str) -> bool:
        """Invalidate weight logs cache when weight is logged"""
        return self.delete(f"weight_logs:{user_id}")
    
    def invalidate_analytics_cache(self, user_id: str, analytics_type: str = None) -> bool:
        """Invalidate analytics cache - optionally specific type"""
        if analytics_type:
            return self.delete(f"analytics:{user_id}:{analytics_type}")
        else:
            # Invalidate all analytics for user
            patterns = [f"analytics:{user_id}:*"]
            total_deleted = 0
            for pattern in patterns:
                total_deleted += self.flush_pattern(pattern)
            return total_deleted > 0
    
    def invalidate_meal_plans_cache(self, user_id: str) -> bool:
        """Invalidate meal plans cache when plans are modified"""
        return self.delete(f"meal_plans:{user_id}")
    
    def invalidate_food_logs_cache(self, user_id: str, date: str = None) -> bool:
        """Invalidate food logs cache - optionally for specific date"""
        if date:
            return self.delete(f"food_logs:{user_id}:{date}")
        else:
            # Invalidate all food logs for user
            patterns = [f"food_logs:{user_id}:*"]
            total_deleted = 0
            for pattern in patterns:
                total_deleted += self.flush_pattern(pattern)
            return total_deleted > 0
    
    # Smart caching for AI-powered services and user favorites
    def cache_user_favorites(self, user_id: str, favorites: List[Dict[str, Any]]) -> bool:
        """Cache user favorites for 5 DAYS - accessed frequently, change infrequently"""
        return self.set(f"favorites:{user_id}", favorites, timedelta(days=5))
    
    def get_user_favorites_cached(self, user_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached user favorites"""
        return self.get(f"favorites:{user_id}")
    
    def invalidate_user_favorites_cache(self, user_id: str) -> bool:
        """Invalidate favorites cache when favorites are modified"""
        return self.delete(f"favorites:{user_id}")
    
    def cache_ai_coaching_insights(self, user_id: str, insights_type: str, data: Dict[str, Any]) -> bool:
        """Cache AI coaching insights for 2 HOURS - AI content should be fresh"""
        return self.set(f"ai_coaching:{user_id}:{insights_type}", data, timedelta(hours=2))
    
    def get_ai_coaching_cached(self, user_id: str, insights_type: str) -> Optional[Dict[str, Any]]:
        """Get cached AI coaching insights"""
        return self.get(f"ai_coaching:{user_id}:{insights_type}")
    
    def cache_water_logs(self, user_id: str, date: str, water_data: Dict[str, Any]) -> bool:
        """Cache water logs with smart TTL similar to food logs"""
        smart_expiry = self.get_smart_food_logs_ttl(date)  # Reuse smart logic
        return self.set(f"water_logs:{user_id}:{date}", water_data, smart_expiry)
    
    def get_water_logs_cached(self, user_id: str, date: str) -> Optional[Dict[str, Any]]:
        """Get cached water logs"""
        return self.get(f"water_logs:{user_id}:{date}")
    
    def cache_food_recommendations(self, user_id: str, context: str, recommendations: List[Dict[str, Any]]) -> bool:
        """Cache food recommendations for 2 DAYS - algorithm results can be reused"""
        return self.set(f"food_recommendations:{user_id}:{context}", recommendations, timedelta(days=2))
    
    def get_food_recommendations_cached(self, user_id: str, context: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached food recommendations"""
        return self.get(f"food_recommendations:{user_id}:{context}")
    
    def invalidate_ai_coaching_cache(self, user_id: str, insights_type: str = None) -> bool:
        """Invalidate AI coaching cache - optionally specific type"""
        if insights_type:
            return self.delete(f"ai_coaching:{user_id}:{insights_type}")
        else:
            # Invalidate all AI coaching for user
            patterns = [f"ai_coaching:{user_id}:*"]
            total_deleted = 0
            for pattern in patterns:
                total_deleted += self.flush_pattern(pattern)
            return total_deleted > 0

# Global Redis client instance
redis_client = RedisClient()
