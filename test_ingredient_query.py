import json
import requests
import argparse
import os
from datetime import datetime

# Default constants
DEFAULT_USER_ID = "test_user_123"
API_URL = "http://localhost:8000/chat"  # Update with your API URL

def create_ingredient_data():
    """Create test ingredient data for the food index"""
    return [
        {
            "name": "Chicken Breast",
            "serving_size": 100,
            "serving_unit": "g",
            "calories": 165,
            "proteins": 31,
            "carbs": 0,
            "fats": 3.6,
            "source": "user-created",
            "created_by": DEFAULT_USER_ID
        },
        {
            "name": "Quinoa",
            "serving_size": 100,
            "serving_unit": "g",
            "calories": 120,
            "proteins": 4.4,
            "carbs": 21.3,
            "fats": 1.9,
            "source": "user-created",
            "created_by": DEFAULT_USER_ID
        },
        {
            "name": "Feta Cheese",
            "serving_size": 30,
            "serving_unit": "g",
            "calories": 75,
            "proteins": 4,
            "carbs": 1.2,
            "fats": 6,
            "source": "user-created",
            "created_by": DEFAULT_USER_ID
        }
    ]

def add_ingredients_to_food_db(user_id):
    """Add test ingredients to the user's food database"""
    from app.models import food_index, search_food_items
    
    # First check if ingredients already exist
    foods = search_food_items("", user_id=user_id)
    if foods and len(foods) > 0:
        print(f"Food database already has {len(foods)} items. Skipping ingredient addition.")
        return
    
    # Add test ingredients
    ingredients = create_ingredient_data()
    for ingredient in ingredients:
        ingredient["created_by"] = user_id
        food_index.insert_one(ingredient)
    
    print(f"Added {len(ingredients)} test ingredients to food database for user {user_id}")

def test_ingredient_query(user_id=DEFAULT_USER_ID):
    """Test the food index ingredient query functionality"""
    
    try:
        # First add test ingredients to database
        add_ingredients_to_food_db(user_id)
        
        # Setup API key from environment
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            print("Error: ANTHROPIC_API_KEY not set in environment")
            return False
        
        # Create test conversation
        messages = [
            {"role": "user", "content": "I need a high-protein dinner idea and I have time to cook"},
            {"role": "assistant", "content": "Great! Since you have time to cook and want something high in protein, here are two delicious options:\n\n## Herb-Crusted Salmon with Roasted Vegetables\n**Ingredients:**\n- Salmon fillet (6-8 oz)\n- Fresh herbs (dill, parsley, thyme)\n- Garlic (2 cloves)\n- Lemon\n- Assorted vegetables (Brussels sprouts, bell peppers, zucchini)\n- Olive oil\n- Salt and pepper\n\n**Protein Content:** ~35g per serving\n**Total Time:** 30-35 minutes\n**Serving Size:** 1 portion (approximately 450 calories)\n\n## Mediterranean Chicken & Quinoa Bowl\n**Ingredients:**\n- Chicken breast (6 oz)\n- Quinoa (½ cup uncooked)\n- Cherry tomatoes\n- Cucumber\n- Red onion\n- Feta cheese\n- Kalamata olives\n- Lemon-herb dressing\n\n**Protein Content:** ~40g per serving\n**Total Time:** 40 minutes\n**Serving Size:** 1 portion (approximately 520 calories)\n\nWould you like the detailed recipe for either of these options? Or would you prefer different suggestions?"},
            {"role": "user", "content": "I'm going to make the chicken and quinoa bowl. What ingredients do I have already in my food index?"}
        ]
        
        # Make the API request
        response = requests.post(
            API_URL,
            json={
                "messages": messages,
                "user_id": user_id,
                "fetch_context": True
            },
            headers={
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code != 200:
            print(f"API Error: {response.status_code} - {response.text}")
            return False
        
        result = response.json()
        
        # Check if the response contains information about available ingredients
        response_text = result.get("response", "")
        print("\n--- Test Response ---")
        print(response_text)
        print("--------------------\n")
        
        # Check for expected content in the response
        success = (
            "chicken" in response_text.lower() and 
            "quinoa" in response_text.lower() and 
            "feta cheese" in response_text.lower() and
            "missing" in response_text.lower()
        )
        
        if success:
            print("Test PASSED: The response contains information about available ingredients")
        else:
            print("Test FAILED: The response doesn't contain expected ingredient information")
            
        return success
    
    except Exception as e:
        print(f"Error during test: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test food index ingredient query functionality")
    parser.add_argument("--user-id", type=str, default=DEFAULT_USER_ID,
                        help="User ID to use for testing")
    
    args = parser.parse_args()
    success = test_ingredient_query(args.user_id)
    
    if success:
        print("All tests passed successfully!")
    else:
        print("Tests failed. See above for details.") 