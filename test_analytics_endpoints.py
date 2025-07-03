#!/usr/bin/env python3

import requests
import json
import sys

# Test the analytics endpoints
BASE_URL = "http://localhost:8001"

def test_endpoint(endpoint, headers=None):
    """Test an endpoint and return the result"""
    try:
        url = f"{BASE_URL}{endpoint}"
        print(f"\n🧪 Testing: {endpoint}")
        print(f"URL: {url}")
        
        response = requests.get(url, headers=headers)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Success!")
            # Print first 200 chars of response
            response_text = response.text
            if len(response_text) > 200:
                print(f"Response: {response_text[:200]}...")
            else:
                print(f"Response: {response_text}")
        else:
            print("❌ Error!")
            print(f"Response: {response.text}")
            
        return response.status_code
        
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return None

def main():
    print("🔍 Testing Analytics Endpoints")
    
    # Test without auth first (should get 401)
    print("\n=== Testing without authentication ===")
    test_endpoint("/analytics/insights")
    test_endpoint("/analytics/nutrition-trends")
    test_endpoint("/analytics/food-patterns")
    test_endpoint("/analytics/macro-breakdown")
    test_endpoint("/analytics/goal-progress")
    
    # Test health endpoint
    print("\n=== Testing health endpoint ===")
    test_endpoint("/health")
    
    print("\n=== Test Complete ===")
    print("Note: 401 errors are expected without authentication.")
    print("500 errors indicate server-side issues that need fixing.")

if __name__ == "__main__":
    main()
