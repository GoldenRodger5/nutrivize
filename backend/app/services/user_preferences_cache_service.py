from typing import Dict, Any, Optional
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

class UserPreferencesCacheService:
    """
    Dedicated caching service for user preferences with write-through strategy
    Preferences are cached for very long periods since users rarely change them
    """
    
    def __init__(self, redis_client):
        self.redis_client = redis_client
        
    def cache_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> bool:
        """
        Cache user preferences with very long TTL since they rarely change
        Write-through strategy: Cache indefinitely, only invalidate on write
        """
        try:
            # Cache for 7 days - preferences are rarely changed, heavily accessed
            return self.redis_client.set(
                f"user_preferences:{user_id}", 
                preferences, 
                timedelta(days=7)
            )
        except Exception as e:
            logger.error(f"Failed to cache user preferences for {user_id}: {e}")
            return False
    
    def get_cached_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached user preferences"""
        try:
            return self.redis_client.get(f"user_preferences:{user_id}")
        except Exception as e:
            logger.error(f"Failed to get cached preferences for {user_id}: {e}")
            return None
    
    def cache_dietary_preferences(self, user_id: str, dietary_prefs: Dict[str, Any]) -> bool:
        """Cache just dietary preferences subset"""
        try:
            return self.redis_client.set(
                f"dietary_preferences:{user_id}", 
                dietary_prefs, 
                timedelta(days=7)
            )
        except Exception as e:
            logger.error(f"Failed to cache dietary preferences for {user_id}: {e}")
            return False
    
    def get_cached_dietary_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached dietary preferences only"""
        try:
            return self.redis_client.get(f"dietary_preferences:{user_id}")
        except Exception as e:
            logger.error(f"Failed to get cached dietary preferences for {user_id}: {e}")
            return None
    
    def cache_app_preferences(self, user_id: str, app_prefs: Dict[str, Any]) -> bool:
        """Cache app preferences (theme, units, etc.)"""
        try:
            return self.redis_client.set(
                f"app_preferences:{user_id}", 
                app_prefs, 
                timedelta(days=7)
            )
        except Exception as e:
            logger.error(f"Failed to cache app preferences for {user_id}: {e}")
            return False
    
    def get_cached_app_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached app preferences only"""
        try:
            return self.redis_client.get(f"app_preferences:{user_id}")
        except Exception as e:
            logger.error(f"Failed to get cached app preferences for {user_id}: {e}")
            return None
    
    def invalidate_user_preferences_cache(self, user_id: str) -> int:
        """
        Invalidate all preference cache for a user when they update settings
        Write-through strategy: Clear cache on write, force fresh read
        """
        try:
            patterns = [
                f"user_preferences:{user_id}",
                f"dietary_preferences:{user_id}",
                f"app_preferences:{user_id}",
                f"nutrition_preferences:{user_id}"
            ]
            
            total_deleted = 0
            for pattern in patterns:
                if self.redis_client.delete(pattern):
                    total_deleted += 1
            
            logger.info(f"Invalidated {total_deleted} preference cache entries for user {user_id}")
            return total_deleted
            
        except Exception as e:
            logger.error(f"Failed to invalidate preference cache for {user_id}: {e}")
            return 0
    
    def warm_preferences_cache(self, user_id: str, preferences: Dict[str, Any]) -> bool:
        """
        Warm the cache with fresh data after preference updates
        Called after successful database write
        """
        try:
            success_count = 0
            
            # Cache full preferences
            if self.cache_user_preferences(user_id, preferences):
                success_count += 1
            
            # Cache individual sections if they exist
            if "dietary" in preferences:
                if self.cache_dietary_preferences(user_id, preferences["dietary"]):
                    success_count += 1
            
            if "app" in preferences:
                if self.cache_app_preferences(user_id, preferences["app"]):
                    success_count += 1
            
            logger.info(f"Warmed {success_count} preference cache entries for user {user_id}")
            return success_count > 0
            
        except Exception as e:
            logger.error(f"Failed to warm preference cache for {user_id}: {e}")
            return False

# Create singleton instance
from ..core.redis_client import redis_client
user_preferences_cache = UserPreferencesCacheService(redis_client)
