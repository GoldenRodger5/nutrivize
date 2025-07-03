#!/usr/bin/env python3
"""
Test the meal suggestions from the frontend's perspective
"""
import requests
import json
import time

# Simulate frontend request
def test_frontend_meal_suggestions():
    print("🧪 Testing Meal Suggestions from Frontend Perspective")
    print("=" * 60)
    
    # Get auth token first
    firebase_api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"
    auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={firebase_api_key}"
    
    auth_payload = {
        "email": "IsaacMineo@gmail.com",
        "password": "Buddydog41",
        "returnSecureToken": True
    }
    
    auth_response = requests.post(auth_url, json=auth_payload)
    token = auth_response.json()['idToken']
    
    # Test different meal suggestion scenarios
    test_cases = [
        {
            "name": "Basic Lunch Request",
            "payload": {
                "meal_type": "lunch",
                "remaining_calories": 500,
                "dietary_preferences": [],
                "allergies": []
            }
        },
        {
            "name": "Vegetarian Dinner",
            "payload": {
                "meal_type": "dinner",
                "remaining_calories": 600,
                "dietary_preferences": ["vegetarian"],
                "allergies": []
            }
        },
        {
            "name": "Keto Breakfast",
            "payload": {
                "meal_type": "breakfast",
                "remaining_calories": 400,
                "dietary_preferences": ["keto"],
                "allergies": []
            }
        }
    ]
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test Case {i}: {test_case['name']}")
        print(f"📦 Payload: {json.dumps(test_case['payload'], indent=2)}")
        
        try:
            start_time = time.time()
            response = requests.post(
                "http://localhost:8000/ai/meal-suggestions",
                json=test_case['payload'],
                headers=headers,
                timeout=60
            )
            end_time = time.time()
            
            if response.status_code == 200:
                result = response.json()
                suggestions_count = len(result.get('suggestions', []))
                print(f"✅ Success! Got {suggestions_count} suggestions in {end_time - start_time:.1f}s")
                
                # Show first suggestion summary
                if suggestions_count > 0:
                    first_suggestion = result['suggestions'][0]
                    print(f"   📝 First suggestion: {first_suggestion['name']}")
                    print(f"   🍽️  Calories: {first_suggestion['nutrition']['calories']}")
                    print(f"   🥩 Protein: {first_suggestion['nutrition']['protein']}g")
            else:
                print(f"❌ Failed: {response.status_code} - {response.text}")
                
        except requests.exceptions.Timeout:
            print("⏰ Request timed out")
        except Exception as e:
            print(f"💥 Error: {e}")
    
    print(f"\n🏁 Frontend Testing Complete!")
    print("\nℹ️  To test in the actual UI:")
    print("   1. Go to http://localhost:5173")
    print("   2. Login with IsaacMineo@gmail.com / Buddydog41")
    print("   3. Navigate to 'Meal Suggestions' page")
    print("   4. Try generating suggestions with different filters")

if __name__ == "__main__":
    test_frontend_meal_suggestions()
