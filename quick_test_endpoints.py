#!/usr/bin/env python
"""
Quick test script to verify API endpoints after fixing duplicates
This script tests the public health endpoint and checks for 401 errors
on protected endpoints, which verifies they exist but require auth
"""

import requests
import json
from urllib.parse import urljoin

def test_endpoints(base_url):
    """Test key endpoints to ensure they're working properly after fixes"""
    
    # Test public endpoint first
    health_response = requests.get(urljoin(base_url, "/health"))
    print(f"Health endpoint: {health_response.status_code}")
    
    # Now test our fixed endpoints - should return 401 Unauthorized if they exist
    endpoints_to_test = [
        # AI Health endpoints - check both old and new
        "/ai-health/user-health-score",  # New endpoint name
        "/ai-health/health-score",       # Old endpoint name (should 404)
        "/ai-health/health-score-analysis", # Another endpoint name to check
        "/ai-health/progress-analytics",
        "/ai-health/insights",
        
        # AI Dashboard endpoints
        "/ai-dashboard/health-score",
        "/ai-dashboard/health-insights",
        
        # Analytics endpoints
        "/analytics/insights",
        "/analytics/nutrition-trends",
        
        # Meal planning endpoints
        "/meal-planning/plans",
        
        # Shopping list endpoint
        "/meal-planning/shopping-lists",
    ]
    
    results = {"working": [], "not_found": [], "other_error": []}
    
    for endpoint in endpoints_to_test:
        try:
            print(f"Testing {endpoint}...")
            response = requests.get(urljoin(base_url, endpoint))
            
            # 401 means the endpoint exists but requires auth - that's what we want
            if response.status_code == 401:
                print(f"✅ {endpoint} - Status 401 (requires auth)")
                results["working"].append(endpoint)
            # 404 means endpoint doesn't exist - this is bad unless it's the old endpoint
            elif response.status_code == 404:
                print(f"❌ {endpoint} - Status 404 (not found)")
                results["not_found"].append(endpoint)
            else:
                print(f"⚠️ {endpoint} - Status {response.status_code}")
                results["other_error"].append({
                    "endpoint": endpoint, 
                    "status_code": response.status_code, 
                    "message": response.text[:200]
                })
        except Exception as e:
            print(f"❌ {endpoint} - Exception: {str(e)}")
            results["other_error"].append({
                "endpoint": endpoint, 
                "error": str(e)
            })
    
    # Print summary
    print("\n--- TEST SUMMARY ---")
    print(f"Total endpoints tested: {len(endpoints_to_test)}")
    print(f"Working endpoints (401 Unauthorized): {len(results['working'])}")
    print(f"Not found endpoints (404): {len(results['not_found'])}")
    print(f"Other errors: {len(results['other_error'])}")
    
    # List not found endpoints
    if results["not_found"]:
        print("\nNot found endpoints:")
        for endpoint in results["not_found"]:
            print(f"  - {endpoint}")
    
    # Write results to file
    with open("endpoint_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print("\nDetailed results written to endpoint_test_results.json")
    
    # If old health-score endpoint is not found and new one works, that's good!
    old_endpoint = "/ai-health/health-score"
    new_endpoint = "/ai-health/user-health-score"
    
    if old_endpoint in results["not_found"] and new_endpoint in results["working"]:
        print("\n✅ SUCCESS: Endpoint renaming was successful!")
        print(f"  Old endpoint '{old_endpoint}' returns 404")
        print(f"  New endpoint '{new_endpoint}' requires auth (401)")
    else:
        print("\n❌ WARNING: Endpoint renaming might not be working as expected")
        print(f"  Old endpoint '{old_endpoint}': {'404' if old_endpoint in results['not_found'] else 'still exists'}")
        print(f"  New endpoint '{new_endpoint}': {'requires auth (401)' if new_endpoint in results['working'] else 'not working'}")

if __name__ == "__main__":
    # Configuration
    base_url = "http://localhost:8000"
    
    # Run tests
    test_endpoints(base_url)
