from typing import List, Dict, Any, Optional, Tuple
from ..models.food import FoodItem
from ..services.ai_service import AIService
import logging

logger = logging.getLogger(__name__)

class DietaryConflictDetector:
    """Advanced dietary conflict detection and resolution suggestions"""
    
    def __init__(self):
        self.ai_service = AIService()
        
        # Define conflict rules
        self.CONFLICT_RULES = {
            'vegan': {
                'incompatible_restrictions': ['vegetarian'],  # vegan is stricter
                'required_categories': ['plant-based'],
                'forbidden_categories': ['meat', 'dairy', 'eggs'],
                'forbidden_allergens': []
            },
            'vegetarian': {
                'incompatible_restrictions': [],
                'required_categories': [],
                'forbidden_categories': ['meat', 'poultry', 'fish'],
                'forbidden_allergens': []
            },
            'keto': {
                'incompatible_restrictions': ['high-carb'],
                'max_carbs_per_serving': 5,
                'min_fat_percentage': 70
            },
            'gluten-free': {
                'forbidden_allergens': ['gluten', 'wheat'],
                'forbidden_categories': ['wheat', 'barley', 'rye']
            }
        }
    
    async def detect_conflicts(
        self, 
        foods: List[FoodItem], 
        user_preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Detect dietary conflicts in a list of foods"""
        try:
            conflicts = []
            warnings = []
            suggestions = []
            
            user_restrictions = user_preferences.get('dietary_restrictions', [])
            user_allergens = user_preferences.get('allergens', [])
            
            for food in foods:
                food_conflicts = self._check_food_conflicts(food, user_restrictions, user_allergens)
                if food_conflicts:
                    conflicts.extend(food_conflicts)
            
            # Get AI-powered suggestions for resolving conflicts
            if conflicts:
                ai_suggestions = await self._get_ai_conflict_resolution(conflicts, user_preferences)
                suggestions.extend(ai_suggestions)
            
            return {
                'has_conflicts': len(conflicts) > 0,
                'conflicts': conflicts,
                'warnings': warnings,
                'suggestions': suggestions,
                'safety_score': self._calculate_safety_score(conflicts, len(foods))
            }
            
        except Exception as e:
            logger.error(f"Error detecting conflicts: {e}")
            return {'has_conflicts': False, 'conflicts': [], 'warnings': [], 'suggestions': []}
    
    def _check_food_conflicts(
        self, 
        food: FoodItem, 
        user_restrictions: List[str], 
        user_allergens: List[str]
    ) -> List[Dict[str, Any]]:
        """Check a single food for conflicts"""
        conflicts = []
        
        food_restrictions = food.dietary_attributes.dietary_restrictions if food.dietary_attributes else []
        food_allergens = food.dietary_attributes.allergens if food.dietary_attributes else []
        food_categories = food.dietary_attributes.food_categories if food.dietary_attributes else []
        
        # Check allergen conflicts (CRITICAL)
        for allergen in user_allergens:
            if allergen in food_allergens:
                conflicts.append({
                    'type': 'allergen',
                    'severity': 'critical',
                    'food_name': food.name,
                    'conflict': f'Contains {allergen}',
                    'recommendation': f'AVOID - Contains {allergen} which you are allergic to'
                })
        
        # Check dietary restriction conflicts
        for restriction in user_restrictions:
            if restriction not in food_restrictions:
                # Check if this violates the restriction rules
                rule = self.CONFLICT_RULES.get(restriction)
                if rule:
                    conflict = self._check_restriction_rule(food, restriction, rule)
                    if conflict:
                        conflicts.append(conflict)
        
        return conflicts
    
    def _check_restriction_rule(
        self, 
        food: FoodItem, 
        restriction: str, 
        rule: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Check if food violates a specific dietary restriction rule"""
        food_categories = food.dietary_attributes.food_categories if food.dietary_attributes else []
        
        # Check forbidden categories
        forbidden_categories = rule.get('forbidden_categories', [])
        for category in forbidden_categories:
            if category in food_categories:
                return {
                    'type': 'dietary_restriction',
                    'severity': 'high',
                    'food_name': food.name,
                    'conflict': f'Not {restriction} - contains {category}',
                    'recommendation': f'Choose a {restriction}-friendly alternative'
                }
        
        # Check carb limits for keto
        if restriction == 'keto' and rule.get('max_carbs_per_serving'):
            if food.nutrition.carbs > rule['max_carbs_per_serving']:
                return {
                    'type': 'nutritional',
                    'severity': 'medium',
                    'food_name': food.name,
                    'conflict': f'Too high in carbs ({food.nutrition.carbs}g) for keto',
                    'recommendation': 'Choose lower-carb alternatives'
                }
        
        return None
    
    async def _get_ai_conflict_resolution(
        self, 
        conflicts: List[Dict[str, Any]], 
        user_preferences: Dict[str, Any]
    ) -> List[str]:
        """Get AI-powered suggestions for resolving conflicts"""
        try:
            prompt = f"""
            As a nutrition expert, provide helpful suggestions to resolve these dietary conflicts:
            
            User Preferences: {user_preferences}
            Conflicts Found: {conflicts}
            
            Provide 3-5 practical suggestions for resolving these conflicts, focusing on:
            1. Safe food alternatives
            2. Modification suggestions
            3. General dietary advice
            
            Return as a simple list of suggestion strings.
            """
            
            ai_response = await self.ai_service.generate_conflict_resolution(prompt)
            return ai_response.get('suggestions', [
                'Consider checking ingredient labels more carefully',
                'Look for certified alternatives that match your dietary needs',
                'Consult with a nutritionist for personalized advice'
            ])
            
        except Exception as e:
            logger.error(f"Error getting AI conflict resolution: {e}")
            return ['Review your food choices against your dietary restrictions']
    
    def _calculate_safety_score(self, conflicts: List[Dict[str, Any]], total_foods: int) -> int:
        """Calculate a safety score based on conflicts"""
        if total_foods == 0:
            return 100
        
        critical_conflicts = len([c for c in conflicts if c['severity'] == 'critical'])
        high_conflicts = len([c for c in conflicts if c['severity'] == 'high'])
        medium_conflicts = len([c for c in conflicts if c['severity'] == 'medium'])
        
        # Critical conflicts make food unsafe
        if critical_conflicts > 0:
            return 0
        
        # Calculate score based on conflict severity
        penalty = (high_conflicts * 30) + (medium_conflicts * 15)
        score = max(0, 100 - penalty)
        
        return score

# Create service instance
dietary_conflict_detector = DietaryConflictDetector()
