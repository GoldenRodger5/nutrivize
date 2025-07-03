#!/usr/bin/env python3
"""
Simple test to check the actual API response format
"""

import requests
import json

def test_shopping_list_response():
    """Test to see the actual API response format"""
    
    # Authenticate
    firebase_auth_url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
    api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"
    
    auth_payload = {
        "email": "IsaacMineo@gmail.com",
        "password": "Buddydog41",
        "returnSecureToken": True
    }
    
    auth_response = requests.post(f"{firebase_auth_url}?key={api_key}", json=auth_payload)
    token = auth_response.json().get("idToken")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get shopping list
    response = requests.post(
        "http://localhost:8000/meal-planning/plans/mp_veg_med_wl_2024/shopping-list",
        headers=headers,
        json={}
    )
    
    if response.status_code == 200:
        data = response.json()
        print("📋 Raw API Response:")
        print(json.dumps(data, indent=2)[:1000] + "...")
        
        print(f"\n💰 Total cost: ${data.get('total_estimated_cost', 0):.2f}")
        print(f"📝 Items count: {len(data.get('items', []))}")
        
        # Check first few items
        items = data.get('items', [])
        if items:
            print("\n🛒 First 3 items:")
            for i in range(min(3, len(items))):
                item = items[i]
                print(f"  {i+1}. {item.get('name')} - ${item.get('estimated_price', 0):.2f}")
    else:
        print(f"❌ API Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_shopping_list_response()
