from typing import List, Dict, Any, Optional
import os
import requests
from pydantic import BaseModel
from datetime import datetime, time, timezone
from .models import search_food_items, get_user_food_logs_by_date
import json
import time as time_module
import random
import re

# Import our improved resilience and diversity functions
from .improved_resilience import (
    validate_and_parse_meal_response,
    generate_fallback_meal,
    get_meal_suggestions_from_ai_with_retry,
    MealDiversityTracker,
    build_enhanced_meal_prompt
)

# Global diversity tracker
diversity_tracker = MealDiversityTracker()

# Pydantic models for request and response
class RemainingMacros(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float

class MealSuggestionRequest(BaseModel):
    user_id: str
    meal_type: str
    time_of_day: str  # Format: "HH:MM"
    preference: Optional[str] = None
    remaining_macros: RemainingMacros
    use_food_index_only: bool = True  # Default to using only food index
    specific_ingredients: List[str] = []  # List of specific ingredients to prioritize
    calorie_range: Optional[Dict[str, int]] = None  # {"min": 300, "max": 600}
    diet_type: Optional[str] = None  # vegetarian, vegan, keto, etc.
    cooking_time: Optional[int] = None  # Maximum cooking time in minutes

class MacroBreakdown(BaseModel):
    protein: float
    carbs: float
    fat: float
    calories: float

class Ingredient(BaseModel):
    name: str
    amount: float
    unit: str
    in_food_index: bool = False
    macros: Optional[MacroBreakdown] = None
    needs_indexing: bool = False

class MealSuggestion(BaseModel):
    name: str
    macros: MacroBreakdown
    description: str
    serving_info: Optional[str] = "1 serving"  # Default serving information
    ingredients: List[Ingredient] = []  # Detailed ingredients list
    instructions: List[str] = []  # Step-by-step preparation instructions
    cooking_time: int = 0  # Cooking time in minutes
    cuisine: Optional[str] = None  # Add cuisine field for diversity tracking

class MealSuggestionResponse(BaseModel):
    suggestions: List[MealSuggestion]

# Function to retrieve user's food index - unchanged
async def get_user_food_index(user_id: str, meal_type: str = None) -> List[Dict[str, Any]]:
    """
    Retrieve the user's food index from MongoDB.
    
    Args:
        user_id: The user's ID
        meal_type: Optional meal type to filter foods by compatibility
        
    Returns:
        A list of food items available to the user
    """
    # Use the search_food_items function with an empty query to get all foods
    # This will return foods created by the user or system foods
    foods = search_food_items("")
    
    # Filter to only include foods relevant to the user
    # This includes foods created by this user or system foods
    user_foods = [food for food in foods if food.get("created_by") == user_id or food.get("source") != "user-created"]
    
    # If meal_type is specified, filter foods by meal compatibility
    if meal_type:
        # If meal_compatibility exists and contains the specified meal type, or meal_compatibility doesn't exist
        user_foods = [
            food for food in user_foods if 
            not food.get("meal_compatibility") or  # Include foods with no compatibility info
            meal_type in food.get("meal_compatibility", [])  # Include foods compatible with this meal
        ]
    
    return user_foods

# Function to build prompt for Claude with diversity improvements
def build_meal_suggestion_prompt(
    food_index: List[Dict[str, Any]],
    remaining_macros: Dict[str, float],
    meal_type: str,
    time_of_day: str,
    preference: Optional[str] = None,
    use_food_index_only: bool = True,
    specific_ingredients: List[str] = [],
    calorie_range: Optional[Dict[str, int]] = None,
    diet_type: Optional[str] = None,
    cooking_time: Optional[int] = None,
    previous_meals: List[Dict[str, Any]] = None,
    diversity_constraints: Dict[str, Any] = None
) -> str:
    """
    Build a prompt for Claude/GPT to suggest meals based on user data,
    with added diversity constraints.
    
    Args:
        food_index: List of food items available to the user
        remaining_macros: User's remaining macros for the day
        meal_type: The type of meal requested (breakfast, lunch, dinner, snack)
        time_of_day: The time of day in HH:MM format
        preference: Optional preference modifier (healthy, sugary, quick, etc.)
        use_food_index_only: Whether to restrict suggestions to only use items in the food index
        specific_ingredients: List of specific ingredients to prioritize in suggestions
        calorie_range: Optional min/max calorie range for the meal
        diet_type: Optional diet restriction (vegetarian, vegan, keto, etc.)
        cooking_time: Optional maximum cooking time in minutes
        previous_meals: List of previously generated meals for diversity
        diversity_constraints: Constraints to ensure diverse meal suggestions
        
    Returns:
        A formatted prompt for Claude/GPT
    """
    # Format the time of day
    try:
        hour, minute = map(int, time_of_day.split(':'))
        formatted_time = f"{hour:02d}:{minute:02d}"
    except:
        formatted_time = time_of_day
    
    # Format the food index for the prompt
    food_index_str = "\n".join([
        f"- {food.get('name', 'Unnamed food')}: "
        f"{food.get('serving_size', 0)} {food.get('serving_unit', 'g')}, "
        f"{food.get('calories', 0)} cal, "
        f"{food.get('proteins', 0)}g protein, "
        f"{food.get('carbs', 0)}g carbs, "
        f"{food.get('fats', 0)}g fat"
        for food in food_index[:50]  # Limit to 50 foods to keep prompt size reasonable
    ])
    
    # Highlight specific ingredients if provided
    if specific_ingredients:
        specific_ingredients_str = ", ".join(specific_ingredients)
        specific_foods = [
            food for food in food_index 
            if any(ingredient.lower() in food.get('name', '').lower() for ingredient in specific_ingredients)
        ]
        
        if specific_foods:
            specific_foods_str = "\n".join([
                f"- {food.get('name', 'Unnamed food')}: "
                f"{food.get('serving_size', 0)} {food.get('serving_unit', 'g')}, "
                f"{food.get('calories', 0)} cal, "
                f"{food.get('proteins', 0)}g protein, "
                f"{food.get('carbs', 0)}g carbs, "
                f"{food.get('fats', 0)}g fat"
                for food in specific_foods
            ])
            food_index_str = "REQUESTED INGREDIENTS:\n" + specific_foods_str + "\n\nOTHER AVAILABLE FOODS:\n" + food_index_str
    
    # Start building the prompt
    prompt = f"""You are Nutrivize, an AI health assistant. Use the following food index and remaining daily nutrition data to recommend EXACTLY 3 meal options that match the user's needs. The user is asking for a {meal_type} at {formatted_time}"""
    
    # Add preference if specified
    if preference:
        prompt += f", and prefers something {preference}"
    
    # Add specific ingredients if provided
    if specific_ingredients:
        prompt += f". The user specifically wants to use these ingredients: {', '.join(specific_ingredients)}"
    
    # Add calorie range if specified
    if calorie_range:
        min_cal = calorie_range.get("min", 0)
        max_cal = calorie_range.get("max", 2000)
        prompt += f". The meal should contain between {min_cal} and {max_cal} calories"
    
    # Add diet type if specified
    if diet_type:
        prompt += f". The meal should be suitable for a {diet_type} diet"
    
    # Add cooking time constraint if specified
    if cooking_time:
        prompt += f". The meal should take no more than {cooking_time} minutes to prepare"
    
    # Add instruction about using food index
    if use_food_index_only:
        prompt += """. Make realistic, simple suggestions using ONLY the ingredients in the user's food index (common ingredients like oil, salt, pepper can be assumed available)."""
    else:
        prompt += """. Make realistic, simple suggestions. You can recommend any nutritious meal without being restricted to the user's food index."""
        
    prompt += """ For each suggestion, provide:
1. A name
2. Estimated macro breakdown (calories, protein, carbs, fat)
3. Serving size information (e.g., "1 bowl (250g)" or "2 pieces (120g total)")
4. Brief description
5. Complete ingredients list with quantities
6. Step-by-step preparation instructions
7. Cooking time estimate
8. Cuisine type (e.g., Mediterranean, Asian, American, etc.)

REMAINING DAILY NUTRITION:
- Calories: {remaining_macros['calories']} cal
- Protein: {remaining_macros['protein']}g
- Carbs: {remaining_macros['carbs']}g
- Fat: {remaining_macros['fat']}g

AVAILABLE FOOD INDEX:
{food_index_str}

Note: The food items have been pre-filtered to be suitable for {meal_type}."""
    
    prompt += """

YOU MUST RESPOND WITH ONLY A VALID JSON OBJECT. NO ADDITIONAL TEXT OR EXPLANATIONS BEFORE OR AFTER THE JSON.

Your response should be a JSON object with a 'suggestions' array containing EXACTLY 3 meal options. Each suggestion should have:
1. "name" (string)
2. "macros" object (with "calories", "protein", "carbs", "fat" as numbers)
3. "serving_info" (string)
4. "description" (string)
5. "ingredients" (array of objects, each with "name", "amount", "unit", "in_food_index" [boolean], "macros" (object with "protein", "carbs", "fat", "calories"), and "needs_indexing" [boolean])
6. "instructions" (array of strings)
7. "cooking_time" (number of minutes)
8. "cuisine" (string - type of cuisine, e.g. "Mediterranean", "Asian", etc.)

Example format (FOLLOW THIS EXACT STRUCTURE):

{
  "suggestions": [
    {
      "name": "Greek Yogurt with Berries",
      "macros": {
        "protein": 15,
        "carbs": 20,
        "fat": 5,
        "calories": 180
      },
      "serving_info": "1 bowl (150g yogurt with 50g mixed berries)",
      "description": "A quick, high-protein snack using yogurt and berries you already have.",
      "ingredients": [
        {"name": "Greek Yogurt", "amount": 150, "unit": "g", "in_food_index": true, "macros": {"protein": 12, "carbs": 5, "fat": 0, "calories": 80}, "needs_indexing": false},
        {"name": "Mixed Berries", "amount": 50, "unit": "g", "in_food_index": false, "macros": {"protein": 0.5, "carbs": 5, "fat": 0, "calories": 30}, "needs_indexing": true},
        {"name": "Honey", "amount": 1, "unit": "tsp", "in_food_index": false, "macros": {"protein": 0, "carbs": 5, "fat": 0, "calories": 20}, "needs_indexing": true}
      ],
      "instructions": [
        "Add Greek yogurt to a bowl",
        "Top with mixed berries",
        "Drizzle with honey if desired"
      ],
      "cooking_time": 5,
      "cuisine": "Mediterranean"
    }
  ]
}

IMPORTANT: ONLY respond with valid JSON. No markdown formatting, no code blocks, no explanations, just raw JSON.
KEEP YOUR RESPONSE BRIEF AND FOCUSED ONLY ON THE MEAL SUGGESTIONS.

For each ingredient, provide macros as precisely as possible. If the ingredient is in the food index, use those values. If not, use your nutrition knowledge to estimate them. For any ingredient not in the food index, set "needs_indexing" to true to indicate that the user should add this item to their food index for more accurate tracking."""
    
    # Add reminder about food index restriction or not
    if use_food_index_only:
        prompt += " Ensure the suggested meals primarily use items from the provided food index (plus basic cooking ingredients)."

    if specific_ingredients:
        prompt += f" Your suggestions MUST prominently feature the requested ingredients: {', '.join(specific_ingredients)}."

    # Apply diversity enhancements if previous meals or constraints are provided
    if previous_meals or diversity_constraints:
        prompt = build_enhanced_meal_prompt(prompt, previous_meals, diversity_constraints)

    return prompt

# New function to call Claude API with resiliency improvements
async def get_meal_suggestions_from_ai(prompt: str) -> Dict[str, Any]:
    """
    Call Claude API with the formatted prompt and get meal suggestions.
    Uses the improved retry and error handling.
    
    Args:
        prompt: The formatted prompt for Claude
        
    Returns:
        Parsed response from Claude with meal suggestions
    """
    # Use our improved AI call function with retry logic
    return await get_meal_suggestions_from_ai_with_retry(prompt)

# Main function to get meal suggestions with added diversity
async def get_meal_suggestions(request: MealSuggestionRequest) -> MealSuggestionResponse:
    """
    Get meal suggestions based on user's food index and preferences.
    Now with improved resilience and meal diversity.
    
    Args:
        request: A MealSuggestionRequest object containing user preferences and constraints
        
    Returns:
        A MealSuggestionResponse with suggested meals
    """
    try:
        # Get the user's food index
        food_index = await get_user_food_index(request.user_id, request.meal_type)
        
        # Check if food index is empty
        if not food_index:
            # Return error if no foods are available
            return MealSuggestionResponse(
                suggestions=[
                    MealSuggestion(
                        name="No Foods Available",
                        macros=MacroBreakdown(protein=0, carbs=0, fat=0, calories=0),
                        description="Your food index is empty. Please add some foods before requesting meal suggestions.",
                        serving_info="N/A"
                    )
                ]
            )
        
        # Get diversity constraints from our tracker
        diversity_constraints = diversity_tracker.get_diversity_constraints()
        
        # Get previous meals for context (up to 5 most recent)
        previous_meals = diversity_tracker.meal_history[-5:] if diversity_tracker.meal_history else []
        
        # Set flag for using only food index items
        use_food_index_only = request.use_food_index_only
        
        # Build prompt for Claude with diversity enhancements
        prompt = build_meal_suggestion_prompt(
            food_index=food_index,
            remaining_macros={
                "calories": request.remaining_macros.calories,
                "protein": request.remaining_macros.protein,
                "carbs": request.remaining_macros.carbs,
                "fat": request.remaining_macros.fat
            },
            meal_type=request.meal_type,
            time_of_day=request.time_of_day,
            preference=request.preference,
            use_food_index_only=use_food_index_only,
            specific_ingredients=request.specific_ingredients,
            calorie_range=request.calorie_range,
            diet_type=request.diet_type,
            cooking_time=request.cooking_time,
            previous_meals=previous_meals,
            diversity_constraints=diversity_constraints
        )
        
        # Get suggestions from Claude with improved resilience
        ai_response = await get_meal_suggestions_from_ai(prompt)
        
        # Parse and validate the response
        suggestions = ai_response.get("suggestions", [])
        
        # Convert to Pydantic models
        response_suggestions = []
        for suggestion in suggestions:
            macros = suggestion.get("macros", {})
            meal_suggestion = MealSuggestion(
                name=suggestion.get("name", "Unnamed meal"),
                macros=MacroBreakdown(
                    protein=macros.get("protein", 0),
                    carbs=macros.get("carbs", 0),
                    fat=macros.get("fat", 0),
                    calories=macros.get("calories", 0)
                ),
                description=suggestion.get("description", "No description available"),
                serving_info=suggestion.get("serving_info", "1 serving"),
                ingredients=[
                    Ingredient(
                        name=ingredient["name"], 
                        amount=ingredient["amount"], 
                        unit=ingredient["unit"], 
                        in_food_index=ingredient["in_food_index"],
                        macros=MacroBreakdown(
                            protein=ingredient.get("macros", {}).get("protein", 0),
                            carbs=ingredient.get("macros", {}).get("carbs", 0),
                            fat=ingredient.get("macros", {}).get("fat", 0),
                            calories=ingredient.get("macros", {}).get("calories", 0)
                        ) if "macros" in ingredient else None,
                        needs_indexing=ingredient.get("needs_indexing", False)
                    ) for ingredient in suggestion.get("ingredients", [])
                ],
                instructions=suggestion.get("instructions", []),
                cooking_time=suggestion.get("cooking_time", 0),
                cuisine=suggestion.get("cuisine", "General")
            )
            response_suggestions.append(meal_suggestion)
            
            # Track this meal for diversity
            diversity_tracker.add_meal(suggestion)
        
        return MealSuggestionResponse(suggestions=response_suggestions)
        
    except Exception as e:
        print(f"Error in meal suggestions: {e}")
        # Return error response
        return MealSuggestionResponse(
            suggestions=[
                MealSuggestion(
                    name="Error",
                    macros=MacroBreakdown(protein=0, carbs=0, fat=0, calories=0),
                    description=f"Error generating meal suggestions: {str(e)}",
                    serving_info="N/A"
                )
            ]
        ) 