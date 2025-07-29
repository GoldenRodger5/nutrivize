#!/usr/bin/env python3
"""
Test authentication and endpoints for Nutrivize V2
"""
import requests
import json
import sys
import os
from datetime import date

def test_backend():
    API_URL = "http://localhost:8000"
    
    print("🔐 Testing Nutrivize V2 Backend")
    print("=" * 40)
    
    # Test 1: Health check
    print("1. Health Check:")
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            print(f"   ✅ Backend healthy: {response.json()}")
        else:
            print(f"   ❌ Backend unhealthy: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Backend not reachable: {e}")
        return False
    
    # Test 2: Protected endpoint without auth (should return 401)
    print("\n2. Protected Endpoint (no auth):")
    try:
        response = requests.get(f"{API_URL}/auth/me", timeout=5)
        if response.status_code == 401:
            print(f"   ✅ Correctly rejected: {response.json()}")
        else:
            print(f"   ❌ Unexpected response: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Request failed: {e}")
    
    # Test 3: Food search without auth (should return 401)
    print("\n3. Food Search (no auth):")
    try:
        response = requests.get(f"{API_URL}/foods/search?q=apple", timeout=5)
        if response.status_code == 401:
            print(f"   ✅ Correctly rejected: {response.json()}")
        else:
            print(f"   ❌ Unexpected response: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Request failed: {e}")
    
    # Test 4: Available endpoints
    print("\n4. Available Endpoints:")
    endpoints_to_test = [
        "/auth/me",
        "/auth/verify", 
        "/auth/register",
        "/foods/search",
        "/food-logs/daily/2025-06-29",
        "/food-logs/range",
        "/ai/chat"
    ]
    
    for endpoint in endpoints_to_test:
        try:
            response = requests.get(f"{API_URL}{endpoint}", timeout=5)
            status = "🔒" if response.status_code == 401 else "❓"
            print(f"   {status} {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"   ❌ {endpoint}: Error - {e}")
    
    print("\n" + "=" * 40)
    print("🎯 Next Steps:")
    print("1. Open browser to http://localhost:5174")
    print("2. Open DevTools Console (F12)")
    print("3. Login with: IsaacMineo@gmail.com / Buddydog41")
    print("4. Watch console for debug messages")
    print("5. Copy any Firebase token and test manually:")
    print("   curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:8000/auth/me")
    
    return True

def test_with_token_if_provided():
    """If user provides a token as argument, test authenticated endpoints"""
    if len(sys.argv) > 1:
        token = sys.argv[1]
        API_URL = "http://localhost:8000"
        headers = {"Authorization": f"Bearer {token}"}
        
        print(f"\n🔑 Testing with provided token: {token[:20]}...")
        
        # Test authenticated endpoints
        endpoints = [
            ("/auth/me", "GET"),
            ("/foods/search?q=apple", "GET"),
            (f"/food-logs/daily/{date.today()}", "GET")
        ]
        
        for endpoint, method in endpoints:
            try:
                if method == "GET":
                    response = requests.get(f"{API_URL}{endpoint}", headers=headers, timeout=5)
                
                print(f"   {endpoint}: {response.status_code}")
                if response.status_code == 200:
                    print(f"      ✅ {response.json()}")
                else:
                    print(f"      ❌ {response.text}")
                    
            except Exception as e:
                print(f"   ❌ {endpoint}: {e}")

if __name__ == "__main__":
    success = test_backend()
    if success:
        test_with_token_if_provided()
