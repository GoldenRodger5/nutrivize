#!/usr/bin/env python3
"""
Test script to verify disliked food detection and AI integration
"""

import requests
import json
from typing import Dict, Any

# Configuration
EMAIL = "IsaacMineo@gmail.com"
PASSWORD = "Buddydog41"
API_BASE_URL = "http://localhost:8000"

def authenticate() -> str:
    """Authenticate with Firebase and get token"""
    print("🔐 Authenticating with Firebase...")
    
    firebase_api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"
    auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={firebase_api_key}"
    
    auth_data = {
        "email": EMAIL,
        "password": PASSWORD,
        "returnSecureToken": True
    }
    
    try:
        response = requests.post(auth_url, json=auth_data)
        response.raise_for_status()
        auth_result = response.json()
        
        token = auth_result.get('idToken')
        if not token:
            print("❌ Failed to get auth token")
            return None
            
        print("✅ Successfully authenticated with Firebase")
        return token
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Firebase authentication failed: {e}")
        return None

def test_disliked_foods_api(token: str):
    """Test the disliked foods API endpoints"""
    print("\n🧪 Testing Disliked Foods API...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test getting current disliked foods
    print("📡 Getting current disliked foods...")
    response = requests.get(f"{API_BASE_URL}/preferences/disliked-foods", headers=headers)
    if response.status_code == 200:
        current_foods = response.json()
        print(f"✅ Current disliked foods: {current_foods['disliked_foods']}")
    else:
        print(f"❌ Failed to get disliked foods: {response.text}")
        return
    
    # Test adding a disliked food
    print("➕ Adding 'shrimp' to disliked foods...")
    add_data = {"food_name": "shrimp"}
    response = requests.post(f"{API_BASE_URL}/preferences/disliked-foods/add", 
                           headers=headers, json=add_data)
    if response.status_code == 200:
        result = response.json()
        print(f"✅ {result['message']}")
        print(f"📋 Updated list: {result['disliked_foods']}")
    else:
        print(f"❌ Failed to add disliked food: {response.text}")
        return
    
    # Test AI chat with disliked food mention
    print("\n🤖 Testing AI chat with disliked food mention...")
    chat_data = {
        "message": "I really don't like mushrooms and I hate cilantro. Can you suggest a meal without those?",
        "context": {
            "current_page": "chat",
            "user_intent": "meal_suggestion"
        },
        "conversation_history": []
    }
    
    response = requests.post(f"{API_BASE_URL}/ai/chat", headers=headers, json=chat_data)
    if response.status_code == 200:
        chat_result = response.json()
        print(f"✅ AI Response: {chat_result.get('message', 'No message')[:100]}...")
        print(f"📝 Context: {chat_result.get('context', {})}")
    else:
        print(f"❌ AI chat failed: {response.text}")
    
    # Check if foods were automatically added
    print("\n🔍 Checking if foods were auto-detected...")
    response = requests.get(f"{API_BASE_URL}/preferences/disliked-foods", headers=headers)
    if response.status_code == 200:
        updated_foods = response.json()
        print(f"✅ Final disliked foods list: {updated_foods['disliked_foods']}")
        
        # Check if mushrooms and cilantro were added
        foods_list = [food.lower() for food in updated_foods['disliked_foods']]
        if 'mushrooms' in foods_list:
            print("🎯 ✅ Mushrooms auto-detected and added!")
        else:
            print("🎯 ❌ Mushrooms not auto-detected")
            
        if 'cilantro' in foods_list:
            print("🎯 ✅ Cilantro auto-detected and added!")
        else:
            print("🎯 ❌ Cilantro not auto-detected")
    else:
        print(f"❌ Failed to check updated foods: {response.text}")

def test_meal_planning_exclusion(token: str):
    """Test that disliked foods are excluded from meal planning"""
    print("\n🍽️ Testing meal planning exclusion...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    meal_plan_data = {
        "duration": 1,  # 1 day
        "meals_per_day": 3,
        "budget": "moderate",
        "prep_time": "moderate",
        "variety": "high",
        "special_requests": "healthy meals"
    }
    
    response = requests.post(f"{API_BASE_URL}/meal-planning/quick-generate", 
                           headers=headers, json=meal_plan_data)
    
    if response.status_code == 200:
        meal_plan = response.json()
        print("✅ Meal plan generated successfully")
        
        # Check if disliked foods appear in the meal plan
        meal_text = json.dumps(meal_plan).lower()
        
        disliked_found = []
        common_disliked = ['shrimp', 'mushrooms', 'cilantro']
        
        for food in common_disliked:
            if food in meal_text:
                disliked_found.append(food)
        
        if disliked_found:
            print(f"⚠️ Found disliked foods in meal plan: {disliked_found}")
        else:
            print("✅ No disliked foods found in meal plan - exclusion working!")
            
    else:
        print(f"❌ Meal planning failed: {response.text}")

def main():
    """Main test function"""
    print("🚀 Testing Disliked Foods Integration")
    print(f"👤 User: {EMAIL}")
    print(f"🌐 API: {API_BASE_URL}")
    
    # Authenticate
    token = authenticate()
    if not token:
        print("❌ Authentication failed. Cannot proceed.")
        return
    
    # Test disliked foods API
    test_disliked_foods_api(token)
    
    # Test meal planning exclusion
    test_meal_planning_exclusion(token)
    
    print("\n🎯 TESTING COMPLETE!")

if __name__ == "__main__":
    main()
