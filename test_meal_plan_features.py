#!/usr/bin/env python3
"""
Test script to verify meal plan enhanced features
"""

import requests
import json
from datetime import date, datetime

# Configuration
API_BASE_URL = "http://localhost:8000"
TEST_USER_TOKEN = "your_test_token_here"  # Replace with actual token

def test_meal_plan_features():
    """Test the enhanced meal plan features"""
    headers = {
        "Authorization": f"Bearer {TEST_USER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    print("🔍 Testing Meal Plan Enhanced Features")
    print("=" * 50)
    
    # Test 1: Create a simple meal plan
    print("\n1. Creating a test meal plan...")
    meal_plan_data = {
        "name": "Test Enhanced Meal Plan",
        "days": 3,
        "dietary_restrictions": ["vegetarian"],
        "preferred_cuisines": ["mediterranean"],
        "calories_per_day": 2000,
        "protein_target": 150,
        "carbs_target": 200,
        "fat_target": 65,
        "exclude_foods": [],
        "meal_types": ["breakfast", "lunch", "dinner"]
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/meal-planning/generate",
            headers=headers,
            json=meal_plan_data
        )
        if response.status_code == 200:
            print("✅ Meal plan created successfully")
            plan = response.json()
            plan_id = plan.get("plan_id")
            print(f"   Plan ID: {plan_id}")
            
            # Check if meals have ingredients and instructions
            for day in plan.get("days", []):
                print(f"   Day {day['date']}:")
                for meal in day.get("meals", []):
                    print(f"     - {meal['food_name']} ({meal['meal_type']})")
                    if meal.get("ingredients"):
                        print(f"       Ingredients: {len(meal['ingredients'])} items")
                    if meal.get("instructions"):
                        print(f"       Instructions: {len(meal['instructions'])} steps")
        else:
            print(f"❌ Failed to create meal plan: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error creating meal plan: {e}")
    
    # Test 2: Test food logging endpoint
    print("\n2. Testing food logging endpoint...")
    food_log_data = {
        "date": date.today().isoformat(),
        "meal_type": "breakfast",
        "food_id": "test_food_001",
        "food_name": "Oatmeal with Berries",
        "amount": 1.0,
        "unit": "serving",
        "nutrition": {
            "calories": 300,
            "protein": 10,
            "carbs": 50,
            "fat": 5
        },
        "notes": "From meal plan test"
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/food-logs/",
            headers=headers,
            json=food_log_data
        )
        if response.status_code == 200:
            print("✅ Food logging endpoint works")
            logged_food = response.json()
            print(f"   Logged: {logged_food.get('food_name')}")
        else:
            print(f"❌ Failed to log food: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error logging food: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")
    print("\nNote: Make sure to:")
    print("1. Replace TEST_USER_TOKEN with a valid token")
    print("2. Ensure the backend server is running on localhost:8000")
    print("3. Test the frontend UI manually for the enhanced features")

if __name__ == "__main__":
    test_meal_plan_features()
