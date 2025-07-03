#!/usr/bin/env python3
"""
Debug script to check what's actually in the food database
"""

import requests
import json

def debug_food_database():
    """Debug what's actually in the food database"""
    
    print("🔍 Debugging Food Database...")
    
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
    
    # Test specific food searches
    test_foods = ["chicken", "broccoli", "salmon", "rice", "apple", "beef"]
    
    for food_name in test_foods:
        print(f"\n🔍 Searching for: {food_name}")
        try:
            search_response = requests.get(
                f"http://localhost:8000/foods/search?q={food_name}&limit=3",
                headers=headers
            )
            
            if search_response.status_code == 200:
                foods = search_response.json()
                print(f"   Found {len(foods)} results")
                
                for i, food in enumerate(foods[:2]):  # Show first 2 results
                    print(f"   {i+1}. {food.get('name', 'Unknown')}")
                    print(f"      ID: {food.get('id', 'N/A')}")
                    print(f"      Calories: {food.get('calories', 'N/A')}")
                    print(f"      Protein: {food.get('proteins', 'N/A')}g")
                    print(f"      Carbs: {food.get('carbs', 'N/A')}g") 
                    print(f"      Fat: {food.get('fats', 'N/A')}g")
                    print(f"      All fields: {list(food.keys())}")
                    print()
            else:
                print(f"   ❌ Search failed: {search_response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    debug_food_database()
