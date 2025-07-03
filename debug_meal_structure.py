#!/usr/bin/env python3
"""
Debug script to check the actual meal plan structure and see what we're working with
"""

import requests
import json

def debug_meal_structure():
    """Debug the actual meal plan structure"""
    
    print("🔍 Debugging Meal Plan Structure...")
    
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
    
    # Get meal plan
    plan_id = "b7702dcd-4d11-49a4-a288-fe26d12a037d"
    plan_response = requests.get(
        f"http://localhost:8000/meal-planning/plans/{plan_id}",
        headers=headers
    )
    
    if plan_response.status_code == 200:
        plan_data = plan_response.json()
        
        print(f"📋 Plan: {plan_data.get('title', 'Unnamed')}")
        print(f"🎯 Target Nutrition: {plan_data.get('target_nutrition', {})}")
        
        # Calculate average daily calories
        if plan_data.get('days'):
            total_calories = sum(day.get('total_nutrition', {}).get('calories', 0) for day in plan_data['days'])
            avg_calories = total_calories / len(plan_data['days']) if plan_data['days'] else 0
            print(f"📊 Average Daily Calories: {avg_calories:.0f}")
            
            # Show structure of first meal
            first_day = plan_data['days'][0] if plan_data['days'] else {}
            first_meal = first_day.get('meals', [{}])[0] if first_day.get('meals') else {}
            
            print(f"\n🍽️ First Meal Structure:")
            print(f"  Name: {first_meal.get('food_name', 'N/A')}")
            print(f"  Type: {first_meal.get('meal_type', 'N/A')}")
            print(f"  Calories: {first_meal.get('calories', 0)}")
            print(f"  Has ingredients: {'ingredients' in first_meal}")
            
            if 'ingredients' in first_meal and first_meal['ingredients']:
                print(f"  Ingredients count: {len(first_meal['ingredients'])}")
                print(f"  Sample ingredient: {first_meal['ingredients'][0]}")
            else:
                print("  No detailed ingredients found")
                print(f"  Available fields: {list(first_meal.keys())}")
        
    else:
        print(f"❌ Failed to get meal plan: {plan_response.status_code}")
        print(plan_response.text)

if __name__ == "__main__":
    debug_meal_structure()
