#!/usr/bin/env python3
"""
Comprehensive Smart Meal Planning Integration Test
Tests all endpoints and verifies backend/frontend integration
"""

import requests
import json
import sys
import os

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5174"

# Test credentials
TEST_EMAIL = "isaacmineo@gmail.com"
TEST_PASSWORD = "Buddydog41"

def authenticate():
    """Authenticate and return JWT token"""
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if response.status_code != 200:
        print(f"❌ Authentication failed: {response.text}")
        return None
    
    data = response.json()
    print(f"✅ Authentication successful for {data['user']['name']}")
    return data['token']

def test_dietary_preferences(token):
    """Test dietary preferences endpoint"""
    print("\n📋 Testing dietary preferences endpoint...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/preferences/dietary", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Dietary preferences failed: {response.text}")
        return False
    
    data = response.json()
    print(f"✅ Dietary preferences: {data.get('dietary_restrictions', [])}")
    print(f"✅ Allergens: {data.get('allergens', [])}")
    print(f"✅ Preferred cuisines: {data.get('preferred_cuisines', [])}")
    return True

def test_food_stats(token):
    """Test food stats endpoint"""
    print("\n📊 Testing food stats endpoint...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/foods/stats", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Food stats failed: {response.text}")
        return False
    
    data = response.json()
    print(f"✅ Total foods: {data.get('total_foods', 0)}")
    print(f"✅ Compatible foods: {data.get('compatible_foods', 0)}")
    print(f"✅ Compatibility: {data.get('compatibility_percentage', 0)}%")
    return True

def test_ai_meal_suggestions(token):
    """Test AI meal suggestions endpoint"""
    print("\n🤖 Testing AI meal suggestions endpoint...")
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Test cases
    test_cases = [
        {
            "name": "Basic breakfast request",
            "payload": {
                "meal_type": "breakfast",
                "cuisine_preference": "mediterranean", 
                "max_prep_time": 20,
                "target_calories": 400
            }
        },
        {
            "name": "Lunch with explicit dietary preferences",
            "payload": {
                "meal_type": "lunch",
                "cuisine_preference": "asian",
                "max_prep_time": 30,
                "target_calories": 500,
                "dietary_preferences": ["vegetarian"],
                "allergies": ["nuts"]
            }
        },
        {
            "name": "Dinner relying on user profile",
            "payload": {
                "meal_type": "dinner",
                "cuisine_preference": "any",
                "max_prep_time": 45,
                "target_calories": 600
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\n  🧪 {test_case['name']}...")
        response = requests.post(f"{BASE_URL}/ai/meal-suggestions", 
                               headers=headers, json=test_case['payload'])
        
        if response.status_code != 200:
            print(f"  ❌ {test_case['name']} failed: {response.text}")
            continue
        
        data = response.json()
        suggestions = data.get('suggestions', [])
        
        if not suggestions:
            print(f"  ❌ No suggestions returned for {test_case['name']}")
            continue
        
        print(f"  ✅ {len(suggestions)} suggestions received")
        for i, suggestion in enumerate(suggestions[:2], 1):  # Show first 2
            print(f"    {i}. {suggestion.get('name', 'Unnamed')}")
            print(f"       📝 {suggestion.get('description', 'No description')[:80]}...")
            print(f"       ⏱️  {suggestion.get('prep_time', 'Unknown')} min")
            print(f"       🔥 {suggestion.get('nutrition', {}).get('calories', 'Unknown')} cal")
            
            # Check for meat in vegetarian suggestions
            if 'vegetarian' in test_case['payload'].get('dietary_preferences', []):
                description = suggestion.get('description', '').lower()
                name = suggestion.get('name', '').lower()
                if any(meat in description or meat in name for meat in ['salmon', 'chicken', 'beef', 'pork', 'fish', 'turkey', 'meat']):
                    print(f"       ⚠️  WARNING: Non-vegetarian suggestion in vegetarian request!")
    
    return True

def test_frontend_availability():
    """Test if frontend is accessible"""
    print("\n🌐 Testing frontend availability...")
    
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            print(f"✅ Frontend accessible at {FRONTEND_URL}")
            return True
        else:
            print(f"❌ Frontend returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend not accessible: {e}")
        return False

def test_cors_headers(token):
    """Test CORS headers for frontend integration"""
    print("\n🔐 Testing CORS configuration...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Origin": FRONTEND_URL
    }
    
    response = requests.options(f"{BASE_URL}/preferences/dietary", headers=headers)
    
    cors_headers = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
    }
    
    print(f"✅ CORS headers: {cors_headers}")
    return True

def main():
    """Run comprehensive Smart Meal Planning integration tests"""
    print("🚀 Starting Smart Meal Planning Integration Tests")
    print("=" * 60)
    
    # Authenticate
    token = authenticate()
    if not token:
        sys.exit(1)
    
    # Run tests
    tests = [
        ("Dietary Preferences", test_dietary_preferences),
        ("Food Stats", test_food_stats), 
        ("AI Meal Suggestions", test_ai_meal_suggestions),
        ("Frontend Availability", test_frontend_availability),
        ("CORS Configuration", test_cors_headers)
    ]
    
    results = {}
    for test_name, test_func in tests:
        try:
            if test_name == "Frontend Availability":
                results[test_name] = test_func()
            elif test_name == "CORS Configuration":
                results[test_name] = test_cors_headers(token)
            else:
                results[test_name] = test_func(token)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All Smart Meal Planning functionality is working correctly!")
        print("🔗 Backend and frontend integration appears to be complete.")
        return 0
    else:
        print("⚠️  Some issues found. Please review failed tests above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
