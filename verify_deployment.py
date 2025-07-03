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

def login(base_url, email, password):
    """Login and get auth token"""
    print_color(BLUE, f"Attempting login for {email}...")
    
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
    
    # Test CORS first
    test_cors(args.frontend_url, args.api_url)
    
    # Login
    token = login(args.api_url, args.email, args.password)
    
    # Test API endpoints
    test_api_endpoints(args.api_url, token)
    
    print_color(BLUE, "\n🏁 Verification complete!")

if __name__ == "__main__":
    main()
