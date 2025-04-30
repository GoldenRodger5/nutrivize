import json
import unittest
import asyncio
from unittest.mock import patch, MagicMock
import os
import sys

# Add parent directory to path to import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.meal_suggestions import (
    get_meal_suggestions_from_ai,
    build_meal_suggestion_prompt,
    RemainingMacros,
    MealSuggestionRequest,
    get_meal_suggestions
)

class TestMealSuggestions(unittest.IsolatedAsyncioTestCase):
    """Test cases for meal suggestions functionality."""
    
    async def test_json_parsing_with_code_blocks(self):
        """Test that JSON parsing properly handles code blocks."""
        content = """```json
{
  "suggestions": [
    {
      "name": "Test Meal",
      "macros": {
        "protein": 15,
        "carbs": 20,
        "fat": 5,
        "calories": 180
      },
      "serving_info": "1 serving",
      "description": "Test description",
      "ingredients": [
        {"name": "Ingredient 1", "amount": 100, "unit": "g", "in_food_index": true}
      ],
      "instructions": ["Step 1"],
      "cooking_time": 10
    }
  ]
}
```"""
        
        with patch('requests.post') as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "content": [{"text": content}]
            }
            mock_post.return_value = mock_response
            
            result = await get_meal_suggestions_from_ai("test prompt")
            
            self.assertIn("suggestions", result)
            self.assertEqual(len(result["suggestions"]), 1)
            self.assertEqual(result["suggestions"][0]["name"], "Test Meal")
    
    async def test_json_parsing_with_surrounding_text(self):
        """Test that JSON parsing properly handles surrounding text."""
        content = """Here's a meal suggestion for you:

{
  "suggestions": [
    {
      "name": "Test Meal",
      "macros": {
        "protein": 15,
        "carbs": 20,
        "fat": 5,
        "calories": 180
      },
      "serving_info": "1 serving",
      "description": "Test description",
      "ingredients": [
        {"name": "Ingredient 1", "amount": 100, "unit": "g", "in_food_index": true}
      ],
      "instructions": ["Step 1"],
      "cooking_time": 10
    }
  ]
}

I hope you enjoy this meal!"""
        
        with patch('requests.post') as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "content": [{"text": content}]
            }
            mock_post.return_value = mock_response
            
            result = await get_meal_suggestions_from_ai("test prompt")
            
            self.assertIn("suggestions", result)
            self.assertEqual(len(result["suggestions"]), 1)
            self.assertEqual(result["suggestions"][0]["name"], "Test Meal")
    
    async def test_invalid_json_response(self):
        """Test that an invalid JSON response is handled gracefully."""
        content = """This is not valid JSON"""
        
        with patch('requests.post') as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "content": [{"text": content}]
            }
            mock_post.return_value = mock_response
            
            result = await get_meal_suggestions_from_ai("test prompt")
            
            self.assertIn("suggestions", result)
            self.assertEqual(len(result["suggestions"]), 1)
            self.assertEqual(result["suggestions"][0]["name"], "Error parsing response")
    
    def test_prompt_building(self):
        """Test that the prompt is built correctly with different parameters."""
        remaining_macros = {
            "calories": 1000, 
            "protein": 50, 
            "carbs": 100, 
            "fat": 30
        }
        food_index = [
            {"name": "Chicken Breast", "serving_size": 100, "serving_unit": "g", "calories": 165, "proteins": 31, "carbs": 0, "fats": 3.6}
        ]
        
        # Test with basic parameters
        prompt = build_meal_suggestion_prompt(
            food_index=food_index,
            remaining_macros=remaining_macros,
            meal_type="dinner",
            time_of_day="18:00"
        )
        
        # Check for structural elements in the prompt
        self.assertIn("dinner at 18:00", prompt)
        self.assertIn("REMAINING DAILY NUTRITION", prompt)
        self.assertIn("AVAILABLE FOOD INDEX", prompt)
        self.assertIn("YOU MUST RESPOND WITH ONLY A VALID JSON OBJECT", prompt)
        
        # The prompt should include placeholders for the macros
        self.assertIn("Calories: {remaining_macros['calories']}", prompt)
        self.assertIn("Protein: {remaining_macros['protein']}", prompt)
        
        # For the food index placeholder
        self.assertIn("{food_index_str}", prompt)
        
        # Check advanced parameters
        prompt_advanced = build_meal_suggestion_prompt(
            food_index=food_index,
            remaining_macros=remaining_macros,
            meal_type="dinner",
            time_of_day="18:00",
            preference="healthy",
            specific_ingredients=["Chicken"],
            diet_type="high-protein",
            cooking_time=30
        )
        
        # Check that the additional parameters appear in the prompt
        self.assertIn("prefers something healthy", prompt_advanced)
        self.assertIn("use these ingredients: Chicken", prompt_advanced)
        self.assertIn("high-protein diet", prompt_advanced)
        self.assertIn("30 minutes to prepare", prompt_advanced)

def run_tests():
    """Run the tests asynchronously."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    test_suite = unittest.TestLoader().loadTestsFromTestCase(TestMealSuggestions)
    runner = unittest.TextTestRunner()
    runner.run(test_suite)

if __name__ == "__main__":
    run_tests() 