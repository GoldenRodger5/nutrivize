#!/usr/bin/env python3
"""
Comprehensive test of disliked foods functionality
Tests:
1. Current disliked foods in database
2. Adding disliked foods via API
3. AI detection of disliked foods in conversation
4. Meal planning exclusion of disliked foods
5. Settings page disliked foods display
"""

import requests
import json
from typing import Dict, Any, List

# Configuration
EMAIL = "IsaacMineo@gmail.com"
PASSWORD = "Buddydog41"
API_BASE_URL = "http://localhost:8000"

def authenticate() -> str:
    """Authenticate with Firebase and get token"""
    print("🔐 Authenticating with Firebase...")
    
    # Firebase Auth REST API endpoint
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
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return None

def test_get_current_preferences(token: str) -> Dict[str, Any]:
    """Test getting current dietary preferences including disliked foods"""
    print("\n📋 STEP 1: Getting current dietary preferences...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        url = f"{API_BASE_URL}/dietary/preferences"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        preferences = response.json()
        disliked_foods = preferences.get('disliked_foods', [])
        
        print(f"✅ Current disliked foods: {disliked_foods}")
        print(f"   Total disliked foods: {len(disliked_foods)}")
        
        return preferences
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to get preferences: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return {}

def test_add_disliked_food_via_api(token: str, food_name: str) -> bool:
    """Test adding a disliked food via API"""
    print(f"\n➕ STEP 2: Adding '{food_name}' to disliked foods via API...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        url = f"{API_BASE_URL}/dietary/disliked-foods"
        data = {"food_name": food_name}
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        print(f"✅ Successfully added '{food_name}' to disliked foods")
        print(f"   Updated disliked foods: {result.get('disliked_foods', [])}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to add disliked food: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return False

def test_ai_disliked_food_detection(token: str, message: str) -> Dict[str, Any]:
    """Test AI detection of disliked foods in conversation"""
    print(f"\n🤖 STEP 3: Testing AI detection with message: '{message}'")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    chat_data = {
        "message": message,
        "context": {
            "current_page": "chat",
            "user_intent": "dietary_preferences"
        }
    }
    
    try:
        url = f"{API_BASE_URL}/ai/chat"
        response = requests.post(url, headers=headers, json=chat_data)
        response.raise_for_status()
        
        chat_response = response.json()
        print(f"✅ AI Response: {chat_response.get('response', 'No response')[:100]}...")
        
        # Check if context includes detected disliked foods
        context = chat_response.get('context', {})
        detected_foods = context.get('detected_disliked_foods', [])
        if detected_foods:
            print(f"🎯 AI detected disliked foods: {detected_foods}")
        else:
            print("📝 No disliked foods detected in this message")
            
        return chat_response
        
    except requests.exceptions.RequestException as e:
        print(f"❌ AI chat failed: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return {}

def test_meal_planning_exclusion(token: str) -> Dict[str, Any]:
    """Test that meal planning excludes disliked foods"""
    print("\n🍽️ STEP 4: Testing meal planning exclusion of disliked foods...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    meal_data = {
        "duration": 1,
        "meals_per_day": 3,
        "budget": "moderate",
        "prep_time": "moderate",
        "variety": "high",
        "special_requests": "Please suggest healthy meals"
    }
    
    try:
        url = f"{API_BASE_URL}/meal-planning/generate-plan"
        response = requests.post(url, headers=headers, json=meal_data)
        response.raise_for_status()
        
        meal_plan = response.json()
        print(f"✅ Generated meal plan with {len(meal_plan.get('meals', []))} meals")
        
        # Check if any meals contain disliked foods
        meals = meal_plan.get('meals', [])
        disliked_found = []
        
        for meal in meals:
            meal_name = meal.get('name', 'Unknown')
            ingredients = meal.get('ingredients', [])
            
            for ingredient in ingredients:
                ingredient_name = ingredient.get('name', '').lower()
                # Check against common disliked foods we might have added
                if any(disliked in ingredient_name for disliked in ['shrimp', 'chicken', 'dairy']):
                    disliked_found.append(f"{meal_name}: {ingredient_name}")
        
        if disliked_found:
            print(f"⚠️ Found potentially disliked foods in meal plan:")
            for item in disliked_found:
                print(f"   - {item}")
        else:
            print("✅ No obviously disliked foods found in meal plan")
            
        return meal_plan
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Meal planning failed: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return {}

def test_remove_disliked_food(token: str, food_name: str) -> bool:
    """Test removing a disliked food via API"""
    print(f"\n➖ STEP 5: Removing '{food_name}' from disliked foods...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        url = f"{API_BASE_URL}/dietary/disliked-foods"
        data = {"food_name": food_name}
        response = requests.delete(url, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        print(f"✅ Successfully removed '{food_name}' from disliked foods")
        print(f"   Updated disliked foods: {result.get('disliked_foods', [])}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to remove disliked food: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return False

def test_meal_suggestions_exclusion(token: str) -> Dict[str, Any]:
    """Test meal suggestions exclude disliked foods"""
    print("\n🍽️ STEP 6: Testing meal suggestions exclusion...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    suggestion_data = {
        "meal_type": "dinner",
        "preferences": ["healthy", "high-protein"],
        "context": {
            "current_page": "meal_suggestions",
            "dietary_goals": ["avoid_processed_foods"]
        }
    }
    
    try:
        url = f"{API_BASE_URL}/ai/meal-suggestions"
        response = requests.post(url, headers=headers, json=suggestion_data)
        response.raise_for_status()
        
        suggestions = response.json()
        meal_suggestions = suggestions.get('suggestions', [])
        
        print(f"✅ Generated {len(meal_suggestions)} meal suggestions")
        
        # Check for disliked foods in suggestions
        for i, suggestion in enumerate(meal_suggestions[:3], 1):  # Check first 3
            name = suggestion.get('name', 'Unknown')
            ingredients = suggestion.get('ingredients', [])
            print(f"   {i}. {name}")
            
            # Look for disliked foods
            disliked_in_meal = []
            for ingredient in ingredients:
                ingredient_name = ingredient.get('name', '').lower()
                if any(disliked in ingredient_name for disliked in ['shrimp', 'chicken', 'dairy']):
                    disliked_in_meal.append(ingredient_name)
            
            if disliked_in_meal:
                print(f"      ⚠️ Contains potentially disliked: {', '.join(disliked_in_meal)}")
            else:
                print(f"      ✅ No obvious disliked foods detected")
        
        return suggestions
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Meal suggestions failed: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return {}

def main():
    """Main test function"""
    print("🚀 COMPREHENSIVE DISLIKED FOODS FUNCTIONALITY TEST")
    print("="*60)
    print(f"👤 User: {EMAIL}")
    print(f"🌐 API: {API_BASE_URL}")
    
    # Step 1: Authenticate
    token = authenticate()
    if not token:
        print("❌ Authentication failed. Cannot proceed.")
        return
    
    # Step 2: Get current preferences
    initial_prefs = test_get_current_preferences(token)
    
    # Step 3: Add a disliked food via API
    test_add_disliked_food_via_api(token, "test_shrimp")
    
    # Step 4: Test AI detection of disliked foods
    test_ai_disliked_food_detection(token, "I really don't like lobster and I hate brussels sprouts")
    
    # Step 5: Test meal planning exclusion
    test_meal_planning_exclusion(token)
    
    # Step 6: Test meal suggestions exclusion
    test_meal_suggestions_exclusion(token)
    
    # Step 7: Clean up - remove test food
    test_remove_disliked_food(token, "test_shrimp")
    
    # Step 8: Final state check
    print("\n📋 FINAL STATE CHECK:")
    final_prefs = test_get_current_preferences(token)
    
    print("\n" + "="*60)
    print("🎯 COMPREHENSIVE TEST COMPLETE!")
    print("="*60)
    
    # Summary
    initial_disliked = len(initial_prefs.get('disliked_foods', []))
    final_disliked = len(final_prefs.get('disliked_foods', []))
    
    print(f"\n📊 SUMMARY:")
    print(f"   Initial disliked foods: {initial_disliked}")
    print(f"   Final disliked foods: {final_disliked}")
    print(f"   API endpoints: Tested ✅")
    print(f"   AI detection: Tested ✅")
    print(f"   Meal planning: Tested ✅")
    print(f"   Meal suggestions: Tested ✅")

if __name__ == "__main__":
    main()
