"""
Verify that the deployment and fixes resolved the indentation and analytics endpoint issues
"""

import requests
import json
import time
from datetime import datetime
import sys

# API Base URL for Render deployment
API_BASE_URL = "https://nutrivize-api.onrender.com"  # Update if needed

def test_endpoints():
    """Test the key endpoints to verify they're working correctly"""
    results = {
        "status": "success",
        "timestamp": str(datetime.now()),
        "tests": []
    }
    
    # Test endpoints
    endpoints_to_test = [
        {
            "name": "Health Check", 
            "url": f"{API_BASE_URL}/health", 
            "method": "GET"
        },
        {
            "name": "Weekly Analytics", 
            "url": f"{API_BASE_URL}/analytics/weekly-summary?args=null&kwargs=null", 
            "method": "GET", 
            "auth": True
        },
        {
            "name": "Monthly Analytics", 
            "url": f"{API_BASE_URL}/analytics/monthly-summary?args=null&kwargs=null", 
            "method": "GET", 
            "auth": True
        },
        {
            "name": "AI Chat", 
            "url": f"{API_BASE_URL}/ai/chat", 
            "method": "POST",
            "auth": True,
            "body": {
                "message": "Show me my food index",
                "conversation_history": []
            }
        }
    ]
    
    # Get an auth token for testing protected endpoints
    token = get_test_token()
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    # Run tests
    for endpoint in endpoints_to_test:
        test_result = {
            "endpoint": endpoint["name"],
            "url": endpoint["url"],
            "success": False,
            "status_code": None,
            "response": None,
            "error": None
        }
        
        try:
            if endpoint.get("auth", False) and not token:
                test_result["error"] = "Skipped - no auth token available"
                continue
                
            endpoint_headers = headers if endpoint.get("auth", False) else {}
            
            if endpoint["method"] == "GET":
                response = requests.get(endpoint["url"], headers=endpoint_headers, timeout=30)
            else:  # POST
                response = requests.post(
                    endpoint["url"], 
                    headers={**endpoint_headers, "Content-Type": "application/json"}, 
                    json=endpoint.get("body", {}),
                    timeout=30
                )
                
            test_result["status_code"] = response.status_code
            
            # Try to parse JSON response
            try:
                test_result["response"] = response.json()
            except:
                test_result["response"] = response.text[:200] + "..." if len(response.text) > 200 else response.text
                
            test_result["success"] = 200 <= response.status_code < 300
            
        except Exception as e:
            test_result["error"] = str(e)
            
        results["tests"].append(test_result)
        
        # If any test fails, mark the overall status as failed
        if not test_result["success"]:
            results["status"] = "failed"
            
        # Print progress
        status = "✅" if test_result["success"] else "❌"
        print(f"{status} {endpoint['name']}: {test_result['status_code']}")
            
    return results

def get_test_token():
    """Get a test auth token"""
    try:
        # Use test credentials - replace with actual test user
        login_data = {
            "email": "test@nutrivize.app",
            "password": "testpassword123"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/auth/login", 
            json=login_data,
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json().get("access_token")
        else:
            print(f"Failed to get auth token: {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"Error getting auth token: {e}")
        return None

if __name__ == "__main__":
    print(f"Starting deployment verification at {datetime.now()}")
    
    print("\nTesting endpoints...")
    results = test_endpoints()
    
    # Write results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    with open(f"verification_results_{timestamp}.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\nVerification completed. Status: {results['status']}")
    print(f"Detailed results saved to verification_results_{timestamp}.json")
    
    # Exit with error code if any test failed
    if results["status"] == "failed":
        sys.exit(1)
