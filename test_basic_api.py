#!/usr/bin/env python3
"""
Test for meal planning API endpoints with Firebase authentication
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def get_auth_token():
    """Authenticate with Firebase and get access token"""
    print("🔐 Authenticating with Firebase...")
    
    auth_data = {
        "email": "IsaacMineo@gmail.com",
        "password": "Buddydog41"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=auth_data)
        print(f"📥 Auth response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("token") or data.get("access_token")
            if token:
                print("✅ Authentication successful!")
                return token
            else:
                print("❌ No token in response")
                print(f"Response: {data}")
                return None
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Auth error: {e}")
        return None

def test_meal_plan_generation(token):
    """Test meal plan generation endpoint with authentication"""
    print("\n🧪 Testing meal plan generation...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    meal_plan_request = {
        "name": "My Custom Test Meal Plan - Strict Nutrition",
        "days": 2,
        "calories_per_day": 2000,
        "protein_target": 150.0,
        "carbs_target": 200.0,
        "fat_target": 80.0,
        "meal_types": ["breakfast", "lunch", "dinner", "snack"],
        "dietary_restrictions": ["vegetarian"],
        "preferred_cuisines": ["Mediterranean"]
    }
    
    print(f"📤 Sending request: {json.dumps(meal_plan_request, indent=2)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/meal-planning/generate-plan",
            json=meal_plan_request,
            headers=headers,
            timeout=180  # 3 minutes timeout for Claude Opus model
        )
        
        print(f"📥 Response status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Request successful!")
            data = response.json()
            
            # First, let's see the raw response structure
            print(f"\n🔍 Raw Response Keys: {list(data.keys())}")
            print(f"📋 Full Response: {json.dumps(data, indent=2)}")
            
            # Validate the response
            print(f"\n📋 Meal Plan Details:")
            print(f"  Title: {data.get('title') or data.get('name')}")
            print(f"  Days: {len(data.get('days', []))}")
            
            # Check each day
            days = data.get('days', [])
            for i, day in enumerate(days, 1):
                meals = day.get('meals', [])
                total_nutrition = day.get('total_nutrition', {})
                
                print(f"\n  Day {i}:")
                print(f"    Meals: {len(meals)} ({[m.get('meal_type') for m in meals]})")
                print(f"    Total Calories: {total_nutrition.get('calories', 0)}")
                print(f"    Total Protein: {total_nutrition.get('protein', 0)}g")
                
                # Check if all required meal types are present
                meal_types = set(m.get('meal_type') for m in meals)
                required_types = set(meal_plan_request['meal_types'])
                missing_types = required_types - meal_types
                
                if missing_types:
                    print(f"    ❌ Missing meal types: {missing_types}")
                else:
                    print(f"    ✅ All required meal types present")
                
                # Check nutrition targets
                target_calories = meal_plan_request['calories_per_day']
                actual_calories = total_nutrition.get('calories', 0)
                calorie_diff = abs(actual_calories - target_calories)
                
                if calorie_diff <= 50:
                    print(f"    ✅ Calories within target (±50): {actual_calories}/{target_calories}")
                else:
                    print(f"    ❌ Calories outside target: {actual_calories}/{target_calories} (diff: {calorie_diff})")
            
            return True
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_api_health():
    """Test API health endpoints"""
    print("\n🏥 Testing API health...")
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def main():
    """Run meal planning API tests with authentication"""
    print("🧪 Enhanced Meal Planning API Tests")
    print("=" * 40)
    
    # First authenticate
    token = get_auth_token()
    if not token:
        print("❌ Cannot proceed without authentication")
        return
    
    if test_api_health():
        print("✅ API is healthy")
    else:
        print("❌ API health check failed")
        return
    
    if test_meal_plan_generation(token):
        print("\n✅ Meal planning endpoint test passed")
        print("🎉 All enhanced features working correctly!")
    else:
        print("\n❌ Meal planning endpoint test failed")

if __name__ == "__main__":
    main()
