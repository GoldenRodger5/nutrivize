"""
Background task service for daily analytics refresh
"""

import asyncio
import schedule
import time
from datetime import datetime, timedelta
from typing import Dict, Any
from ..core.config import get_database
from ..services.analytics_service import analytics_service


class AnalyticsRefreshService:
    """Service to handle automated daily refresh of AI insights"""
    
    def __init__(self):
        self.db = get_database()
        self.insights_cache_collection = None
        self.is_running = False
        
        if self.db is not None:
            self.insights_cache_collection = self.db["insights_cache"]
        else:
            print("⚠️  AnalyticsRefreshService initialized without database connection")
    
    async def _cache_insights(self, user_id: str, timeframe: str, insights_data: Dict[str, Any]):
        """Cache insights data for a user"""
        try:
            if self.insights_cache_collection is None:
                return
            
            cache_entry = {
                "user_id": user_id,
                "timeframe": timeframe,
                "insights": insights_data,
                "cached_at": datetime.now(),
                "expires_at": datetime.now() + timedelta(hours=24)
            }
            
            await self.insights_cache_collection.replace_one(
                {"user_id": user_id, "timeframe": timeframe},
                cache_entry,
                upsert=True
            )
            
            print(f"💾 Cached insights for user {user_id} ({timeframe})")
            
        except Exception as e:
            print(f"❌ Error caching insights: {e}")

    async def refresh_user_insights(self, user_id: str, timeframe: str = "week") -> Dict[str, Any]:
        """Refresh insights for a specific user"""
        try:
            print(f"🔄 Refreshing insights for user {user_id} ({timeframe})")
            
            # Generate fresh insights
            insights_data = await analytics_service.generate_ai_insights(
                user_id=user_id,
                timeframe=timeframe,
                force_refresh=True
            )
            
            # Cache the insights with timestamp
            cache_entry = {
                "user_id": user_id,
                "timeframe": timeframe,
                "insights": insights_data,
                "cached_at": datetime.now(),
                "expires_at": datetime.now() + timedelta(hours=24)  # Cache for 24 hours
            }
            
            if self.insights_cache_collection:
                # Update or insert cache entry
                await self.insights_cache_collection.replace_one(
                    {"user_id": user_id, "timeframe": timeframe},
                    cache_entry,
                    upsert=True
                )
            
            print(f"✅ Successfully refreshed insights for user {user_id}")
            return insights_data
            
        except Exception as e:
            print(f"❌ Error refreshing insights for user {user_id}: {e}")
            return {}
    
    async def get_cached_insights(self, user_id: str, timeframe: str = "week") -> Dict[str, Any]:
        """Get cached insights for a user"""
        try:
            if self.insights_cache_collection is None:
                return {}
            
            cache_entry = await self.insights_cache_collection.find_one({
                "user_id": user_id,
                "timeframe": timeframe,
                "expires_at": {"$gt": datetime.now()}
            })
            
            if cache_entry:
                insights_data = cache_entry.get("insights", {})
                insights_data["is_cached"] = True
                insights_data["cached_at"] = cache_entry.get("cached_at")
                return insights_data
            
            return {}
            
        except Exception as e:
            print(f"❌ Error getting cached insights for user {user_id}: {e}")
            return {}
    
    async def refresh_all_active_users(self) -> int:
        """Refresh insights for all active users (users who logged food in the last 7 days)"""
        try:
            if self.db is None:
                return 0
            
            # Get active users (those who logged food in the last 7 days)
            food_logs_collection = self.db["food_logs"]
            seven_days_ago = datetime.now() - timedelta(days=7)
            
            active_user_ids = await food_logs_collection.distinct(
                "user_id",
                {"logged_at": {"$gte": seven_days_ago}}
            )
            
            print(f"🔄 Found {len(active_user_ids)} active users to refresh")
            
            refreshed_count = 0
            for user_id in active_user_ids:
                try:
                    await self.refresh_user_insights(user_id, "week")
                    await self.refresh_user_insights(user_id, "month")
                    refreshed_count += 1
                    
                    # Add a small delay to avoid overwhelming the AI service
                    await asyncio.sleep(2)
                    
                except Exception as e:
                    print(f"❌ Failed to refresh insights for user {user_id}: {e}")
                    continue
            
            print(f"✅ Successfully refreshed insights for {refreshed_count} users")
            return refreshed_count
            
        except Exception as e:
            print(f"❌ Error refreshing insights for active users: {e}")
            return 0
    
    def schedule_daily_refresh(self):
        """Schedule daily refresh at 6 AM"""
        schedule.every().day.at("06:00").do(self._run_daily_refresh)
        print("⏰ Scheduled daily insights refresh at 6:00 AM")
    
    def _run_daily_refresh(self):
        """Wrapper to run async daily refresh"""
        asyncio.create_task(self.daily_refresh_task())
    
    async def daily_refresh_task(self):
        """Daily refresh task"""
        print(f"🌅 Starting daily analytics refresh at {datetime.now()}")
        
        try:
            refreshed_count = await self.refresh_all_active_users()
            print(f"✅ Daily refresh completed. Refreshed insights for {refreshed_count} users.")
            
        except Exception as e:
            print(f"❌ Daily refresh failed: {e}")
    
    async def start_background_service(self):
        """Start the background service for scheduled refreshes"""
        if self.is_running:
            print("⚠️  Background service is already running")
            return
        
        self.is_running = True
        self.schedule_daily_refresh()
        
        print("🚀 Started analytics refresh background service")
        
        # Run the scheduler
        while self.is_running:
            schedule.run_pending()
            await asyncio.sleep(60)  # Check every minute
    
    def stop_background_service(self):
        """Stop the background service"""
        self.is_running = False
        schedule.clear()
        print("🛑 Stopped analytics refresh background service")
    
    async def cleanup_expired_cache(self):
        """Remove expired cache entries"""
        try:
            if self.insights_cache_collection is None:
                return 0
            
            result = await self.insights_cache_collection.delete_many({
                "expires_at": {"$lt": datetime.now()}
            })
            
            deleted_count = result.deleted_count
            print(f"🧹 Cleaned up {deleted_count} expired cache entries")
            return deleted_count
            
        except Exception as e:
            print(f"❌ Error cleaning up expired cache: {e}")
            return 0


# Global instance
analytics_refresh_service = AnalyticsRefreshService()
