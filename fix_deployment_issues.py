#!/usr/bin/env python3
"""
Nutrivize V2 Deployment Issues Fix Script
This script fixes common issues with the Nutrivize V2 deployment
"""

import sys
import os
import json
import requests
import getpass
import time
from datetime import datetime, timedelta

# Configuration
API_URL = "https://nutrivize.onrender.com"
EMAIL = "isaacmineo@gmail.com"  # Replace with your test user email
PASSWORD = ""  # Will be prompted for

# Terminal colors
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_header(text):
    print(f"\n{BLUE}{'=' * 80}{RESET}")
    print(f"{BLUE}{text.center(80)}{RESET}")
    print(f"{BLUE}{'=' * 80}{RESET}")


def print_subheader(text):
    print(f"\n{BLUE}{text}{RESET}")
    print(f"{BLUE}{'-' * len(text)}{RESET}")


def print_result(success, message):
    if success:
        print(f"{GREEN}✓ {message}{RESET}")
    else:
        print(f"{RED}✗ {message}{RESET}")
    return success


def login(email, password):
    print_subheader("Authenticating")
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            json={"email": email, "password": password},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Login successful")
            return data.get("token")
        else:
            print_result(False, f"Login failed with status {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print_result(False, f"Login request failed: {e}")
        return None


def fix_analytics_endpoints():
    """Fix analytics endpoints issue with 'args' and 'kwargs' parameters"""
    print_subheader("Fixing Analytics Endpoints")
    
    analytics_file_path = "./backend/app/routes/analytics.py"
    
    try:
        # Check if file exists
        if not os.path.exists(analytics_file_path):
            print_result(False, f"File not found: {analytics_file_path}")
            return False
        
        # Read the file
        with open(analytics_file_path, 'r') as file:
            content = file.read()
        
        # Store original content for comparison
        original_content = content
        
        # Fix 1: Update the endpoint definitions to ignore args and kwargs parameters
        print("Updating endpoint definitions to handle 'args' and 'kwargs' parameters...")
        
        # Helper function to modify endpoint definitions
        def modify_endpoint(endpoint_name, content):
            import re
            pattern = rf'@router\.get\("/{endpoint_name}".*?\)\s*async def [^(]+\('
            match = re.search(pattern, content, re.DOTALL)
            
            if match:
                # Get the matched function signature
                signature = match.group(0)
                # Check if args and kwargs parameters already exist
                if "args: Optional" not in signature and "kwargs: Optional" not in signature:
                    # Add args and kwargs parameters
                    modified_signature = signature.rstrip('(') + (
                        "\n    args: Optional[str] = Query(None, description=\"Optional arguments\"),\n"
                        "    kwargs: Optional[str] = Query(None, description=\"Optional keyword arguments\"),\n    "
                    )
                    # Replace the original signature with modified one
                    content = content.replace(signature, modified_signature)
                    print_result(True, f"Added args and kwargs to /{endpoint_name} endpoint")
                else:
                    print_result(True, f"args and kwargs already present in /{endpoint_name} endpoint")
            else:
                print_result(False, f"Could not find /{endpoint_name} endpoint")
            
            return content
        
        # Add Optional to imports if not already there
        if "Optional" not in content.split("\n")[1]:  # Check the imports line
            content = content.replace(
                "from typing import Dict, Any, List",
                "from typing import Dict, Any, List, Optional"
            )
        
        # Modify all analytics endpoints
        endpoints = ["weekly-summary", "monthly-summary", "insights", "nutrition-trends", 
                    "goal-progress", "food-patterns", "macro-breakdown"]
        
        for endpoint in endpoints:
            content = modify_endpoint(endpoint, content)
        
        # Write the updated content back to the file if changes were made
        if content != original_content:
            with open(analytics_file_path, 'w') as file:
                file.write(content)
            print_result(True, "Analytics endpoints updated successfully")
        else:
            print_result(True, "No changes needed for analytics endpoints")
        
        return True
    except Exception as e:
        print_result(False, f"Failed to fix analytics endpoints: {e}")
        return False


def fix_main_py_cors():
    """Fix CORS issues in main.py"""
    print_subheader("Fixing CORS Configuration in main.py")
    
    main_file_path = "./backend/app/main.py"
    
    try:
        # Check if file exists
        if not os.path.exists(main_file_path):
            print_result(False, f"File not found: {main_file_path}")
            return False
        
        # Read the file
        with open(main_file_path, 'r') as file:
            content = file.read()
        
        # Store original content for comparison
        original_content = content
        
        # Check for potential issues in CORS configuration
        cors_issues = []
        
        # 1. Check if enhanced_cors_middleware function has proper CORS headers
        if content.find("OPTIONS") >= 0 and "indentation issue in OPTIONS handling" not in content:
            print("Fixing OPTIONS request handler indentation...")
            # Fix indentation issues in OPTIONS handling
            content = content.replace(
                """    # Handle OPTIONS preflight requests
    if method == "OPTIONS":
        response = Response()
        # Force CORS headers for all responses, especially AI endpoints
    if origin and (origin in allowed_origins or is_render_domain):""",
                """    # Handle OPTIONS preflight requests
    if method == "OPTIONS":
        response = Response()
        # Force CORS headers for all responses, especially AI endpoints
        if origin and (origin in allowed_origins or is_render_domain):"""
            )
            cors_issues.append("Fixed OPTIONS request handler indentation")
        
        # 2. Fix the duplicate AI endpoint check 
        if content.count("is_ai_endpoint = \"/ai/\" in request.url.path") > 1:
            print("Removing duplicate 'is_ai_endpoint' declaration...")
            # Find all occurrences and keep only the first one
            first_pos = content.find("is_ai_endpoint = \"/ai/\" in request.url.path")
            second_pos = content.find("is_ai_endpoint = \"/ai/\" in request.url.path", first_pos + 1)
            content = content[:second_pos] + content[second_pos:].replace("is_ai_endpoint = \"/ai/\" in request.url.path", "", 1)
            cors_issues.append("Removed duplicate 'is_ai_endpoint' declaration")
            
        # 3. Fix duplicate CORS headers for AI endpoints
        if content.count("# Force CORS headers for AI endpoints to ensure they're present") > 1:
            print("Removing duplicate CORS headers for AI endpoints...")
            # Find the first occurrence position
            first_block_pos = content.find("""        # Additional debugging for AI endpoints
        if is_ai_endpoint:
            # Force CORS headers for AI endpoints to ensure they're present
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, Origin"
""")
            
            # Find the second occurrence position (starting after the first occurrence)
            second_block_pos = content.find("""        # Additional debugging for AI endpoints
        if is_ai_endpoint:
            # Force CORS headers for AI endpoints to ensure they're present
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, Origin"
""", first_block_pos + 10)
            
            if second_block_pos > 0:
                # Remove the second occurrence
                second_block_end = second_block_pos + content[second_block_pos:].find("\n\n")
                if second_block_end < second_block_pos:  # If no double newline found
                    second_block_end = second_block_pos + content[second_block_pos:].find("    # Add PWA-specific headers")
                
                content = content[:second_block_pos] + content[second_block_end:]
                cors_issues.append("Removed duplicate AI endpoint CORS headers")
        
        # 4. Add any missing allowed origins (including additional Render domains)
        if "*.render.app" not in content and "allow_origin_regex" in content:
            print("Adding additional Render domains to allowed origin regex...")
            # Update the regex to include more Render domains
            content = content.replace(
                'allow_origin_regex=r"https?://.*\.?onrender\.com(:[0-9]+)?$"',
                'allow_origin_regex=r"https?://(.*\.)?onrender\.(com|app|internal)(:[0-9]+)?$"'
            )
            cors_issues.append("Added additional Render domains to allowed origin regex")
        
        # Write the updated content back to the file if changes were made
        if content != original_content:
            with open(main_file_path, 'w') as file:
                file.write(content)
            print_result(True, "CORS configuration fixed in main.py")
            for issue in cors_issues:
                print(f"  - {issue}")
        else:
            print_result(True, "No changes needed for CORS configuration")
        
        return True
    except Exception as e:
        print_result(False, f"Failed to fix CORS configuration: {e}")
        return False


def fix_ai_endpoints():
    """Fix AI endpoint issues"""
    print_subheader("Fixing AI Endpoints")
    
    ai_file_path = "./backend/app/routes/ai.py"
    
    try:
        # Check if file exists
        if not os.path.exists(ai_file_path):
            print_result(False, f"File not found: {ai_file_path}")
            return False
        
        # Read the file
        with open(ai_file_path, 'r') as file:
            content = file.read()
        
        # Store original content for comparison
        original_content = content
        
        # Fix 1: Remove duplicate ensure_cors_headers dependency
        if content.count("async def ensure_cors_headers") > 1:
            print("Removing duplicate ensure_cors_headers dependency...")
            # Find the first occurrence position
            first_pos = content.find("async def ensure_cors_headers")
            end_first_pos = content.find("return None", first_pos) + len("return None")
            
            # Find the second occurrence position (starting after the first occurrence)
            second_pos = content.find("async def ensure_cors_headers", end_first_pos)
            end_second_pos = content.find("return None", second_pos) + len("return None")
            
            # Remove the second occurrence
            if second_pos > 0:
                start_line = content.rfind("\n", 0, second_pos) + 1
                end_line = content.find("\n", end_second_pos) + 1
                content = content[:start_line] + content[end_line:]
                print_result(True, "Removed duplicate ensure_cors_headers dependency")
        
        # Fix 2: Remove duplicate depends in meal-suggestions endpoint
        if content.count("_: None = Depends(ensure_cors_headers)") > 1:
            print("Removing duplicate Depends(ensure_cors_headers) in meal-suggestions endpoint...")
            content = content.replace(
                "_: None = Depends(ensure_cors_headers),\n    _: None = Depends(ensure_cors_headers)",
                "_: None = Depends(ensure_cors_headers)"
            )
            print_result(True, "Removed duplicate CORS dependency in meal-suggestions endpoint")
        
        # Write the updated content back to the file if changes were made
        if content != original_content:
            with open(ai_file_path, 'w') as file:
                file.write(content)
            print_result(True, "AI endpoints fixed successfully")
        else:
            print_result(True, "No changes needed for AI endpoints")
        
        return True
    except Exception as e:
        print_result(False, f"Failed to fix AI endpoints: {e}")
        return False


def test_analytics_endpoints(token):
    """Test analytics endpoints with fixed parameters"""
    print_subheader("Testing Analytics Endpoints")
    
    if not token:
        print_result(False, "No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    all_successful = True
    
    analytics_endpoints = [
        {
            "name": "Nutrition Trends",
            "url": f"{API_URL}/analytics/nutrition-trends?days=7"
        },
        {
            "name": "Macro Breakdown",
            "url": f"{API_URL}/analytics/macro-breakdown?timeframe=week"
        },
        {
            "name": "Food Patterns",
            "url": f"{API_URL}/analytics/food-patterns?days=7"
        },
        {
            "name": "Goal Progress",
            "url": f"{API_URL}/analytics/goal-progress"
        },
        {
            "name": "AI Insights",
            "url": f"{API_URL}/analytics/insights?timeframe=week&force_refresh=false"
        }
    ]
    
    for endpoint in analytics_endpoints:
        try:
            print(f"\nTesting {endpoint['name']}...")
            response = requests.get(
                endpoint["url"],
                headers=headers,
                timeout=20  # Analytics endpoints might need more time
            )
            
            if response.status_code == 200:
                print_result(True, f"{endpoint['name']} endpoint is working")
                print("Sample response data:")
                print(json.dumps(response.json(), indent=2)[:200] + "...")
            else:
                all_successful = False
                print_result(False, f"{endpoint['name']} endpoint failed with status {response.status_code}")
                print(f"Response: {response.text[:300]}...")
                
                if response.status_code == 422:
                    print(f"{YELLOW}Analytics endpoints still require the 'args' and 'kwargs' query parameters{RESET}")
                    print(f"{YELLOW}Adding args=null&kwargs=null to URL and retrying...{RESET}")
                    
                    # Try again with args and kwargs
                    fixed_url = endpoint["url"] + "&args=null&kwargs=null"
                    response = requests.get(
                        fixed_url,
                        headers=headers,
                        timeout=20
                    )
                    
                    if response.status_code == 200:
                        print_result(True, f"{endpoint['name']} endpoint works with args/kwargs parameters")
                        print("Sample response data:")
                        print(json.dumps(response.json(), indent=2)[:200] + "...")
                    else:
                        print_result(False, f"{endpoint['name']} endpoint still failed with status {response.status_code}")
                        print(f"Response: {response.text[:300]}...")
        except Exception as e:
            all_successful = False
            print_result(False, f"{endpoint['name']} endpoint request failed: {e}")
    
    return all_successful


def test_ai_endpoints(token):
    """Test AI endpoints"""
    print_subheader("Testing AI Endpoints")
    
    if not token:
        print_result(False, "No auth token available")
        return False
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Origin": "https://nutrivize.onrender.com"  # Add origin header to test CORS
    }
    
    # Test meal suggestions endpoint
    try:
        print("\nTesting meal suggestions...")
        
        payload = {
            "meal_type": "dinner",
            "dietary_preferences": ["vegetarian"],
            "allergies": [],
            "prep_time_preference": "moderate"
        }
        
        response = requests.post(
            f"{API_URL}/ai/meal-suggestions",
            json=payload,
            headers=headers,
            timeout=30  # AI endpoints might need more time
        )
        
        # Check CORS headers
        print("\nChecking CORS headers in response:")
        cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
        for header, value in cors_headers.items():
            print(f"  {header}: {value}")
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Meal suggestions endpoint is working")
            
            # Check if we have suggestions
            suggestions = data.get("suggestions", [])
            print(f"Received {len(suggestions)} meal suggestions")
            
            if suggestions:
                print("First suggestion:")
                print(f"- Name: {suggestions[0].get('name', 'N/A')}")
                print(f"- Description: {suggestions[0].get('description', 'N/A')[:100]}...")
                
                # Check ingredients
                ingredients = suggestions[0].get("ingredients", [])
                print(f"- Ingredients: {len(ingredients)} items")
                if ingredients:
                    for i, ingredient in enumerate(ingredients[:3]):
                        print(f"  {i+1}. {ingredient.get('name', 'N/A')}: {ingredient.get('amount', 'N/A')} {ingredient.get('unit', '')}")
                    if len(ingredients) > 3:
                        print(f"  ... and {len(ingredients) - 3} more")
            return True
        else:
            print_result(False, f"Meal suggestions endpoint failed with status {response.status_code}")
            print(f"Response: {response.text[:300]}...")
            return False
    except Exception as e:
        print_result(False, f"AI endpoint request failed: {e}")
        return False


def test_chat_endpoint(token):
    """Test the chat endpoint"""
    print_subheader("Testing Chat Endpoint")
    
    if not token:
        print_result(False, "No auth token available")
        return False
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Origin": "https://nutrivize.onrender.com"  # Add origin header to test CORS
    }
    
    try:
        # Test a simple chat message asking about foods in the index
        payload = {
            "message": "What foods do I have in my food index?",
            "conversation_history": []
        }
        
        print("Sending chat message: 'What foods do I have in my food index?'")
        print("This might take a moment...")
        
        response = requests.post(
            f"{API_URL}/ai/chat",
            json=payload,
            headers=headers,
            timeout=60  # Chat might need more time for AI processing
        )
        
        # Check CORS headers
        print("\nChecking CORS headers in response:")
        cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
        for header, value in cors_headers.items():
            print(f"  {header}: {value}")
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Chat endpoint is working")
            
            # Show the AI response
            ai_response = data.get("response", "No response")
            print(f"\nAI Response:")
            print(f"{ai_response[:500]}..." if len(ai_response) > 500 else ai_response)
            
            # Check if food index was accessed
            if "food index" in ai_response.lower() and not ("no foods" in ai_response.lower() or "unable to" in ai_response.lower()):
                print_result(True, "Chat endpoint successfully accessed food index")
            else:
                print_result(False, "Chat endpoint may not be accessing food index properly")
                print(f"{YELLOW}Recommend checking unified_ai_service.py for food index access{RESET}")
            
            return True
        else:
            print_result(False, f"Chat endpoint failed with status {response.status_code}")
            print(f"Response: {response.text[:300]}...")
            return False
    except Exception as e:
        print_result(False, f"Chat endpoint request failed: {e}")
        return False


def apply_all_fixes():
    """Apply all fixes to codebase"""
    print_header("APPLYING ALL FIXES")
    
    # List of fixes to apply
    fixes = [
        {"name": "Fix Analytics Endpoints", "function": fix_analytics_endpoints},
        {"name": "Fix CORS Configuration", "function": fix_main_py_cors},
        {"name": "Fix AI Endpoints", "function": fix_ai_endpoints}
    ]
    
    all_successful = True
    for fix in fixes:
        print(f"\nApplying: {fix['name']}...")
        success = fix["function"]()
        if not success:
            all_successful = False
    
    if all_successful:
        print(f"\n{GREEN}All fixes applied successfully!{RESET}")
        print(f"{YELLOW}Remember to commit and deploy these changes to Render.{RESET}")
    else:
        print(f"\n{RED}Some fixes failed. Check the logs above.{RESET}")
    
    return all_successful


def run_comprehensive_tests(token):
    """Run comprehensive tests on all fixed endpoints"""
    print_header("RUNNING COMPREHENSIVE TESTS")
    
    # List of tests to run
    analytics_success = test_analytics_endpoints(token)
    ai_success = test_ai_endpoints(token)
    chat_success = test_chat_endpoint(token)
    
    # Summary
    print_header("TEST SUMMARY")
    
    all_success = all([analytics_success, ai_success, chat_success])
    
    print(f"Analytics Endpoints: {'✓' if analytics_success else '✗'}")
    print(f"AI Endpoints: {'✓' if ai_success else '✗'}")
    print(f"Chat Functionality: {'✓' if chat_success else '✗'}")
    
    print("\nRecommended Fixes:")
    if not analytics_success:
        print(f"{RED}- Analytics endpoints need 'args' and 'kwargs' query parameters in backend code{RESET}")
        print(f"{RED}- Frontend should be updated to include these parameters{RESET}")
    
    if not ai_success:
        print(f"{RED}- Check AI service configuration and API keys{RESET}")
        print(f"{RED}- Verify CORS is properly configured for AI endpoints{RESET}")
    
    if not chat_success:
        print(f"{RED}- Check chat service and AI provider connection{RESET}")
        print(f"{RED}- Ensure chat service can access food index data{RESET}")
    
    if all_success:
        print(f"\n{GREEN}All tests passed successfully!{RESET}")
        return 0
    else:
        print(f"\n{RED}Some tests failed. See details above.{RESET}")
        return 1


def main():
    """Main function"""
    print_header("NUTRIVIZE V2 DEPLOYMENT ISSUES FIX SCRIPT")
    
    if len(sys.argv) > 1 and sys.argv[1] == "--test-only":
        # Test-only mode
        print("Running in test-only mode (no fixes will be applied)")
        if len(sys.argv) > 2:
            password = sys.argv[2]
        else:
            # Prompt for password securely
            password = getpass.getpass("Enter your Nutrivize password: ")
            
        token = login(EMAIL, password)
        if token:
            return run_comprehensive_tests(token)
        else:
            return 1
    elif len(sys.argv) > 1 and sys.argv[1] == "--fix-only":
        # Fix-only mode
        print("Running in fix-only mode (no tests will be run)")
        return 0 if apply_all_fixes() else 1
    else:
        # Both fix and test mode
        print("Running in full mode (apply fixes and run tests)")
        
        # First apply all fixes
        fix_success = apply_all_fixes()
        if not fix_success:
            print(f"{RED}Fixes failed, skipping tests{RESET}")
            return 1
        
        # Then run tests if requested
        if len(sys.argv) > 1:
            password = sys.argv[1]
        else:
            # Prompt for password securely
            password = getpass.getpass("Enter your Nutrivize password: ")
            
        token = login(EMAIL, password)
        if token:
            return run_comprehensive_tests(token)
        else:
            return 1


if __name__ == "__main__":
    sys.exit(main())
