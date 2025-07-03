#!/usr/bin/env python3
"""
Test specific scenarios for new parameters
"""
import requests
import json

# Backend URL
BASE_URL = "http://localhost:8000"

def get_auth_token():
    """Get Firebase auth token"""
    firebase_api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"
    auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={firebase_api_key}"
    
    payload = {
        "email": "IsaacMineo@gmail.com",
        "password": "Buddydog41",
        "returnSecureToken": True
    }
    
    response = requests.post(auth_url, json=payload)
    if response.status_code == 200:
        return response.json()['idToken']
    return None

def test_scenario(name, payload):
    """Test a specific scenario"""
    print(f"\n🧪 Testing: {name}")
    print(f"📦 Payload: {json.dumps(payload, indent=2)}")
    
    token = get_auth_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/ai/meal-suggestions", json=payload, headers=headers, timeout=60)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Got {len(result['suggestions'])} suggestions")
            for i, suggestion in enumerate(result['suggestions'], 1):
                print(f"   {i}. {suggestion['name']} ({suggestion['prep_time']} min)")
                # Check if main ingredients are included
                if payload.get('main_ingredients'):
                    ingredients_text = ' '.join([ing['name'].lower() for ing in suggestion['ingredients']])
                    for main_ing in payload['main_ingredients']:
                        if main_ing.lower() in ingredients_text:
                            print(f"      ✅ Contains {main_ing}")
                        else:
                            print(f"      ❌ Missing {main_ing}")
            return True
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"💥 Error: {e}")
        return False

if __name__ == "__main__":
    print("🔬 Testing New Parameters")
    print("=" * 50)
    
    # Test 1: Quick prep with chicken
    test_scenario("Quick prep with chicken", {
        "meal_type": "lunch", 
        "remaining_calories": 400,
        "prep_time_preference": "quick",
        "main_ingredients": ["chicken"]
    })
    
    # Test 2: Complex prep with salmon
    test_scenario("Complex prep with salmon and rice", {
        "meal_type": "dinner",
        "remaining_calories": 600, 
        "prep_time_preference": "complex",
        "main_ingredients": ["salmon", "rice"]
    })
    
    # Test 3: Moderate prep with eggs and vegetables
    test_scenario("Moderate prep with eggs and vegetables", {
        "meal_type": "breakfast",
        "remaining_calories": 350,
        "prep_time_preference": "moderate", 
        "main_ingredients": ["eggs", "vegetables"]
    })
    
    # Test 4: No preferences (should work like before)
    test_scenario("No new preferences (backward compatibility)", {
        "meal_type": "snack",
        "remaining_calories": 200,
        "dietary_preferences": ["vegetarian"]
    })
