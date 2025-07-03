#!/usr/bin/env python3
"""
Nutrivize Deployment Verification Script
This script tests the deployed APIs to verify they are working correctly
"""

import requests
import json
import sys
import time
import argparse
from datetime import datetime, timedelta

# Default values
DEFAULT_API_URL = "https://nutrivize.onrender.com"
DEFAULT_FRONTEND_URL = "https://nutrivize-frontend.onrender.com"
TEST_EMAIL = "isaacmineo@gmail.com"  # Update with a test user email

# Define color codes for terminal output
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"
BLUE = "\033[94m"

def print_color(color, message):
    print(f"{color}{message}{RESET}")

def check_cors(base_url, frontend_url):
    """Check if CORS is configured correctly"""
    print_color(BLUE, "\n===== CHECKING CORS CONFIGURATION =====")
    
    # Build test request
    headers = {
        "Origin": frontend_url,
        "Referer": f"{frontend_url}/food-log"
    }
    
    # Get start and end dates for last week
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    start_date_str = start_date.strftime("%Y-%m-%d")
    end_date_str = end_date.strftime("%Y-%m-%d")
    
    # Test endpoint 
    url = f"{base_url}/food-logs/range?start_date={start_date_str}&end_date={end_date_str}"
    print(f"Testing CORS with request to: {url}")
    print(f"Origin header: {headers['Origin']}")
    
    try:
        # Send OPTIONS preflight request
        options_response = requests.options(
            url, 
            headers=headers,
            timeout=10
        )
        
        print("\nOPTIONS Preflight Response:")
        print(f"Status: {options_response.status_code}")
        print("Headers:")
        for key, value in options_response.headers.items():
            if key.lower().startswith("access-control"):
                print(f"  {key}: {value}")
        
        # Check for Access-Control-Allow-Origin header
        if "Access-Control-Allow-Origin" in options_response.headers:
            allowed_origin = options_response.headers["Access-Control-Allow-Origin"]
            if allowed_origin == frontend_url or allowed_origin == "*":
                print_color(GREEN, "✅ CORS preflight check passed")
                return True
            else:
                print_color(YELLOW, f"⚠️ CORS preflight allows {allowed_origin} but not {frontend_url}")
        else:
            print_color(RED, f"❌ CORS preflight check failed - No Access-Control-Allow-Origin header")
        
        return False
    except requests.exceptions.RequestException as e:
        print_color(RED, f"❌ Error during CORS check: {str(e)}")
        return False

def login(base_url, email, password):
    """Login and get auth token"""
    print_color(BLUE, f"\nAttempting login for {email}...")
    
    try:
        response = requests.post(
            f"{base_url}/auth/login",
            json={"email": email, "password": password},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_color(GREEN, "✅ Login successful!")
            return data.get("token")
        else:
            print_color(RED, f"❌ Login failed with status {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print_color(RED, f"❌ Login request failed: {e}")
        return None

def test_cors(frontend_url, api_url):
    """Test CORS configuration"""
    print_color(BLUE, f"\nTesting CORS configuration...")
    
    # Simulate a request from the frontend to the backend
    headers = {
        "Origin": frontend_url,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Content-Type,Authorization"
    }
    
    try:
        # Test preflight request (OPTIONS)
        options_response = requests.options(
            f"{api_url}/food-logs/range",
            headers=headers,
            timeout=10
        )
        
        print(f"OPTIONS status code: {options_response.status_code}")
        print(f"CORS headers: {options_response.headers.get('Access-Control-Allow-Origin', 'Not set')}")
        
        if frontend_url in options_response.headers.get('Access-Control-Allow-Origin', '') or options_response.headers.get('Access-Control-Allow-Origin', '') == '*':
            print_color(GREEN, "✅ CORS is properly configured!")
        else:
            print_color(RED, f"❌ CORS issue: Access-Control-Allow-Origin header doesn't include {frontend_url}")
            
    except Exception as e:
        print_color(RED, f"❌ CORS test failed: {e}")

def test_api_endpoints(base_url, token):
    """Test various API endpoints"""
    print_color(BLUE, f"\nTesting API endpoints with token...")
    
    if not token:
        print_color(RED, "❌ No token available, skipping API tests")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Define test dates
    today = datetime.now()
    start_date = (today - timedelta(days=7)).strftime('%Y-%m-%d')
    end_date = today.strftime('%Y-%m-%d')
    
    # Test endpoints with proper error handling
    endpoints = [
        f"/food-logs/range?start_date={start_date}&end_date={end_date}",
        f"/analytics/macro-breakdown?timeframe=week",
        f"/analytics/goal-progress",
        f"/analytics/nutrition-trends?days=7",
        f"/analytics/insights?timeframe=week&force_refresh=false",
        f"/analytics/food-patterns?days=7",
    ]
    
    for endpoint in endpoints:
        print_color(BLUE, f"Testing {endpoint}...")
        try:
            response = requests.get(
                f"{base_url}{endpoint}",
                headers=headers,
                timeout=30  # Longer timeout for analytics endpoints
            )
            
            if response.status_code == 200:
                print_color(GREEN, f"✅ {endpoint}: Success ({response.status_code})")
            else:
                print_color(YELLOW, f"⚠️  {endpoint}: Response {response.status_code}")
                print(f"Response: {response.text[:200]}...")
        except Exception as e:
            print_color(RED, f"❌ {endpoint}: Request failed - {e}")

def test_food_log_range(base_url, token=None):
    """Test the food log range endpoint specifically"""
    print_color(BLUE, f"\nTesting food log range endpoint...")
    
    # Define test dates
    today = datetime.now()
    start_date = (today - timedelta(days=7)).strftime('%Y-%m-%d')
    end_date = today.strftime('%Y-%m-%d')
    endpoint = f"/food-logs/range?start_date={start_date}&end_date={end_date}"
    
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        response = requests.get(
            f"{base_url}{endpoint}",
            headers=headers,
            timeout=15
        )
        
        if response.status_code == 200:
            print_color(GREEN, f"✅ Food log range endpoint works with valid response ({response.status_code})")
            return True
        elif response.status_code == 401 and not token:
            print_color(GREEN, f"✅ Food log range endpoint returns proper 401 without token (expected)")
            return True
        elif response.status_code == 500:
            print_color(RED, f"❌ Food log range endpoint returns 500 error - fix not working")
            return False
        else:
            print_color(YELLOW, f"⚠️ Food log range endpoint: Response {response.status_code}")
            return False
    except Exception as e:
        print_color(RED, f"❌ Food log range request failed: {e}")
        return False

def test_ai_endpoints(base_url, token=None):
    """Test AI endpoints specifically"""
    print_color(BLUE, f"\nTesting AI endpoints...")
    
    if not token:
        print_color(RED, "❌ No token available, skipping AI endpoint tests")
        return False
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Origin": DEFAULT_FRONTEND_URL
    }
    
    # Test meal suggestions endpoint
    endpoint = "/ai/meal-suggestions"
    test_data = {
        "meal_type": "dinner",
        "dietary_preferences": ["vegetarian"],
        "allergies": [],
        "prep_time_preference": "moderate"
    }
    
    print_color(BLUE, f"Testing {endpoint}...")
    try:
        response = requests.post(
            f"{base_url}{endpoint}",
            headers=headers,
            json=test_data,
            timeout=30  # AI endpoints might need more time
        )
        
        print(f"Response status: {response.status_code}")
        print(f"CORS headers: {response.headers.get('Access-Control-Allow-Origin', 'Not set')}")
        
        if response.status_code == 200:
            print_color(GREEN, f"✅ {endpoint}: Success ({response.status_code})")
            return True
        else:
            print_color(YELLOW, f"⚠️  {endpoint}: Response {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            return False
    except Exception as e:
        print_color(RED, f"❌ {endpoint}: Request failed - {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Verify Nutrivize API deployment")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="API base URL")
    parser.add_argument("--frontend-url", default=DEFAULT_FRONTEND_URL, help="Frontend base URL")
    parser.add_argument("--email", default=TEST_EMAIL, help="Test user email")
    parser.add_argument("--password", required=True, help="Test user password")
    args = parser.parse_args()
    
    print_color(BLUE, "🔍 Nutrivize Deployment Verification Script")
    print_color(BLUE, f"API URL: {args.api_url}")
    print_color(BLUE, f"Frontend URL: {args.frontend_url}")
    
    # Test CORS with our enhanced check
    cors_result = check_cors(args.api_url, args.frontend_url)
    
    # Legacy test for compatibility 
    test_cors(args.frontend_url, args.api_url)
    
    # Test food log range specifically (without auth first)
    range_result = test_food_log_range(args.api_url)
    
    # Login
    token = login(args.api_url, args.email, args.password)
    
    # Test food log range with auth
    if token:
        range_auth_result = test_food_log_range(args.api_url, token)
    else:
        range_auth_result = False
    
    # Test API endpoints
    test_api_endpoints(args.api_url, token)
    
    # Test AI endpoints
    ai_result = test_ai_endpoints(args.api_url, token)
    
    # Print summary
    print_color(BLUE, "\n===== VERIFICATION SUMMARY =====")
    if cors_result:
        print_color(GREEN, "✅ CORS configuration is working correctly")
    else:
        print_color(RED, "❌ CORS issues still exist - needs attention")
        
    if range_result and range_auth_result:
        print_color(GREEN, "✅ Food log range endpoint is working correctly")
    else:
        print_color(RED, "❌ Food log range issues still exist - needs attention")
        
    if ai_result:
        print_color(GREEN, "✅ AI endpoints are working correctly")
    else:
        print_color(RED, "❌ AI endpoint issues still exist - needs attention")
        
    print_color(BLUE, "\n🏁 Verification complete!")

if __name__ == "__main__":
    main()
