from typing import List, Dict, Any, Optional
from ..models.food import FoodItem
from ..services.ai_service import AIService
from ..services.food_service import food_service
import logging

logger = logging.getLogger(__name__)

class DietaryRecommendationService:
    """AI-powered dietary recommendation system"""
    
    def __init__(self):
        self.ai_service = AIService()
    
    async def get_personalized_food_recommendations(
        self, 
        user_id: str, 
        user_preferences: Dict[str, Any],
        meal_type: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get AI-powered personalized food recommendations"""
        try:
            # Get user's recent food logs to understand preferences
            # This would integrate with your food log service
            
            # Get foods that match user's dietary requirements
            compatible_foods = await self._get_compatible_foods(user_preferences)
            
            # Use AI to score and rank foods
            recommendations = await self._ai_score_foods(
                compatible_foods, 
                user_preferences, 
                meal_type
            )
            
            return recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Error getting food recommendations: {e}")
            return []
    
    async def _get_compatible_foods(self, user_preferences: Dict[str, Any]) -> List[FoodItem]:
        """Get foods that are compatible with user's dietary preferences"""
        # This would use your existing filtering logic but at the service level
        # For now, we'll get all foods and filter
        all_foods = await food_service.search_food_items(
            search_params={"query": "", "limit": 1000},
            user_id=None
        )
        
        compatible_foods = []
        for food in all_foods:
            if self._is_food_compatible(food, user_preferences):
                compatible_foods.append(food)
        
        return compatible_foods
    
    def _is_food_compatible(self, food: FoodItem, user_preferences: Dict[str, Any]) -> bool:
        """Check if a food is compatible with user preferences"""
        food_restrictions = food.dietary_attributes.dietary_restrictions if food.dietary_attributes else []
        food_allergens = food.dietary_attributes.allergens if food.dietary_attributes else []
        
        # Check dietary restrictions
        user_restrictions = user_preferences.get('dietary_restrictions', [])
        for restriction in user_restrictions:
            if restriction not in food_restrictions:
                return False
        
        # Check allergens - food must NOT contain user's allergens
        user_allergens = user_preferences.get('allergens', [])
        for allergen in user_allergens:
            if allergen in food_allergens:
                return False
        
        return True
    
    async def _ai_score_foods(
        self, 
        foods: List[FoodItem], 
        user_preferences: Dict[str, Any],
        meal_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Use AI to score and rank foods based on user preferences"""
        try:
            # Prepare data for AI analysis
            food_data = []
            for food in foods:
                food_data.append({
                    'name': food.name,
                    'nutrition': food.nutrition.dict(),
                    'dietary_attributes': food.dietary_attributes.dict() if food.dietary_attributes else {},
                    'food_categories': food.dietary_attributes.food_categories if food.dietary_attributes else []
                })
            
            # Create AI prompt for food scoring
            prompt = self._create_scoring_prompt(food_data, user_preferences, meal_type)
            
            # Get AI recommendations
            ai_response = await self.ai_service.generate_food_recommendations(prompt)
            
            return ai_response.get('recommendations', [])
            
        except Exception as e:
            logger.error(f"Error in AI food scoring: {e}")
            # Fallback to simple scoring
            return self._simple_score_foods(foods, user_preferences)
    
    def _create_scoring_prompt(
        self, 
        food_data: List[Dict], 
        user_preferences: Dict[str, Any], 
        meal_type: Optional[str]
    ) -> str:
        """Create AI prompt for food recommendation scoring"""
        return f"""
        As a nutrition expert, analyze these foods and recommend the best options for a user with these preferences:
        
        User Preferences:
        - Dietary Restrictions: {user_preferences.get('dietary_restrictions', [])}
        - Allergens to Avoid: {user_preferences.get('allergens', [])}
        - Meal Type: {meal_type or 'any'}
        
        Foods to analyze: {food_data[:10]}  # Limit for prompt size
        
        Please return a JSON response with:
        {{
            "recommendations": [
                {{
                    "name": "food_name",
                    "score": 0-100,
                    "reasons": ["reason1", "reason2"],
                    "nutrition_highlights": ["highlight1", "highlight2"],
                    "meal_suitability": "perfect|good|okay"
                }}
            ]
        }}
        
        Score based on:
        1. Dietary compatibility (40%)
        2. Nutritional value (30%)
        3. Meal type appropriateness (20%)
        4. Food variety/balance (10%)
        """
    
    def _simple_score_foods(self, foods: List[FoodItem], user_preferences: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Simple scoring fallback when AI is unavailable"""
        recommendations = []
        
        for food in foods:
            score = 50  # Base score
            reasons = []
            
            # Boost score for dietary alignment
            if food.dietary_attributes and food.dietary_attributes.dietary_restrictions:
                matching_restrictions = set(food.dietary_attributes.dietary_restrictions) & set(user_preferences.get('dietary_restrictions', []))
                score += len(matching_restrictions) * 10
                if matching_restrictions:
                    reasons.append(f"Matches your {', '.join(matching_restrictions)} preferences")
            
            # Boost for high protein
            if food.nutrition.protein > 15:
                score += 10
                reasons.append("High protein content")
            
            # Boost for fiber
            if food.nutrition.fiber and food.nutrition.fiber > 5:
                score += 5
                reasons.append("Good fiber source")
            
            recommendations.append({
                'name': food.name,
                'score': min(100, score),
                'reasons': reasons,
                'nutrition_highlights': [f"{food.nutrition.protein}g protein", f"{food.nutrition.calories} calories"],
                'meal_suitability': 'good'
            })
        
        # Sort by score
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations

# Create service instance
dietary_recommendation_service = DietaryRecommendationService()
