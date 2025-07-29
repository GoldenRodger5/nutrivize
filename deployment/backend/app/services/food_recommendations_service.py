"""
Food Recommendations Service - Handles recent foods and AI-generated popular foods with smart caching
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from ..core.config import get_database
from ..core.redis_client import redis_client
from ..services.unified_ai_service import unified_ai_service

logger = logging.getLogger(__name__)

class FoodRecommendationsService:
    """Service for generating food recommendations with smart caching"""
    
    def __init__(self):
        self.db = get_database()
        if self.db is None:
            print("⚠️  FoodRecommendationsService initialized without database connection")
    
    async def get_recent_foods(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's recently logged foods with 2-day caching"""
        try:
            # Check cache first
            cache_context = f"recent_foods_{limit}"
            if redis_client.is_connected():
                cached_data = redis_client.get_food_recommendations_cached(user_id, cache_context)
                if cached_data:
                    return cached_data
            
            # Get food logs from the last 30 days
            start_date = datetime.now() - timedelta(days=30)
            
            pipeline = [
                {
                    "$match": {
                        "user_id": user_id,
                        "logged_at": {"$gte": start_date}
                    }
                },
                {
                    "$group": {
                        "_id": "$food_name",
                        "food_name": {"$first": "$food_name"},
                        "food_id": {"$first": "$food_id"},
                        "last_logged": {"$max": "$logged_at"},
                        "frequency": {"$sum": 1},
                        "avg_amount": {"$avg": "$amount"},
                        "unit": {"$first": "$unit"},
                        "avg_nutrition": {
                            "$mergeObjects": [
                                {"calories": {"$avg": "$nutrition.calories"}},
                                {"protein": {"$avg": "$nutrition.protein"}},
                                {"carbs": {"$avg": "$nutrition.carbs"}},
                                {"fat": {"$avg": "$nutrition.fat"}}
                            ]
                        }
                    }
                },
                {
                    "$sort": {"last_logged": -1}
                },
                {
                    "$limit": limit
                }
            ]
            
            recent_foods = list(self.db.food_logs.aggregate(pipeline))
            
            result = [
                {
                    "food_name": food["food_name"],
                    "food_id": food.get("food_id"),
                    "frequency": food["frequency"],
                    "last_logged": food["last_logged"],
                    "avg_amount": round(food["avg_amount"], 1),
                    "unit": food["unit"],
                    "nutrition": {
                        "calories": round(food["avg_nutrition"]["calories"]),
                        "protein": round(food["avg_nutrition"]["protein"], 1),
                        "carbs": round(food["avg_nutrition"]["carbs"], 1),
                        "fat": round(food["avg_nutrition"]["fat"], 1)
                    }
                }
                for food in recent_foods
            ]
            
            # Cache the result for 2 days
            if redis_client.is_connected():
                redis_client.cache_food_recommendations(user_id, cache_context, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting recent foods: {e}")
            return []
    
    async def get_popular_foods_ai(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get AI-generated popular foods based on user preferences and nutrition goals with 2-day caching"""
        try:
            # Check cache first
            cache_context = f"popular_foods_ai_{limit}"
            if redis_client.is_connected():
                cached_data = redis_client.get_food_recommendations_cached(user_id, cache_context)
                if cached_data:
                    return cached_data
            
            # Get user context
            user_context = await unified_ai_service._get_user_context(user_id)
            
            # Generate AI prompt for popular foods
            prompt = f"""
            Based on the user's nutrition profile and eating habits, recommend {limit} popular and nutritious foods that would benefit them.
            
            User Context:
            - Recent foods: {user_context.get('recent_food_logs', [])}
            - Nutrition goals: High protein, balanced macros
            - Health focus: General wellness
            
            Please return a JSON array of recommended foods with this structure:
            [
                {{
                    "food_name": "Greek Yogurt with Berries",
                    "reason": "High protein, probiotics, antioxidants",
                    "meal_type": "breakfast",
                    "nutrition": {{
                        "calories": 150,
                        "protein": 15,
                        "carbs": 20,
                        "fat": 5
                    }},
                    "benefits": ["High protein", "Probiotics", "Low sugar"],
                    "popularity_score": 95
                }}
            ]
            
            Focus on:
            1. Nutrient-dense foods
            2. Foods that complement their recent eating patterns
            3. Popular healthy choices
            4. Variety across different meal types
            5. Foods that support their health goals
            """
            
            try:
                ai_response = await unified_ai_service._call_openai_structured(
                    prompt, 
                    "Generate popular food recommendations"
                )
                
                # Parse AI response
                import json
                if isinstance(ai_response, str):
                    recommendations = json.loads(ai_response)
                else:
                    recommendations = ai_response
                
                result = recommendations[:limit]
                
                # Cache AI recommendations for 2 days
                if redis_client.is_connected():
                    redis_client.cache_food_recommendations(user_id, cache_context, result)
                
                return result
                
            except Exception as ai_error:
                logger.warning(f"AI recommendation failed, using fallback: {ai_error}")
                fallback_result = self._get_fallback_popular_foods(limit)
                
                # Cache fallback result for shorter time (4 hours)
                if redis_client.is_connected():
                    from datetime import timedelta
                    redis_client.set(f"food_recommendations:{user_id}:{cache_context}", fallback_result, timedelta(hours=4))
                
                return fallback_result
                
        except Exception as e:
            logger.error(f"Error getting AI popular foods: {e}")
            return self._get_fallback_popular_foods(limit)
    
    def _get_fallback_popular_foods(self, limit: int) -> List[Dict[str, Any]]:
        """Fallback popular foods when AI is unavailable"""
        fallback_foods = [
            {
                "food_name": "Greek Yogurt with Berries",
                "reason": "High protein, probiotics, antioxidants",
                "meal_type": "breakfast",
                "nutrition": {"calories": 150, "protein": 15, "carbs": 20, "fat": 5},
                "benefits": ["High protein", "Probiotics", "Antioxidants"],
                "popularity_score": 95
            },
            {
                "food_name": "Grilled Chicken Breast",
                "reason": "Lean protein, versatile, muscle building",
                "meal_type": "lunch",
                "nutrition": {"calories": 165, "protein": 31, "carbs": 0, "fat": 3.6},
                "benefits": ["Lean protein", "Muscle building", "Low fat"],
                "popularity_score": 92
            },
            {
                "food_name": "Quinoa Salad",
                "reason": "Complete protein, fiber, gluten-free",
                "meal_type": "lunch",
                "nutrition": {"calories": 222, "protein": 8, "carbs": 39, "fat": 4},
                "benefits": ["Complete protein", "High fiber", "Gluten-free"],
                "popularity_score": 88
            },
            {
                "food_name": "Salmon Fillet",
                "reason": "Omega-3 fatty acids, high protein",
                "meal_type": "dinner",
                "nutrition": {"calories": 208, "protein": 22, "carbs": 0, "fat": 12},
                "benefits": ["Omega-3", "Heart healthy", "High protein"],
                "popularity_score": 90
            },
            {
                "food_name": "Avocado Toast",
                "reason": "Healthy fats, fiber, trendy",
                "meal_type": "breakfast",
                "nutrition": {"calories": 300, "protein": 10, "carbs": 30, "fat": 18},
                "benefits": ["Healthy fats", "Fiber", "Satisfying"],
                "popularity_score": 85
            },
            {
                "food_name": "Mixed Berry Smoothie",
                "reason": "Antioxidants, vitamins, refreshing",
                "meal_type": "snack",
                "nutrition": {"calories": 180, "protein": 8, "carbs": 35, "fat": 2},
                "benefits": ["Antioxidants", "Vitamin C", "Natural sugars"],
                "popularity_score": 87
            },
            {
                "food_name": "Sweet Potato",
                "reason": "Complex carbs, beta-carotene, fiber",
                "meal_type": "dinner",
                "nutrition": {"calories": 112, "protein": 2, "carbs": 26, "fat": 0.1},
                "benefits": ["Complex carbs", "Vitamin A", "Fiber"],
                "popularity_score": 83
            },
            {
                "food_name": "Almonds",
                "reason": "Healthy fats, protein, portable snack",
                "meal_type": "snack",
                "nutrition": {"calories": 161, "protein": 6, "carbs": 6, "fat": 14},
                "benefits": ["Healthy fats", "Protein", "Vitamin E"],
                "popularity_score": 89
            },
            {
                "food_name": "Spinach Salad",
                "reason": "Iron, folate, low calorie",
                "meal_type": "lunch",
                "nutrition": {"calories": 23, "protein": 3, "carbs": 4, "fat": 0.4},
                "benefits": ["Iron", "Folate", "Low calorie"],
                "popularity_score": 81
            },
            {
                "food_name": "Eggs",
                "reason": "Complete protein, choline, versatile",
                "meal_type": "breakfast",
                "nutrition": {"calories": 155, "protein": 13, "carbs": 1, "fat": 11},
                "benefits": ["Complete protein", "Choline", "Versatile"],
                "popularity_score": 94
            }
        ]
        
        return fallback_foods[:limit]
    
    async def get_food_suggestions_combined(self, user_id: str) -> Dict[str, List[Dict[str, Any]]]:
        """Get combined recent and popular food suggestions"""
        try:
            recent_foods = await self.get_recent_foods(user_id, 5)
            popular_foods = await self.get_popular_foods_ai(user_id, 8)
            
            return {
                "recent_foods": recent_foods,
                "popular_foods": popular_foods,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Error getting combined food suggestions: {e}")
            return {
                "recent_foods": [],
                "popular_foods": self._get_fallback_popular_foods(8),
                "success": False,
                "error": str(e)
            }

# Create singleton instance
food_recommendations_service = FoodRecommendationsService()
