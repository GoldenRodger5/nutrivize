#!/usr/bin/env python3
"""
Debug script for meal suggestions endpoint
"""
import requests
import json
import time
import os

# Backend URL
BASE_URL = "http://localhost:8000"

def authenticate_with_backend():
    """Authenticate using Firebase Auth REST API to get ID token"""
    print("🔐 Authenticating with Firebase...")
    
    try:
        # Firebase Auth REST API
        firebase_api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"
        auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={firebase_api_key}"
        
        # Credentials
        email = "IsaacMineo@gmail.com"
        password = "Buddydog41"
        
        print(f"📧 Signing in as {email}...")
        
        payload = {
            "email": email,
            "password": password,
            "returnSecureToken": True
        }
        
        response = requests.post(auth_url, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            id_token = result['idToken']
            print("✅ Authentication successful!")
            print(f"🎫 Token: {id_token[:50]}...")
            return id_token
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return None
        
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        return None

def test_meal_suggestions_with_auth(token):
    """Test the meal suggestions endpoint with authentication"""
    
    print("🧪 Testing meal suggestions endpoint with auth...")
    
    # Test payload with new parameters
    payload = {
        "meal_type": "lunch",
        "remaining_calories": 500,
        "dietary_preferences": [],
        "allergies": [],
        "prep_time_preference": "quick",
        "main_ingredients": ["chicken", "vegetables"]
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print(f"📤 Sending request to {BASE_URL}/ai/meal-suggestions")
    print(f"📦 Payload: {json.dumps(payload, indent=2)}")
    print(f"🔑 Using Authorization header")
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/ai/meal-suggestions",
            json=payload,
            headers=headers,
            timeout=120  # 120 second timeout for AI response
        )
        end_time = time.time()
        
        print(f"⏱️  Response time: {end_time - start_time:.2f} seconds")
        print(f"📊 Status code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Success!")
            result = response.json()
            print(f"📄 Response: {json.dumps(result, indent=2)}")
            return True, result
        else:
            print(f"❌ Failed with status code: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False, None
            
    except requests.exceptions.Timeout:
        print("⏰ Request timed out after 60 seconds")
        return False, None
    except requests.exceptions.ConnectionError:
        print("🔌 Connection error - is the backend running?")
        return False, None
    except Exception as e:
        print(f"💥 Unexpected error: {e}")
        return False, None

def test_health_endpoint():
    """Test if the backend is responding"""
    print("🏥 Testing backend health...")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"📊 Health check status: {response.status_code}")
        if response.status_code == 200:
            print(f"📄 Health response: {response.json()}")
            return True
        else:
            print(f"📄 Health response: {response.text}")
            return False
    except Exception as e:
        print(f"💥 Health check failed: {e}")
        return False

def test_ai_service_directly():
    """Test the AI service logic directly by importing it"""
    print("🤖 Testing AI service directly...")
    
    try:
        # Add the backend app to the path
        import sys
        sys.path.append('/Users/isaacmineo/Main/projects/nutrivize-v2/backend')
        
        from app.services.ai_service import ai_service
        from app.models.chat import MealSuggestionRequest
        
        # Create a test request
        request = MealSuggestionRequest(
            meal_type="lunch",
            remaining_calories=500,
            dietary_preferences=[],
            allergies=[]
        )
        
        print(f"📦 Testing with request: {request}")
        
        # Test the service directly
        import asyncio
        start_time = time.time()
        result = asyncio.run(ai_service.get_meal_suggestions(request))
        end_time = time.time()
        
        print(f"⏱️  Service response time: {end_time - start_time:.2f} seconds")
        print(f"✅ Direct service call successful!")
        print(f"📄 Result: {result}")
        return True
        
    except Exception as e:
        print(f"💥 Direct service test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔍 Debugging Meal Suggestions Issue")
    print("=" * 50)
    
    # Test 1: Backend health
    health_ok = test_health_endpoint()
    print()
    
    # Test 2: Authenticate and get token
    token = authenticate_with_backend()
    if not token:
        print("❌ Authentication failed - cannot test meal suggestions")
        exit(1)
    print()
    
    # Test 3: Meal suggestions endpoint with auth
    endpoint_ok, result = test_meal_suggestions_with_auth(token)
    print()
    
    # Test 4: Direct AI service test (if endpoint fails)
    if not endpoint_ok:
        print("🔧 Endpoint failed, testing AI service directly...")
        service_ok = test_ai_service_directly()
        print()
    else:
        service_ok = True
        print("✅ Endpoint worked, skipping direct service test")
    
    print("🏁 Test Summary:")
    print(f"   Backend Health: {'✅' if health_ok else '❌'}")
    print(f"   Authentication: {'✅' if token else '❌'}")
    print(f"   Meal Suggestions API: {'✅' if endpoint_ok else '❌'}")
    print(f"   AI Service Direct: {'✅' if service_ok else '❌'}")
    
    if endpoint_ok:
        print("\n🎉 Meal suggestions API is working! The issue might be in the frontend.")
    else:
        print("\n🚨 Meal suggestions API is not working. Check backend logs for errors.")
