#!/usr/bin/env python3

import requests
import json
import sys

def test_analytics_endpoints():
    """Test analytics endpoints with a sample user"""
    
    # You would need to replace this with a real auth token for your test user
    # For now, let's just test the endpoints without auth to see the error responses
    
    BASE_URL = "http://localhost:8000"
    
    endpoints = [
        "/analytics/insights?timeframe=week",
        "/analytics/nutrition-trends?days=7", 
        "/analytics/food-patterns?days=7",
        "/analytics/macro-breakdown?timeframe=week",
        "/analytics/goal-progress"
    ]
    
    print("🧪 Testing Analytics Endpoints...")
    print("=" * 50)
    
    for endpoint in endpoints:
        try:
            url = f"{BASE_URL}{endpoint}"
            print(f"\n📍 Testing: {endpoint}")
            
            response = requests.get(url)
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 401:
                print("✅ Expected 401 (authentication required)")
            elif response.status_code == 200:
                print("✅ Success!")
                # Try to parse JSON to check for serialization issues
                try:
                    data = response.json()
                    print(f"✅ Response is valid JSON")
                except:
                    print("❌ Response is not valid JSON")
            else:
                print(f"❌ Unexpected status: {response.status_code}")
                print(f"Response: {response.text[:200]}...")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Test complete!")
    
    # Test health endpoint
    print("\n🔍 Health check:")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Health check failed: {e}")

if __name__ == "__main__":
    test_analytics_endpoints()
