#!/usr/bin/env python3
"""
Test script to debug the shopping list AI pricing issue
"""

import requests
import json

def test_shopping_list_generation():
    """Test the shopping list generation endpoint to see AI pricing debug output"""
    
    print("🛒 Testing Shopping List Generation...")
    
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
        print(auth_response.text)
        return
    
    token = auth_response.json().get("idToken")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test shopping list generation
    print("🛒 Generating shopping list for meal plan...")
    
    shopping_response = requests.post(
        "http://localhost:8000/meal-planning/plans/mp_20241230_3000cal_wl/shopping-list",
        headers=headers,
        json={}
    )
    
    print(f"Status: {shopping_response.status_code}")
    if shopping_response.status_code == 200:
        try:
            data = shopping_response.json()
            print("✅ Shopping list generated successfully!")
            print(f"📝 Items count: {len(data.get('items', []))}")
            print(f"💰 Total cost: ${data.get('total_estimated_cost', 0):.2f}")
            
            # Show first few items
            items = data.get('items', [])
            if items:
                print("\n📋 Sample items:")
                for i, item in enumerate(items[:3]):
                    print(f"  {i+1}. {item.get('name', 'Unknown')} - ${item.get('estimated_price', 0):.2f}")
            
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse response JSON: {e}")
            print(f"Response text: {shopping_response.text[:500]}...")
    else:
        print(f"❌ Failed: {shopping_response.text}")

if __name__ == "__main__":
    test_shopping_list_generation()
