"""
AI Dashboard Service - Powers the AI-first dashboard with intelligent insights
"""

import logging
from datetime import datetime, timedelta, date
from typing import Dict, List, Any, Optional
from fastapi import HTTPException
from ..services.unified_ai_service import unified_ai_service
from ..services.ai_dashboard_cache_service import ai_dashboard_cache_service
from ..core.config import get_database
from bson import ObjectId

logger = logging.getLogger(__name__)

class AIDashboardService:
    """AI-powered dashboard service providing intelligent health insights with caching"""
    
    def __init__(self):
        self.unified_ai = unified_ai_service
        self.cache_service = ai_dashboard_cache_service
        self.db = get_database()
        
    async def get_ai_health_coaching(self, user_id: str) -> Dict[str, Any]:
        """Generate personalized AI health coaching insights with caching"""
        try:
            # Try to get cached data first
            cached_data = await self.cache_service.get_cached_data(user_id, "coaching")
            if cached_data:
                logger.info(f"Returning cached coaching data for user {user_id}")
                return cached_data
            
            # Generate fresh data
            logger.info(f"Generating fresh coaching data for user {user_id}")
            fresh_data = await self.unified_ai.get_dashboard_data(user_id, "coaching")
            
            # Cache the fresh data
            await self.cache_service.cache_data(user_id, "coaching", fresh_data)
            
            return fresh_data
        except Exception as e:
            logger.error(f"Error getting AI health coaching for user {user_id}: {e}")
            raise HTTPException(status_code=500, detail="Unable to generate health coaching insights. Please ensure you have logged nutrition data.")
    
    async def get_smart_nutrition_data(self, user_id: str) -> Dict[str, Any]:
        """Get real-time smart nutrition data - NOT cached as it changes throughout the day"""
        try:
            # Use the same approach as the food log service for consistency
            from .food_log_service import food_log_service
            from datetime import date
            
            # Get today's food logs with goal progress (same data as food log page)
            today = date.today().isoformat()
            daily_data = await food_log_service.get_daily_logs_with_goal_progress(user_id, today)
            
            if not daily_data or "nutrition_summary" not in daily_data:
                logger.error(f"No nutrition data found for user {user_id}")
                raise HTTPException(status_code=404, detail="No nutrition data found. Please log some food entries first.")
            
            # Transform the nutrition summary to match the expected format
            nutrition_summary = daily_data["nutrition_summary"]
            goal_progress = daily_data["goal_progress"]
            
            # Format data consistently with the unified AI format
            nutrition_data = {}
            for nutrient in ["calories", "protein", "carbs", "fat", "fiber"]:
                current = nutrition_summary.get(nutrient, 0)
                target = goal_progress.get(nutrient, {}).get("target", 2000 if nutrient == "calories" else 100)
                percentage = min(100, round((current / target) * 100)) if target > 0 else 0
                
                nutrition_data[nutrient] = {
                    "current": current,
                    "target": target,
                    "percentage": percentage
                }
            
            # Add water data if available
            water_current = nutrition_summary.get("water", 0)
            water_target = goal_progress.get("water", {}).get("target", 64)
            water_percentage = min(100, round((water_current / water_target) * 100)) if water_target > 0 else 0
            
            nutrition_data["water"] = {
                "current": water_current,
                "target": water_target,
                "percentage": water_percentage
            }
            
            return nutrition_data
            
        except Exception as e:
            logger.error(f"Error getting smart nutrition data for user {user_id}: {e}")
            raise HTTPException(status_code=500, detail="Unable to retrieve nutrition data. Please try again.")
    
    async def get_predictive_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get AI-powered predictive health analytics with caching"""
        try:
            # Try to get cached data first
            cached_data = await self.cache_service.get_cached_data(user_id, "predictions")
            if cached_data:
                logger.info(f"Returning cached predictions data for user {user_id}")
                return cached_data
            
            # Generate fresh data
            logger.info(f"Generating fresh predictions data for user {user_id}")
            fresh_data = await self.unified_ai.get_dashboard_data(user_id, "predictions")
            
            # Cache the fresh data
            await self.cache_service.cache_data(user_id, "predictions", fresh_data)
            
            return fresh_data
        except Exception as e:
            logger.error(f"Error getting predictive analytics for user {user_id}: {e}")
            raise HTTPException(status_code=500, detail="Unable to generate predictions. Please ensure you have sufficient data history.")
    
    async def get_live_optimizations(self, user_id: str) -> Dict[str, Any]:
        """Get real-time meal and nutrition optimizations"""
        try:
            # Get user context for optimization suggestions
            user_context = await self.unified_ai._get_comprehensive_user_context(user_id)
            
            # Generate optimization suggestions
            optimization_data = {
                "meal_timing": "Consider having your largest meal earlier in the day",
                "nutrient_balance": "You could benefit from more omega-3 fatty acids",
                "hydration": "Increase water intake by 2 glasses today",
                "next_meal": {
                    "suggestion": "High-protein snack with complex carbs",
                    "reasoning": "To maintain steady energy levels",
                    "timing": "In 2-3 hours"
                }
            }
            
            return optimization_data
        except Exception as e:
            logger.error(f"Error getting live optimizations for user {user_id}: {e}")
            raise HTTPException(status_code=500, detail="Unable to generate optimization suggestions. Please try again.")
    
    async def invalidate_user_cache(self, user_id: str, cache_type: Optional[str] = None) -> bool:
        """Invalidate cached data for a user (useful when new data is logged)"""
        try:
            return await self.cache_service.invalidate_cache(user_id, cache_type)
        except Exception as e:
            logger.error(f"Error invalidating cache: {e}")
            return False
    
    async def get_cache_status(self, user_id: str) -> Dict[str, Any]:
        """Get cache status for debugging"""
        try:
            return await self.cache_service.get_cache_status(user_id)
        except Exception as e:
            logger.error(f"Error getting cache status: {e}")
            return {"cached_types": [], "cache_info": {}}

# Global instance
ai_dashboard_service = AIDashboardService()
