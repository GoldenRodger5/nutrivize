#!/usr/bin/env python3
"""
Comprehensive endpoint testing that discovers ALL possible endpoints
from route definitions and tests them systematically.
"""

import requests
import time
import json
import sys
import os
import ast
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
COOLDOWN_SECONDS = 0.2
MAX_RETRIES = 2

def get_auth_token():
    """Get authentication token"""
    print("🔐 Getting authentication token...")
    auth_data = {
        "email": "isaacmineo@gmail.com",
        "password": "Buddydog41"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=auth_data, timeout=10)
        if response.status_code == 200:
            token = response.json().get("token")  # Changed from access_token to token
            if token:
                print("✅ Authentication successful")
                return token
            else:
                print("❌ No token in response")
                return None
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return None

def discover_routes_from_files():
    """
    Discover ALL routes by analyzing the actual route files using grep
    """
    routes = []
    backend_path = Path("/Users/isaacmineo/Main/projects/nutrivize-v2/backend/app/routes")
    
    # Route prefixes as defined in main.py
    route_prefixes = {
        "auth.py": "/auth",
        "onboarding.py": "/onboarding", 
        "foods.py": "/foods",
        "food_logs.py": "/food-logs",
        "preferences.py": "/preferences",
        "analytics.py": "/analytics",
        "ai.py": "/ai",
        "ai_coaching.py": "/ai",  # shares prefix with ai.py
        "ai_dashboard.py": "/ai-dashboard",
        "ai_health.py": "/ai-health", 
        "restaurant_ai.py": "/restaurant-ai",
        "meal_planning.py": "/meal-planning",
        "goals.py": "/goals",
        "weight_logs.py": "/weight-logs",
        "water_logs.py": "/water-logs",
        "nutrition_labels.py": "/nutrition-labels",
        "dietary.py": "/dietary",
        "food_stats.py": "/food-stats",
        "user_favorites.py": "/favorites",
        "user_foods.py": "/user-foods",
        "user.py": "/user",
        "users.py": "/users",
        "vectors.py": "/vectors"
    }
    
    for route_file in backend_path.glob("*.py"):
        if route_file.name in ["__init__.py"]:
            continue
            
        try:
            with open(route_file, 'r') as f:
                content = f.read()
            
            # Use regex to find route decorators
            import re
            
            # Pattern to match @router.method("path")
            pattern = r'@router\.(get|post|put|delete|patch)\((["\'])([^"\']*)\2'
            matches = re.findall(pattern, content, re.IGNORECASE)
            
            for match in matches:
                method = match[0].upper()
                route_path = match[2]
                
                # Get the prefix for this file
                prefix = route_prefixes.get(route_file.name, "")
                full_path = prefix + route_path
                
                # Clean up the path
                if full_path.startswith("//"):
                    full_path = full_path[1:]
                
                routes.append({
                    "method": method,
                    "path": full_path,
                    "file": route_file.name,
                    "function": f"route_in_{route_file.name}"
                })
                
        except Exception as e:
            print(f"⚠️  Error parsing {route_file.name}: {e}")
            continue
    
    return sorted(routes, key=lambda x: (x["path"], x["method"]))

def test_endpoint(method, path, headers, test_data=None):
    """Test a single endpoint"""
    try:
        # Handle path parameters - replace them with reasonable defaults
        test_path = path
        
        # Common path parameter substitutions
        path_substitutions = {
            "{date}": "2025-01-09",
            "{target_date}": "2025-01-09", 
            "{food_id}": "67728d6c9076fdec44c0003d",  # Use a realistic ObjectId
            "{log_id}": "67728d6c9076fdec44c0003e", 
            "{user_id}": "test-user",
            "{meal_plan_id}": "67728d6c9076fdec44c0003f",
            "{goal_id}": "67728d6c9076fdec44c00040",
            "{question}": "What should I eat for breakfast?",
            "{ingredient}": "banana"
        }
        
        for param, value in path_substitutions.items():
            test_path = test_path.replace(param, value)
        
        # Add query parameters for search endpoints
        query_params = {}
        if "search" in test_path:
            query_params["q"] = "apple"
        if "recommendations" in test_path:
            query_params["limit"] = "5"
            
        # Prepare request
        kwargs = {
            "headers": headers,
            "timeout": 15,
            "params": query_params
        }
        
        if method in ["POST", "PUT", "PATCH"] and test_data:
            kwargs["json"] = test_data
        
        # Make request
        response = requests.request(method, f"{BASE_URL}{test_path}", **kwargs)
        
        if response.status_code in [200, 201, 204]:
            return True, response.status_code, "Success"
        elif response.status_code == 404:
            return False, response.status_code, "Not Found"
        elif response.status_code == 401:
            return False, response.status_code, "Unauthorized"
        elif response.status_code == 422:
            return False, response.status_code, "Validation Error" 
        elif response.status_code == 500:
            return False, response.status_code, "Server Error"
        else:
            return False, response.status_code, f"HTTP {response.status_code}"
            
    except requests.exceptions.Timeout:
        return False, 0, "Timeout"
    except requests.exceptions.ConnectionError:
        return False, 0, "Connection Error"
    except Exception as e:
        return False, 0, f"Error: {str(e)}"

def get_sample_data_for_endpoint(method, path):
    """Get sample data for POST/PUT requests"""
    if method not in ["POST", "PUT", "PATCH"]:
        return None
        
    # Sample data for different endpoints
    if "/food-logs" in path and method == "POST":
        return {
            "food_id": "67728d6c9076fdec44c0003d",
            "serving_size": 1.0,
            "meal_type": "breakfast"
        }
    elif "/foods" in path and method == "POST":
        return {
            "name": "Test Food",
            "calories_per_100g": 250,
            "protein_per_100g": 10,
            "carbs_per_100g": 30,
            "fat_per_100g": 8
        }
    elif "/goals" in path and method == "POST":
        return {
            "daily_calories": 2000,
            "daily_protein": 150,
            "daily_carbs": 250,
            "daily_fat": 65
        }
    elif "/water-logs" in path and method == "POST":
        return {
            "amount_ml": 250
        }
    elif "/weight-logs" in path and method == "POST":
        return {
            "weight_kg": 70.5
        }
    
    return {}

def main():
    print("🚀 Discovering ALL possible endpoints from route files...")
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        print("❌ Failed to get authentication token")
        sys.exit(1)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Discover all routes
    all_routes = discover_routes_from_files()
    print(f"📊 Discovered {len(all_routes)} total endpoints")
    
    # Test each route
    results = []
    successful = 0
    failed = 0
    
    print(f"🧪 Testing {len(all_routes)} discovered endpoints...\n")
    
    for i, route in enumerate(all_routes, 1):
        method = route["method"]
        path = route["path"]
        
        print(f"[{i}/{len(all_routes)}] {method} {path}")
        
        # Get sample data if needed
        test_data = get_sample_data_for_endpoint(method, path)
        
        # Test the endpoint
        success, status_code, message = test_endpoint(method, path, headers, test_data)
        
        if success:
            print(f"  ✅ Success ({status_code})")
            successful += 1
        else:
            print(f"  ❌ Failed ({status_code}) - {message}")
            failed += 1
        
        results.append({
            "method": method,
            "path": path, 
            "file": route["file"],
            "function": route["function"],
            "success": success,
            "status_code": status_code,
            "message": message
        })
        
        # Cooldown
        time.sleep(COOLDOWN_SECONDS)
    
    # Print summary
    total = len(all_routes)
    success_rate = (successful / total) * 100 if total > 0 else 0
    
    print("\n" + "="*60)
    print("🔍 COMPREHENSIVE ENDPOINT DISCOVERY RESULTS")
    print("="*60)
    print(f"📊 SUMMARY:")
    print(f"- Total Endpoints Discovered: {total}")
    print(f"- Successful: {successful}")
    print(f"- Failed: {failed}")
    print(f"- Success Rate: {success_rate:.1f}%")
    
    # Categorize results
    if success_rate >= 95:
        print("🎯 STATUS: EXCELLENT")
    elif success_rate >= 85:
        print("🟡 STATUS: GOOD")
    elif success_rate >= 70:
        print("🟠 STATUS: NEEDS IMPROVEMENT")
    else:
        print("🔴 STATUS: CRITICAL ISSUES")
    
    # Show failed endpoints
    failed_routes = [r for r in results if not r["success"]]
    if failed_routes:
        print(f"\n❌ FAILED ENDPOINTS ({len(failed_routes)}):")
        print("-" * 40)
        for route in failed_routes:
            print(f"• {route['method']} {route['path']}")
            print(f"  ❌ Failed ({route['status_code']}) - {route['message']}")
            print(f"  📁 File: {route['file']}, Function: {route['function']}")
    
    # Show successful endpoints by category
    successful_routes = [r for r in results if r["success"]]
    if successful_routes:
        print(f"\n✅ SUCCESSFUL ENDPOINTS BY MODULE ({len(successful_routes)}):")
        print("-" * 40)
        
        # Group by file
        by_file = {}
        for route in successful_routes:
            file_name = route["file"].replace(".py", "")
            if file_name not in by_file:
                by_file[file_name] = []
            by_file[file_name].append(route)
        
        for file_name, routes in sorted(by_file.items()):
            print(f"📁 {file_name}: {len(routes)} endpoints working")
    
    return success_rate >= 95

if __name__ == "__main__":
    main()
