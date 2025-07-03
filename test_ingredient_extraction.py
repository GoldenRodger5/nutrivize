#!/usr/bin/env python3
"""
Test script to verify ingredient extraction from meal descriptions
"""

import requests
import json

def test_ingredient_extraction():
    """Test the ingredient extraction endpoint"""
    
    print("🧪 Testing Ingredient Extraction...")
    
    # Authenticate first using Firebase
    firebase_auth_url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
    api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"
    
    auth_payload = {
        "email": "IsaacMineo@gmail.com",
        "password": "Buddydog41",
        "returnSecureToken": True
    }
    
    auth_response = requests.post(f"{firebase_auth_url}?key={api_key}", json=auth_payload)
    
    if auth_response.status_code != 200:
        print(f"❌ Auth failed: {auth_response.status_code}")
        return
    
    token = auth_response.json().get("idToken")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test cases
    test_meals = [
        {"meal_name": "Oatmeal with berries", "portion_size": "1 serving"},
        {"meal_name": "Quinoa salad with vegetables", "portion_size": "1 serving"},
        {"meal_name": "Vegetable stir-fry with tofu", "portion_size": "1 serving"}
    ]
    
    for i, meal_data in enumerate(test_meals, 1):
        print(f"\n🍽️ Test {i}: Extracting ingredients for '{meal_data['meal_name']}'...")
        
        try:
            response = requests.post(
                "http://localhost:8000/meal-planning/extract-ingredients",
                headers=headers,
                json=meal_data
            )
            
            if response.status_code == 200:
                data = response.json()
                ingredients = data.get("ingredients", [])
                print(f"✅ Extracted {len(ingredients)} ingredients:")
                
                for j, ingredient in enumerate(ingredients[:5], 1):  # Show first 5
                    print(f"  {j}. {ingredient.get('name', 'Unknown')} - {ingredient.get('amount', 0)} {ingredient.get('unit', 'unit')}")
                    print(f"     Nutrition: {ingredient.get('calories', 0)} cal, {ingredient.get('protein', 0)}g protein")
                
                if len(ingredients) > 5:
                    print(f"  ... and {len(ingredients) - 5} more ingredients")
                    
            else:
                print(f"❌ Failed: {response.status_code}")
                print(f"Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {e}")

    print(f"\n🎯 Summary: Ingredient extraction endpoint tested for {len(test_meals)} meals")

if __name__ == "__main__":
    test_ingredient_extraction()
