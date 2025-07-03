#!/usr/bin/env python3
"""
Test the meal suggestion endpoint with proper Firebase authentication
Using: IsaacMineo@gmail.com / Buddydog41
"""

import requests
import json
import sys
import os
from datetime import datetime

# Add the app directory to Python path
sys.path.append('/Users/isaacmineo/Main/projects/nutrivize-v2/backend/app')

def get_firebase_id_token():
    """Get Firebase ID token for IsaacMineo@gmail.com"""
    import pyrebase
    
    # Firebase config (from frontend .env)
    firebase_config = {
        "apiKey": "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks",
        "authDomain": "food-tracker-6096d.firebaseapp.com",
        "databaseURL": "https://food-tracker-6096d-default-rtdb.firebaseio.com",
        "projectId": "food-tracker-6096d",
        "storageBucket": "food-tracker-6096d.firebasestorage.app",
        "messagingSenderId": "215135700985",
        "appId": "1:215135700985:web:bfb71581010bcaab6c5f28"
    }
    
    firebase = pyrebase.initialize_app(firebase_config)
    auth = firebase.auth()
    
    try:
        # Sign in with email and password
        user = auth.sign_in_with_email_and_password("IsaacMineo@gmail.com", "Buddydog41")
        return user['idToken']
    except Exception as e:
        print(f"Firebase auth error: {e}")
        return None

def test_meal_suggestion_endpoint():
    """Test the meal suggestion endpoint with proper auth"""
    
    # Get Firebase ID token
    print("Getting Firebase ID token for IsaacMineo@gmail.com...")
    id_token = get_firebase_id_token()
    
    if not id_token:
        print("❌ Failed to get Firebase ID token")
        return False
    
    print("✅ Got Firebase ID token")
    
    # Test the meal suggestion endpoint
    url = "http://localhost:8000/ai/meal-suggestions"
    headers = {
        "Authorization": f"Bearer {id_token}",
        "Content-Type": "application/json"
    }
    
    # Use the correct request format
    data = {
        "meal_type": "dinner",
        "remaining_calories": 800,
        "remaining_protein": 30,
        "remaining_carbs": 50,
        "remaining_fat": 20,
        "dietary_preferences": [],
        "allergies": []
    }
    
    print(f"\n🧪 Testing meal suggestion endpoint...")
    print(f"URL: {url}")
    print(f"Meal Type: {data['meal_type']}")
    print(f"Remaining Calories: {data['remaining_calories']}")
    print(f"Headers: Authorization Bearer [TOKEN], Content-Type: application/json")
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=60)
        
        print(f"\n📡 Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ SUCCESS! Meal suggestions received:")
            print(f"Number of suggestions: {len(result.get('suggestions', []))}")
            
            for i, suggestion in enumerate(result.get('suggestions', []), 1):
                print(f"\n{i}. {suggestion.get('name', 'Unnamed')}")
                print(f"   Description: {suggestion.get('description', 'No description')}")
                
                nutrition = suggestion.get('nutrition', {})
                print(f"   Nutrition: {nutrition.get('calories', 'N/A')} cal, "
                      f"{nutrition.get('protein', 'N/A')}g protein, "
                      f"{nutrition.get('carbs', 'N/A')}g carbs, "
                      f"{nutrition.get('fat', 'N/A')}g fat")
                
                print(f"   Prep Time: {suggestion.get('prep_time', 'Not specified')} min")
                
                if suggestion.get('ingredients'):
                    print(f"   Ingredients: {', '.join([ing.get('name', 'Unknown') for ing in suggestion['ingredients'][:5]])}...")
                
                if suggestion.get('instructions'):
                    print(f"   Instructions: {len(suggestion['instructions'])} steps")
            
            return True
        else:
            print(f"\n❌ FAILED! Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    print("🔥 Testing Meal Suggestion Endpoint with Firebase Auth")
    print("=" * 60)
    
    # Install pyrebase if needed
    try:
        import pyrebase
    except ImportError:
        print("Installing pyrebase...")
        os.system("pip install pyrebase4")
        import pyrebase
    
    success = test_meal_suggestion_endpoint()
    
    if success:
        print("\n🎉 All tests passed! Meal suggestion endpoint working with Firebase auth.")
    else:
        print("\n💥 Tests failed. Check the backend server and Firebase configuration.")
