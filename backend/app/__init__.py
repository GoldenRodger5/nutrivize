# Nutrivize backend app
# Import improved modules for API resilience and meal diversity
from .improved_resilience import (
    validate_and_parse_meal_response,
    generate_fallback_meal,
    get_meal_suggestions_from_ai_with_retry,
    MealDiversityTracker,
    build_enhanced_meal_prompt
)
