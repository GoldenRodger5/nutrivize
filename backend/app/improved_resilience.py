import os
import json
import time
import random
import re
from typing import Dict, Any, List, Tuple, Optional
import requests

# ----- API RESILIENCE IMPROVEMENTS -----

def validate_and_parse_meal_response(response_text: str) -> Tuple[Dict[str, Any], Optional[str]]:
    """
    Validate and parse response from AI API with better error handling.
    Returns a tuple of (parsed_data, error_message)
    """
    try:
        # Try to parse the full response first
        parsed_data = json.loads(response_text)
        return parsed_data, None
    except json.JSONDecodeError:
        # Try to extract valid JSON using regex if full parsing fails
        json_pattern = r'```json\s*([\s\S]*?)\s*```'
        matches = re.findall(json_pattern, response_text)
        
        if matches:
            for match in matches:
                try:
                    parsed_data = json.loads(match)
                    return parsed_data, None
                except:
                    continue
        
        # If there are no code blocks, try to find JSON object directly
        try:
            if "{" in response_text and "}" in response_text:
                start_idx = response_text.find("{")
                end_idx = response_text.rfind("}") + 1
                if start_idx < end_idx:
                    clean_content = response_text[start_idx:end_idx]
                    return json.loads(clean_content), None
        except:
            pass
        
        # If all extraction attempts fail, generate fallback meal
        return generate_fallback_meal(), "Failed to parse AI response"

def generate_fallback_meal(meal_type="breakfast", preferences=None) -> Dict[str, Any]:
    """Generate a safe fallback meal when AI generation fails"""
    preferences = preferences or {}
    
    # Basic fallback meals for each meal type
    fallback_meals = {
        "breakfast": {
            "suggestions": [{
                "name": "Protein Oatmeal with Fruit",
                "macros": {
                    "protein": 30,
                    "carbs": 50,
                    "fat": 10,
                    "calories": 400
                },
                "description": "Simple and nutritious oatmeal with protein powder and fresh fruit.",
                "serving_info": "1 bowl (350g)",
                "ingredients": [
                    {"name": "Rolled oats", "amount": 80, "unit": "g", "in_food_index": True},
                    {"name": "Protein powder", "amount": 30, "unit": "g", "in_food_index": True},
                    {"name": "Banana", "amount": 1, "unit": "whole", "in_food_index": True},
                    {"name": "Berries", "amount": 50, "unit": "g", "in_food_index": True},
                    {"name": "Almond milk", "amount": 240, "unit": "ml", "in_food_index": True}
                ],
                "instructions": [
                    "Cook oats with almond milk for 3-5 minutes", 
                    "Stir in protein powder until fully mixed", 
                    "Top with sliced banana and berries"
                ],
                "cooking_time": 10
            }]
        },
        "lunch": {
            "suggestions": [{
                "name": "Chicken Salad with Mixed Greens",
                "macros": {
                    "protein": 35,
                    "carbs": 20,
                    "fat": 15,
                    "calories": 350
                },
                "description": "A satisfying salad with lean protein and plenty of vegetables.",
                "serving_info": "1 large bowl (400g)",
                "ingredients": [
                    {"name": "Chicken breast", "amount": 150, "unit": "g", "in_food_index": True},
                    {"name": "Mixed greens", "amount": 100, "unit": "g", "in_food_index": True},
                    {"name": "Cherry tomatoes", "amount": 50, "unit": "g", "in_food_index": True},
                    {"name": "Cucumber", "amount": 50, "unit": "g", "in_food_index": True},
                    {"name": "Olive oil", "amount": 10, "unit": "ml", "in_food_index": True},
                    {"name": "Balsamic vinegar", "amount": 5, "unit": "ml", "in_food_index": True}
                ],
                "instructions": [
                    "Season and grill chicken breast", 
                    "Slice chicken and vegetables", 
                    "Toss with olive oil and balsamic vinegar"
                ],
                "cooking_time": 15
            }]
        },
        "dinner": {
            "suggestions": [{
                "name": "Simple Beef Stir Fry",
                "macros": {
                    "protein": 40,
                    "carbs": 40,
                    "fat": 20,
                    "calories": 500
                },
                "description": "A quick and satisfying beef stir fry with mixed vegetables.",
                "serving_info": "1 plate (450g)",
                "ingredients": [
                    {"name": "Lean beef", "amount": 150, "unit": "g", "in_food_index": True},
                    {"name": "Brown rice", "amount": 100, "unit": "g", "in_food_index": True},
                    {"name": "Mixed vegetables", "amount": 150, "unit": "g", "in_food_index": True},
                    {"name": "Soy sauce", "amount": 15, "unit": "ml", "in_food_index": True},
                    {"name": "Garlic", "amount": 2, "unit": "clove", "in_food_index": True},
                    {"name": "Olive oil", "amount": 10, "unit": "ml", "in_food_index": True}
                ],
                "instructions": [
                    "Cook brown rice according to package", 
                    "Stir fry beef with garlic", 
                    "Add vegetables and soy sauce", 
                    "Serve over rice"
                ],
                "cooking_time": 25
            }]
        },
        "snack": {
            "suggestions": [{
                "name": "Greek Yogurt with Honey",
                "macros": {
                    "protein": 15,
                    "carbs": 15,
                    "fat": 5,
                    "calories": 170
                },
                "description": "A protein-rich snack that satisfies sweet cravings.",
                "serving_info": "1 cup (200g)",
                "ingredients": [
                    {"name": "Greek yogurt", "amount": 170, "unit": "g", "in_food_index": True},
                    {"name": "Honey", "amount": 15, "unit": "g", "in_food_index": True},
                    {"name": "Walnuts", "amount": 10, "unit": "g", "in_food_index": True}
                ],
                "instructions": [
                    "Top Greek yogurt with honey and walnuts"
                ],
                "cooking_time": 2
            }]
        }
    }
    
    # Use appropriate fallback based on meal type
    return fallback_meals.get(meal_type, fallback_meals["breakfast"])

async def get_meal_suggestions_from_ai_with_retry(prompt: str, max_retries=3, base_delay=2) -> Dict[str, Any]:
    """
    Call Claude API with the formatted prompt and get meal suggestions,
    with retry logic for better resilience.
    
    Args:
        prompt: The formatted prompt for Claude
        max_retries: Maximum number of retry attempts
        base_delay: Base delay between retries (uses exponential backoff)
        
    Returns:
        Parsed response from Claude with meal suggestions
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    
    if not api_key:
        # For development purposes only - replace with your actual API key
        api_key = "your_anthropic_api_key_here"
        
    if not api_key or api_key == "your_anthropic_api_key_here":
        raise Exception("API key not found. Make sure ANTHROPIC_API_KEY is set in your environment or update the hardcoded key in meal_suggestions.py.")
    
    # Extract meal type from prompt for fallback
    meal_type_match = re.search(r"asking for a (\w+) at", prompt)
    meal_type = meal_type_match.group(1) if meal_type_match else "breakfast"
    
    # Extract preferences from prompt
    preferences = {}
    diet_type_match = re.search(r"suitable for a (\w+) diet", prompt)
    if diet_type_match:
        preferences["diet_type"] = diet_type_match.group(1)
    
    # Try API call with retries
    for attempt in range(max_retries):
        try:
            # Add jitter to delay to prevent synchronized retries
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            
            # Print API call attempt info
            print(f"API call attempt {attempt+1}/{max_retries}")
            
            # Modified API call
            response = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": "claude-3-7-sonnet-20250219",
                    "messages": [{"role": "user", "content": prompt}],
                    "system": "You are Nutrivize, a helpful AI nutritionist. You MUST ALWAYS respond with valid JSON only, no additional text or explanation.",
                    "max_tokens": 4000,
                    "temperature": 0.5
                },
                timeout=60
            )
            
            response_status = response.status_code
            print(f"API response status: {response_status}")
            
            if response_status != 200:
                print(f"API Error: {response_status} - {response.text}")
                # If not last attempt, wait and retry
                if attempt < max_retries - 1:
                    print(f"Retrying in {delay:.2f} seconds...")
                    time.sleep(delay)
                    continue
                else:
                    # On last attempt, return fallback meal
                    return generate_fallback_meal(meal_type, preferences)
            
            result = response.json()
            content = result["content"][0]["text"]
            
            # Validate and parse the response
            parsed_content, error = validate_and_parse_meal_response(content)
            
            if error:
                print(f"Error parsing response: {error}")
                # If not last attempt, retry
                if attempt < max_retries - 1:
                    print(f"Retrying in {delay:.2f} seconds...")
                    time.sleep(delay)
                    continue
                else:
                    # On last attempt, return fallback meal
                    return generate_fallback_meal(meal_type, preferences)
            
            return parsed_content
            
        except Exception as e:
            print(f"Exception in Claude API call (attempt {attempt+1}): {str(e)}")
            
            # If not last attempt, retry
            if attempt < max_retries - 1:
                print(f"Retrying in {delay:.2f} seconds...")
                time.sleep(delay)
            else:
                # On last attempt, return fallback meal
                return generate_fallback_meal(meal_type, preferences)
    
    # This should never happen with the current logic, but as a safety measure
    return generate_fallback_meal(meal_type, preferences)

# ----- MEAL DIVERSITY IMPROVEMENTS -----

class MealDiversityTracker:
    def __init__(self):
        self.meal_history = []
        self.ingredient_counts = {}
        self.cooking_method_counts = {}
        self.cuisine_history = []
        
    def add_meal(self, meal):
        self.meal_history.append(meal)
        
        # Track ingredient usage
        for ingredient in meal.get('ingredients', []):
            name = ingredient.get('name', '').lower()
            self.ingredient_counts[name] = self.ingredient_counts.get(name, 0) + 1
        
        # Extract cooking methods from instructions
        cooking_methods = self.extract_cooking_methods(' '.join(meal.get('instructions', [])))
        for method in cooking_methods:
            self.cooking_method_counts[method] = self.cooking_method_counts.get(method, 0) + 1
        
        # Track cuisine if available
        if 'cuisine' in meal:
            self.cuisine_history.append(meal['cuisine'])
    
    def extract_cooking_methods(self, instructions):
        """Extract cooking methods from instructions text"""
        cooking_methods = [
            "bake", "boil", "broil", "grill", "fry", "roast", "sauté", "simmer", 
            "steam", "stir-fry", "poach", "braise"
        ]
        
        found_methods = []
        for method in cooking_methods:
            if method in instructions.lower():
                found_methods.append(method)
        
        return found_methods
    
    def get_overused_ingredients(self, threshold=2):
        """Return ingredients used more than threshold times"""
        return [ing for ing, count in self.ingredient_counts.items() if count > threshold]
    
    def get_diversity_constraints(self):
        """Generate constraints to increase diversity"""
        constraints = {}
        
        # Avoid overused ingredients
        overused = self.get_overused_ingredients()
        if overused:
            constraints['avoid_ingredients'] = overused[:5]  # Top 5 overused
        
        # Encourage underused cooking methods
        all_methods = ["roast", "grill", "bake", "sauté", "steam", "stir-fry", "boil", "simmer", "braise"]
        used_methods = self.cooking_method_counts.keys()
        underused = [m for m in all_methods if m not in used_methods]
        if underused:
            constraints['suggested_cooking_methods'] = underused[:3]  # Suggest 3 underused methods
        
        # Suggest different cuisines
        common_cuisines = ["Mediterranean", "Asian", "Latin American", "European", "Indian", "Middle Eastern"]
        recent_cuisines = self.cuisine_history[-3:] if len(self.cuisine_history) >= 3 else self.cuisine_history
        suggested_cuisines = [c for c in common_cuisines if c not in recent_cuisines]
        if suggested_cuisines:
            constraints['suggested_cuisines'] = suggested_cuisines[:2]  # Suggest 2 cuisines
        
        return constraints

def build_enhanced_meal_prompt(base_prompt, meal_history=None, diversity_constraints=None):
    """
    Enhance the meal generation prompt with diversity constraints
    
    Args:
        base_prompt: The original meal prompt
        meal_history: Previous meals generated
        diversity_constraints: Constraints to increase diversity
    
    Returns:
        Enhanced prompt with diversity guidance
    """
    if not meal_history and not diversity_constraints:
        return base_prompt
    
    enhanced_prompt = base_prompt
    
    # Add diversity section
    enhanced_prompt += "\n\nIMPORTANT DIVERSITY REQUIREMENTS:"
    
    # Add previous meal information if available
    if meal_history and len(meal_history) > 0:
        enhanced_prompt += "\n\nPrevious meals generated (DO NOT REPEAT THESE):"
        for i, meal in enumerate(meal_history[-3:]):  # Show last 3 meals
            enhanced_prompt += f"\n{i+1}. {meal.get('name', 'Unknown meal')}"
            if 'description' in meal:
                enhanced_prompt += f" - {meal['description'][:50]}..."
    
    # Add diversity constraints if available
    if diversity_constraints:
        if 'avoid_ingredients' in diversity_constraints:
            enhanced_prompt += "\n\nAVOID these overused ingredients if possible:"
            enhanced_prompt += f"\n{', '.join(diversity_constraints['avoid_ingredients'])}"
        
        if 'suggested_cooking_methods' in diversity_constraints:
            enhanced_prompt += "\n\nTRY TO USE these cooking methods:"
            enhanced_prompt += f"\n{', '.join(diversity_constraints['suggested_cooking_methods'])}"
        
        if 'suggested_cuisines' in diversity_constraints:
            enhanced_prompt += "\n\nCONSIDER these cuisines for variety:"
            enhanced_prompt += f"\n{', '.join(diversity_constraints['suggested_cuisines'])}"
    
    # Emphasize diversity requirement
    enhanced_prompt += "\n\nYOUR MEAL SUGGESTION MUST BE SUBSTANTIALLY DIFFERENT from any previous meals in both ingredients and preparation method."
    
    return enhanced_prompt

def assign_cuisine_rotation(days, meal_types):
    """Ensures cuisine variety across the meal plan"""
    cuisines = [
        "Mediterranean", "Asian", "Mexican", "American", "Indian", 
        "Middle Eastern", "Italian", "French", "Thai", "Japanese"
    ]
    
    rotation = {}
    cuisine_index = 0
    
    for day in range(days):
        rotation[day] = {}
        for meal_type in meal_types:
            # Assign next cuisine in rotation
            rotation[day][meal_type] = cuisines[cuisine_index % len(cuisines)]
            cuisine_index += 1
    
    return rotation 