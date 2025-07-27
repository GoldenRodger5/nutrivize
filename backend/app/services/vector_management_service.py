"""
Vector Management Service for Nutrivize V2
Automatically manages vectorization of user data as it's created, updated, or deleted
Integrates with existing services to ensure real-time vector updates
"""

import logging
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta, date
from .pinecone_service import pinecone_service
from ..core.config import get_database
from ..core.redis_client import redis_client

logger = logging.getLogger(__name__)

class VectorManagementService:
    """
    Manages automatic vectorization of Nutrivize data
    Handles real-time updates as data is created, modified, or deleted
    """
    
    def __init__(self):
        self.db = get_database()
        self.batch_size = 50  # Process vectors in batches
        self.vectorization_enabled = True
        
        logger.info("✅ VectorManagementService initialized")
    
    async def on_food_log_created(self, user_id: str, food_log: Dict[str, Any]) -> bool:
        """
        Handle vectorization when a new food log is created
        This should be called from food_log_service.log_food()
        """
        try:
            if not self.vectorization_enabled:
                logger.debug("Vectorization disabled, skipping food log")
                return False
            
            # Vectorize the new food log
            success = await pinecone_service.vectorize_food_log(user_id, food_log)
            
            if success:
                # Update vector cache timestamp
                await self._update_vector_cache_timestamp(user_id, "food_logs")
                logger.info(f"✅ Vectorized new food log for user {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Failed to handle food log creation vectorization: {e}")
            return False
    
    async def on_meal_plan_created(self, user_id: str, meal_plan: Dict[str, Any]) -> bool:
        """
        Handle vectorization when a new meal plan is created
        This should be called from meal_planning_service.save_meal_plan()
        """
        try:
            if not self.vectorization_enabled:
                logger.debug("Vectorization disabled, skipping meal plan")
                return False
            
            # Vectorize the new meal plan
            success = await pinecone_service.vectorize_meal_plan(user_id, meal_plan)
            
            if success:
                # Update vector cache timestamp
                await self._update_vector_cache_timestamp(user_id, "meal_plans")
                logger.info(f"✅ Vectorized new meal plan for user {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Failed to handle meal plan creation vectorization: {e}")
            return False
    
    async def on_favorites_updated(self, user_id: str, favorites: List[Dict[str, Any]]) -> bool:
        """
        Handle vectorization when user favorites are updated
        This should be called from user_favorites_service
        """
        try:
            if not self.vectorization_enabled:
                logger.debug("Vectorization disabled, skipping favorites")
                return False
            
            # Clear existing favorite vectors first
            await pinecone_service.invalidate_user_vectors(user_id, "favorite_food")
            
            # Vectorize updated favorites
            success = await pinecone_service.vectorize_user_favorites(user_id, favorites)
            
            if success:
                # Update vector cache timestamp
                await self._update_vector_cache_timestamp(user_id, "favorites")
                logger.info(f"✅ Vectorized updated favorites for user {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Failed to handle favorites update vectorization: {e}")
            return False
    
    async def on_chat_session_completed(self, user_id: str, chat_session: Dict[str, Any]) -> bool:
        """
        Handle vectorization when an AI chat session is completed
        This should be called from unified_ai_service after meaningful conversations
        """
        try:
            if not self.vectorization_enabled:
                logger.debug("Vectorization disabled, skipping chat")
                return False
            
            # Only vectorize if the session has substantial content
            messages = chat_session.get('messages', [])
            ai_messages = [msg for msg in messages if msg.get('role') == 'assistant']
            
            if len(ai_messages) < 1:
                logger.debug("Chat session too short, skipping vectorization")
                return False
            
            # Vectorize the chat session
            success = await pinecone_service.vectorize_ai_chat_history(user_id, chat_session)
            
            if success:
                # Update vector cache timestamp
                await self._update_vector_cache_timestamp(user_id, "chat_history")
                logger.info(f"✅ Vectorized chat session for user {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Failed to handle chat session vectorization: {e}")
            return False
    
    async def generate_weekly_summary_and_vectorize(self, user_id: str, start_date: date, end_date: date) -> bool:
        """
        Generate and vectorize a weekly nutrition summary
        This can be called periodically or on-demand
        """
        try:
            if not self.vectorization_enabled:
                logger.debug("Vectorization disabled, skipping summary")
                return False
            
            # Get food logs for the period
            food_logs = await self._get_food_logs_for_period(user_id, start_date, end_date)
            
            if not food_logs:
                logger.debug(f"No food logs found for user {user_id} in period {start_date} to {end_date}")
                return False
            
            # Calculate summary statistics
            summary_data = await self._calculate_nutrition_summary(food_logs, start_date, end_date)
            
            # Vectorize the summary
            success = await pinecone_service.vectorize_nutrition_summary(user_id, summary_data)
            
            if success:
                # Update vector cache timestamp
                await self._update_vector_cache_timestamp(user_id, "summaries")
                logger.info(f"✅ Generated and vectorized weekly summary for user {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Failed to generate weekly summary: {e}")
            return False
    
    async def bulk_vectorize_user_data(self, user_id: str, data_types: Optional[List[str]] = None) -> Dict[str, bool]:
        """
        Bulk vectorize all existing data for a user
        Useful for onboarding existing users or rebuilding vectors
        """
        results = {}
        
        try:
            # Default to all data types if none specified
            if not data_types:
                data_types = ["food_logs", "meal_plans", "favorites", "summaries"]
            
            logger.info(f"Starting bulk vectorization for user {user_id}, types: {data_types}")
            
            # Vectorize food logs
            if "food_logs" in data_types:
                results["food_logs"] = await self._bulk_vectorize_food_logs(user_id)
            
            # Vectorize meal plans
            if "meal_plans" in data_types:
                results["meal_plans"] = await self._bulk_vectorize_meal_plans(user_id)
            
            # Vectorize favorites
            if "favorites" in data_types:
                results["favorites"] = await self._bulk_vectorize_favorites(user_id)
            
            # Generate and vectorize recent summaries
            if "summaries" in data_types:
                results["summaries"] = await self._bulk_vectorize_summaries(user_id)
            
            logger.info(f"✅ Bulk vectorization completed for user {user_id}: {results}")
            return results
            
        except Exception as e:
            logger.error(f"❌ Failed bulk vectorization for user {user_id}: {e}")
            return {"error": str(e)}
    
    async def _bulk_vectorize_food_logs(self, user_id: str, days_back: int = 30) -> bool:
        """Bulk vectorize recent food logs"""
        try:
            # Get recent food logs
            start_date = datetime.now().date() - timedelta(days=days_back)
            food_logs = await self._get_food_logs_for_period(user_id, start_date, datetime.now().date())
            
            success_count = 0
            for food_log in food_logs:
                if await pinecone_service.vectorize_food_log(user_id, food_log):
                    success_count += 1
                
                # Add small delay to avoid rate limits
                await asyncio.sleep(0.1)
            
            logger.info(f"✅ Bulk vectorized {success_count}/{len(food_logs)} food logs for user {user_id}")
            return success_count > 0
            
        except Exception as e:
            logger.error(f"❌ Failed to bulk vectorize food logs: {e}")
            return False
    
    async def _bulk_vectorize_meal_plans(self, user_id: str) -> bool:
        """Bulk vectorize user's meal plans"""
        try:
            if self.db is None:
                return False
                
            # Get user's meal plans
            meal_plans = list(self.db.meal_plans.find({"user_id": user_id}).limit(10))
            
            success_count = 0
            for meal_plan in meal_plans:
                if await pinecone_service.vectorize_meal_plan(user_id, meal_plan):
                    success_count += 1
                
                # Add small delay to avoid rate limits
                await asyncio.sleep(0.1)
            
            logger.info(f"✅ Bulk vectorized {success_count}/{len(meal_plans)} meal plans for user {user_id}")
            return success_count > 0
            
        except Exception as e:
            logger.error(f"❌ Failed to bulk vectorize meal plans: {e}")
            return False
    
    async def _bulk_vectorize_favorites(self, user_id: str) -> bool:
        """Bulk vectorize user's favorites"""
        try:
            if self.db is None:
                return False
                
            # Get user's favorites
            favorites = list(self.db.user_favorites.find({"user_id": user_id}))
            
            if favorites:
                success = await pinecone_service.vectorize_user_favorites(user_id, favorites)
                logger.info(f"✅ Bulk vectorized {len(favorites)} favorites for user {user_id}")
                return success
            
            return True  # No favorites is still "successful"
            
        except Exception as e:
            logger.error(f"❌ Failed to bulk vectorize favorites: {e}")
            return False
    
    async def _bulk_vectorize_summaries(self, user_id: str) -> bool:
        """Generate and vectorize recent weekly summaries"""
        try:
            # Generate summaries for last 4 weeks
            success_count = 0
            for weeks_back in range(4):
                end_date = datetime.now().date() - timedelta(weeks=weeks_back)
                start_date = end_date - timedelta(days=7)
                
                if await self.generate_weekly_summary_and_vectorize(user_id, start_date, end_date):
                    success_count += 1
                
                # Add delay between summary generations
                await asyncio.sleep(0.2)
            
            logger.info(f"✅ Generated {success_count}/4 weekly summaries for user {user_id}")
            return success_count > 0
            
        except Exception as e:
            logger.error(f"❌ Failed to bulk vectorize summaries: {e}")
            return False
    
    async def _get_food_logs_for_period(self, user_id: str, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get food logs for a specific period"""
        try:
            if self.db is None:
                return []
            
            # Query food logs
            food_logs = list(self.db.food_logs.find({
                "user_id": user_id,
                "date": {
                    "$gte": start_date,
                    "$lte": end_date
                }
            }).sort("date", -1))
            
            return food_logs
            
        except Exception as e:
            logger.error(f"❌ Failed to get food logs for period: {e}")
            return []
    
    async def _calculate_nutrition_summary(self, food_logs: List[Dict[str, Any]], start_date: date, end_date: date) -> Dict[str, Any]:
        """Calculate nutrition summary from food logs"""
        try:
            # Calculate totals
            total_days = (end_date - start_date).days + 1
            
            total_calories = sum(log.get('nutrition', {}).get('calories', 0) for log in food_logs)
            total_protein = sum(log.get('nutrition', {}).get('protein', 0) for log in food_logs)
            total_carbs = sum(log.get('nutrition', {}).get('carbs', 0) for log in food_logs)
            total_fat = sum(log.get('nutrition', {}).get('fat', 0) for log in food_logs)
            total_fiber = sum(log.get('nutrition', {}).get('fiber', 0) for log in food_logs)
            total_sodium = sum(log.get('nutrition', {}).get('sodium', 0) for log in food_logs)
            
            # Calculate averages
            avg_calories = total_calories / total_days if total_days > 0 else 0
            avg_protein = total_protein / total_days if total_days > 0 else 0
            avg_carbs = total_carbs / total_days if total_days > 0 else 0
            avg_fat = total_fat / total_days if total_days > 0 else 0
            avg_fiber = total_fiber / total_days if total_days > 0 else 0
            avg_sodium = total_sodium / total_days if total_days > 0 else 0
            
            # Generate simple insights
            insights = []
            if avg_protein < 100:
                insights.append("Consider increasing protein intake")
            if avg_fiber < 20:
                insights.append("Could benefit from more fiber-rich foods")
            if avg_sodium > 2300:
                insights.append("Sodium intake is above recommended levels")
            
            # Calculate adherence score (simplified)
            adherence_score = min(100, (avg_protein / 120) * 50 + (min(avg_fiber, 25) / 25) * 50)
            
            return {
                "period": "week",
                "start_date": start_date,
                "end_date": end_date,
                "avg_calories": round(avg_calories, 1),
                "avg_protein": round(avg_protein, 1),
                "avg_carbs": round(avg_carbs, 1),
                "avg_fat": round(avg_fat, 1),
                "avg_fiber": round(avg_fiber, 1),
                "avg_sodium": round(avg_sodium, 1),
                "target_calories": 2000,  # Could be pulled from user goals
                "target_protein": 150,    # Could be pulled from user goals
                "adherence_score": round(adherence_score, 1),
                "insights": insights,
                "total_logs": len(food_logs)
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to calculate nutrition summary: {e}")
            return {}
    
    async def _update_vector_cache_timestamp(self, user_id: str, data_type: str) -> None:
        """Update cache timestamp for vector data"""
        try:
            if redis_client:
                cache_key = f"vector_cache:{user_id}:{data_type}"
                redis_client.set(cache_key, datetime.now().isoformat(), ex=86400)  # 24 hour expiry
            
        except Exception as e:
            logger.debug(f"Failed to update vector cache timestamp: {e}")
    
    async def should_rebuild_vectors(self, user_id: str, data_type: str) -> bool:
        """Check if vectors should be rebuilt based on cache timestamps"""
        try:
            if not redis_client:
                return True  # Rebuild if no cache available
            
            cache_key = f"vector_cache:{user_id}:{data_type}"
            cached_timestamp = redis_client.get(cache_key)
            
            if not cached_timestamp:
                return True  # Rebuild if no timestamp found
            
            # Check if cache is older than 24 hours
            cached_time = datetime.fromisoformat(cached_timestamp.decode())
            age_hours = (datetime.now() - cached_time).total_seconds() / 3600
            
            return age_hours > 24
            
        except Exception as e:
            logger.debug(f"Failed to check vector cache: {e}")
            return True  # Rebuild on error

# Global instance
vector_management_service = VectorManagementService()
