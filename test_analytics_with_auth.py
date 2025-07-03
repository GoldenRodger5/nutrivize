#!/usr/bin/env python3

import requests
import json
import sys

def get_firebase_auth_token(email, password):
    """Get Firebase auth token"""
    firebase_auth_url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
    
    # Firebase API key from the frontend .env file
    api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"
    
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }
    
    try:
        response = requests.post(f"{firebase_auth_url}?key={api_key}", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            return data.get("idToken")
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Auth request failed: {e}")
        return None

def test_analytics_with_auth():
    """Test analytics endpoints with authentication"""
    
    print("🔐 Authenticating with Firebase...")
    
    # Get auth token
    email = "IsaacMineo@gmail.com"
    password = "Buddydog41"
    
    auth_token = get_firebase_auth_token(email, password)
    
    if not auth_token:
        print("❌ Could not get auth token. Let's try testing local auth endpoint instead...")
        
        # Try local backend auth endpoint if available
        local_auth_url = "http://localhost:8000/auth/login"
        try:
            auth_payload = {"email": email, "password": password}
            auth_response = requests.post(local_auth_url, json=auth_payload)
            
            if auth_response.status_code == 200:
                auth_data = auth_response.json()
                auth_token = auth_data.get("access_token") or auth_data.get("token")
                print("✅ Got auth token from local backend")
            else:
                print(f"❌ Local auth failed: {auth_response.status_code}")
                print("Trying to test endpoints anyway to see error responses...")
                auth_token = None
                
        except Exception as e:
            print(f"❌ Local auth request failed: {e}")
            auth_token = None
    else:
        print("✅ Got Firebase auth token")
    
    # Set up headers
    headers = {}
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    
    BASE_URL = "http://localhost:8000"
    
    endpoints = [
        "/analytics/insights?timeframe=week",
        "/analytics/nutrition-trends?days=7", 
        "/analytics/food-patterns?days=7",
        "/analytics/macro-breakdown?timeframe=week",
        "/analytics/goal-progress"
    ]
    
    print("\n🧪 Testing Analytics Endpoints with Authentication...")
    print("=" * 60)
    
    for endpoint in endpoints:
        try:
            url = f"{BASE_URL}{endpoint}"
            print(f"\n📍 Testing: {endpoint}")
            
            response = requests.get(url, headers=headers)
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ Success!")
                # Try to parse JSON to check for serialization issues
                try:
                    data = response.json()
                    print(f"✅ Response is valid JSON")
                    
                    # Print some key info about the response
                    if "insights" in data:
                        insights_count = len(data.get("insights", []))
                        print(f"📊 Found {insights_count} insights")
                    
                    if "trends" in data:
                        trends_count = len(data.get("trends", []))
                        print(f"📈 Found {trends_count} trends")
                        
                    if "statistics" in data:
                        print(f"📈 Statistics available")
                        
                    if "charts" in data:
                        charts_count = len(data.get("charts", []))
                        print(f"📊 Found {charts_count} charts")
                        
                except json.JSONDecodeError as e:
                    print(f"❌ Response is not valid JSON: {e}")
                    print(f"Response preview: {response.text[:200]}...")
                    
            elif response.status_code == 401:
                print("❌ Authentication failed (401)")
                print("This might mean the auth token is invalid or expired")
            elif response.status_code == 500:
                print("❌ Server error (500)")
                print(f"Response: {response.text[:300]}...")
            else:
                print(f"❌ Unexpected status: {response.status_code}")
                print(f"Response: {response.text[:200]}...")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    print("\n" + "=" * 60)
    print("🏁 Test complete!")
    
    # Test basic endpoints
    print("\n🔍 Testing basic endpoints:")
    
    basic_endpoints = [
        "/health",
        "/food-logs/daily/2025-07-01/with-goals",
        "/goals/",
        "/goals/active"
    ]
    
    for endpoint in basic_endpoints:
        try:
            url = f"{BASE_URL}{endpoint}"
            response = requests.get(url, headers=headers)
            print(f"{endpoint}: {response.status_code}")
        except Exception as e:
            print(f"{endpoint}: Error - {e}")

if __name__ == "__main__":
    test_analytics_with_auth()
