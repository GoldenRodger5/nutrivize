#!/usr/bin/env python3
"""
Comprehensive End-to-End Test Script for Unified AI System
Tests all aspects of the unified AI including decimal/float serving size support
"""

import requests
import json
import time
import sys
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import traceback

# Configuration
API_BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5173"
TEST_EMAIL = "test@nutrivize.com"
TEST_PASSWORD = "test123!"  # Change this to your test user password
TIMEOUT = 30  # Timeout for API requests that might take longer

# Color codes for terminal output
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
BOLD = "\033[1m"
RESET = "\033[0m"

# Test data with decimal/float serving sizes
TEST_FOOD_LOG = {
    "food_name": "Greek Yogurt",
    "serving_size": 1.5,  # Decimal serving size
    "calories": 150,
    "protein": 15,
    "carbs": 12,
    "fat": 4.5,  # Decimal nutritional value
    "meal_type": "breakfast",
    "logged_at": datetime.now().isoformat()
}

TEST_FOOD_INDEX = {
    "name": "Avocado Toast with Egg",
    "default_serving_size": 1.25,  # Decimal serving size
    "calories": 320,
    "protein": 12.5,  # Decimal nutritional value
    "carbs": 25.75,  # Decimal nutritional value
    "fat": 18.3,  # Decimal nutritional value
    "food_category": "breakfast"
}

TEST_MEAL_PLAN_REQUEST = {
    "duration": 3,
    "meals_per_day": 3,
    "budget": "moderate",
    "prep_time": "moderate",
    "variety": "high",
    "special_requests": "Include 1.5 servings of Greek yogurt for breakfast and 0.75 servings of avocado in lunch meals"
}

class TestUnifiedAI:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.logged_food_id = None
        self.indexed_food_id = None
        self.meal_plan_id = None
        self.meal_suggestion_id = None
    
    def print_section(self, title):
        """Print a section title"""
        print(f"\n{BOLD}{BLUE}{'=' * 80}{RESET}")
        print(f"{BOLD}{BLUE}{title.center(80)}{RESET}")
        print(f"{BOLD}{BLUE}{'=' * 80}{RESET}")
    
    def print_test(self, test_name):
        """Print a test name"""
        print(f"\n{BOLD}▶ {test_name}{RESET}")
    
    def print_success(self, message):
        """Print a success message"""
        print(f"{GREEN}✓ {message}{RESET}")
    
    def print_warning(self, message):
        """Print a warning message"""
        print(f"{YELLOW}⚠ {message}{RESET}")
    
    def print_error(self, message):
        """Print an error message"""
        print(f"{RED}✗ {message}{RESET}")
    
    def print_json(self, data):
        """Print JSON data in a readable format"""
        print(json.dumps(data, indent=4))
    
    def authenticate(self):
        """Authenticate with Firebase and get user token"""
        self.print_test("Authenticating with Firebase")
        
        api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"  # Replace with your Firebase API key if different
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
        
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "returnSecureToken": True
        }
        
        try:
            response = requests.post(url, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('idToken')
                self.user_id = data.get('localId')
                self.print_success(f"Authentication successful. User ID: {self.user_id}")
                return True
            else:
                self.print_error(f"Authentication failed: {response.text}")
                return False
        except Exception as e:
            self.print_error(f"Error authenticating: {str(e)}")
            return False
    
    def check_services(self):
        """Check if backend and frontend services are running"""
        self.print_test("Checking service availability")
        
        # Check backend
        try:
            response = requests.get(f"{API_BASE_URL}/health")
            self.print_success("Backend server is running")
        except requests.exceptions.ConnectionError:
            self.print_error("Backend server is not running. Please start the backend server first.")
            return False
        
        # Check frontend
        try:
            response = requests.get(FRONTEND_URL)
            self.print_success("Frontend server is running")
        except requests.exceptions.ConnectionError:
            self.print_warning("Frontend server might not be running. Some manual tests might be affected.")
        
        return True
    
    def test_chat_with_context(self):
        """Test the chat_with_context AI endpoint with decimal support queries"""
        self.print_test("Testing AI Chat with context (including decimal value support)")
        
        if not self.token:
            self.print_error("Authentication required")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Test various chat scenarios that include decimal values
        chat_tests = [
            {
                "message": "Log 1.5 servings of Greek yogurt for breakfast today",
                "expected_contains": ["logged", "1.5", "servings", "Greek yogurt"]
            },
            {
                "message": "Add a new food to my database: Avocado Toast with Egg, with serving size 1.25 and 320 calories",
                "expected_contains": ["added", "Avocado Toast", "1.25", "serving"]
            },
            {
                "message": "Show me meal plan suggestions with 0.75 servings of avocado per day",
                "expected_contains": ["meal plan", "0.75", "avocado"]
            },
            {
                "message": "What's my total water intake if I log 1.25 liters now?",
                "expected_contains": ["water intake", "1.25", "liters"]
            }
        ]
        
        all_passed = True
        
        for i, test in enumerate(chat_tests):
            try:
                payload = {
                    "messages": [{"role": "user", "content": test["message"]}]
                }
                
                response = requests.post(
                    f"{API_BASE_URL}/ai/chat",
                    headers=headers,
                    json=payload,
                    timeout=TIMEOUT
                )
                
                if response.status_code == 200:
                    result = response.json()
                    response_text = result.get("response", "")
                    
                    # Check if response contains expected strings
                    contains_all = all(expected in response_text.lower() for expected in test["expected_contains"])
                    
                    if contains_all:
                        self.print_success(f"Chat test {i+1}: AI correctly processed decimal values in query")
                    else:
                        self.print_warning(f"Chat test {i+1}: AI response might not have fully processed decimal values")
                        self.print_warning(f"Response: {response_text}")
                        all_passed = False
                else:
                    self.print_error(f"Chat test {i+1} failed: {response.status_code} - {response.text}")
                    all_passed = False
            except Exception as e:
                self.print_error(f"Error in chat test {i+1}: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_food_logging_with_decimals(self):
        """Test food logging with decimal serving sizes"""
        self.print_test("Testing food logging with decimal serving sizes")
        
        if not self.token:
            self.print_error("Authentication required")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Test logging food via AI
        chat_payload = {
            "messages": [
                {"role": "user", "content": f"Log {TEST_FOOD_LOG['serving_size']} servings of {TEST_FOOD_LOG['food_name']} for {TEST_FOOD_LOG['meal_type']}"}
            ]
        }
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/ai/chat",
                headers=headers,
                json=chat_payload,
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get("response", "")
                
                # Check if the response indicates successful logging with correct decimal values
                if "successfully logged" in response_text.lower() and str(TEST_FOOD_LOG['serving_size']) in response_text:
                    self.print_success("AI successfully logged food with decimal serving size")
                else:
                    self.print_warning("Food logging response unclear about decimal handling")
                    self.print_warning(f"Response: {response_text}")
            else:
                self.print_error(f"Food logging failed: {response.status_code} - {response.text}")
                return False
                
            # Verify the food was logged with decimal serving size by fetching food logs
            try:
                # Wait a moment for DB to update
                time.sleep(2)
                
                # Get today's logs to verify
                today = datetime.now().strftime("%Y-%m-%d")
                response = requests.get(
                    f"{API_BASE_URL}/food-logs/day/{today}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    logs = response.json()
                    
                    # Find the logged food
                    found_log = False
                    for log in logs:
                        if (log.get("food_name", "").lower() == TEST_FOOD_LOG["food_name"].lower() and 
                            abs(float(log.get("serving_size", 0)) - TEST_FOOD_LOG["serving_size"]) < 0.01):
                            found_log = True
                            self.logged_food_id = log.get("_id")
                            self.print_success(f"Verified food log with decimal serving size in database: {log.get('serving_size')}")
                            break
                    
                    if not found_log:
                        self.print_warning("Could not find the logged food with exact decimal serving size in database")
                else:
                    self.print_error(f"Failed to fetch food logs: {response.status_code} - {response.text}")
            except Exception as e:
                self.print_error(f"Error verifying food log: {str(e)}")
                
            return True
                
        except Exception as e:
            self.print_error(f"Error in food logging test: {str(e)}")
            return False
    
    def test_food_indexing_with_decimals(self):
        """Test food indexing with decimal serving sizes and nutritional values"""
        self.print_test("Testing food indexing with decimal values")
        
        if not self.token:
            self.print_error("Authentication required")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Test indexing food via AI
        chat_payload = {
            "messages": [
                {"role": "user", "content": (
                    f"Add a new food to my database: {TEST_FOOD_INDEX['name']}, "
                    f"with serving size {TEST_FOOD_INDEX['default_serving_size']}, "
                    f"{TEST_FOOD_INDEX['calories']} calories, "
                    f"{TEST_FOOD_INDEX['protein']}g protein, "
                    f"{TEST_FOOD_INDEX['carbs']}g carbs, "
                    f"and {TEST_FOOD_INDEX['fat']}g fat"
                )}
            ]
        }
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/ai/chat",
                headers=headers,
                json=chat_payload,
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get("response", "")
                
                # Check if the response indicates successful indexing with correct decimal values
                if "successfully added" in response_text.lower() and str(TEST_FOOD_INDEX['default_serving_size']) in response_text:
                    self.print_success("AI successfully indexed food with decimal serving size")
                else:
                    self.print_warning("Food indexing response unclear about decimal handling")
                    self.print_warning(f"Response: {response_text}")
            else:
                self.print_error(f"Food indexing failed: {response.status_code} - {response.text}")
                return False
                
            # Verify the food was indexed with decimal values by searching for it
            try:
                # Wait a moment for DB to update
                time.sleep(2)
                
                # Search for the indexed food
                search_response = requests.get(
                    f"{API_BASE_URL}/foods/search?query={TEST_FOOD_INDEX['name']}",
                    headers=headers
                )
                
                if search_response.status_code == 200:
                    results = search_response.json()
                    
                    # Find the indexed food
                    found_food = False
                    for food in results:
                        if (food.get("name", "").lower() == TEST_FOOD_INDEX["name"].lower()):
                            found_food = True
                            self.indexed_food_id = food.get("_id")
                            
                            # Verify decimal values
                            serving_size = float(food.get("default_serving_size", 0))
                            protein = float(food.get("protein", 0))
                            fat = float(food.get("fat", 0))
                            
                            if (abs(serving_size - TEST_FOOD_INDEX["default_serving_size"]) < 0.01 and
                                abs(protein - TEST_FOOD_INDEX["protein"]) < 0.1 and
                                abs(fat - TEST_FOOD_INDEX["fat"]) < 0.1):
                                self.print_success(f"Verified indexed food with decimal values in database")
                                self.print_success(f"Serving size: {serving_size}, Protein: {protein}g, Fat: {fat}g")
                            else:
                                self.print_warning("Indexed food has different decimal values than requested")
                                self.print_warning(f"Actual: Serving size: {serving_size}, Protein: {protein}g, Fat: {fat}g")
                                self.print_warning(f"Expected: Serving size: {TEST_FOOD_INDEX['default_serving_size']}, Protein: {TEST_FOOD_INDEX['protein']}g, Fat: {TEST_FOOD_INDEX['fat']}g")
                            break
                    
                    if not found_food:
                        self.print_warning(f"Could not find the indexed food '{TEST_FOOD_INDEX['name']}' in database")
                else:
                    self.print_error(f"Failed to search for indexed food: {search_response.status_code} - {search_response.text}")
            except Exception as e:
                self.print_error(f"Error verifying indexed food: {str(e)}")
                
            return True
                
        except Exception as e:
            self.print_error(f"Error in food indexing test: {str(e)}")
            return False
    
    def test_meal_planning_with_decimals(self):
        """Test meal planning with decimal serving sizes"""
        self.print_test("Testing meal planning with decimal serving sizes")
        
        if not self.token:
            self.print_error("Authentication required")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/ai/meal-plan",
                headers=headers,
                json=TEST_MEAL_PLAN_REQUEST,
                timeout=TIMEOUT*2  # Meal planning can take longer
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Store meal plan ID if available
                self.meal_plan_id = result.get("_id") or result.get("id")
                
                # Check if the meal plan includes decimal serving sizes
                has_decimal_servings = False
                decimal_examples = []
                
                days = result.get("days", [])
                for day in days:
                    for meal in day.get("meals", []):
                        for item in meal.get("items", []):
                            serving_size = item.get("serving_size")
                            if serving_size and isinstance(serving_size, (float, str)) and "." in str(serving_size):
                                has_decimal_servings = True
                                decimal_examples.append(f"{item.get('food_name')}: {serving_size}")
                                if len(decimal_examples) >= 3:
                                    break
                
                if has_decimal_servings:
                    self.print_success("Meal plan includes decimal serving sizes:")
                    for example in decimal_examples[:3]:  # Show up to 3 examples
                        self.print_success(f"  - {example}")
                else:
                    self.print_warning("Meal plan doesn't appear to include decimal serving sizes")
                    
                # Check specific requirements
                plan_str = json.dumps(result).lower()
                if "1.5" in plan_str and "greek yogurt" in plan_str and "0.75" in plan_str and "avocado" in plan_str:
                    self.print_success("Meal plan includes specified decimal quantities from request")
                else:
                    self.print_warning("Meal plan may not include all specified decimal quantities from request")
                    
            else:
                self.print_error(f"Meal planning failed: {response.status_code} - {response.text}")
                return False
                
            return True
                
        except Exception as e:
            self.print_error(f"Error in meal planning test: {str(e)}")
            traceback.print_exc()
            return False
    
    def test_meal_suggestions_with_decimals(self):
        """Test meal suggestions with decimal serving sizes"""
        self.print_test("Testing meal suggestions with decimal serving sizes")
        
        if not self.token:
            self.print_error("Authentication required")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        meal_suggestion_request = {
            "meal_type": "lunch",
            "preferences": "Include 0.5 servings of avocado and 1.5 servings of protein",
            "max_calories": 500,
            "cooking_time": 20
        }
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/ai/meal-suggestions",
                headers=headers,
                json=meal_suggestion_request,
                timeout=TIMEOUT*2  # Meal suggestions can take longer
            )
            
            if response.status_code == 200:
                result = response.json()
                suggestions = result.get("suggestions", [])
                
                # Check if suggestions include decimal serving sizes
                has_decimal_servings = False
                decimal_examples = []
                
                for suggestion in suggestions:
                    for item in suggestion.get("items", []):
                        serving_size = item.get("serving_size")
                        if serving_size and isinstance(serving_size, (float, str)) and "." in str(serving_size):
                            has_decimal_servings = True
                            decimal_examples.append(f"{item.get('food_name')}: {serving_size}")
                            if len(decimal_examples) >= 3:
                                break
                
                if has_decimal_servings:
                    self.print_success("Meal suggestions include decimal serving sizes:")
                    for example in decimal_examples[:3]:  # Show up to 3 examples
                        self.print_success(f"  - {example}")
                else:
                    self.print_warning("Meal suggestions don't appear to include decimal serving sizes")
                    
                # Check specific requirements
                suggestions_str = json.dumps(suggestions).lower()
                if "0.5" in suggestions_str and "avocado" in suggestions_str and "1.5" in suggestions_str and "protein" in suggestions_str:
                    self.print_success("Meal suggestions include specified decimal quantities from request")
                else:
                    self.print_warning("Meal suggestions may not include all specified decimal quantities from request")
            else:
                self.print_error(f"Meal suggestions failed: {response.status_code} - {response.text}")
                return False
                
            return True
                
        except Exception as e:
            self.print_error(f"Error in meal suggestions test: {str(e)}")
            return False
    
    def test_water_logging_with_decimals(self):
        """Test water logging with decimal amounts"""
        self.print_test("Testing water logging with decimal amounts")
        
        if not self.token:
            self.print_error("Authentication required")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Test logging water via AI
        water_amount = 1.25  # Test with decimal value
        chat_payload = {
            "messages": [
                {"role": "user", "content": f"Log {water_amount} liters of water"}
            ]
        }
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/ai/chat",
                headers=headers,
                json=chat_payload,
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get("response", "")
                
                # Check if the response indicates successful water logging with correct decimal values
                if "water" in response_text.lower() and "logged" in response_text.lower() and str(water_amount) in response_text:
                    self.print_success("AI successfully logged water with decimal amount")
                else:
                    self.print_warning("Water logging response unclear about decimal handling")
                    self.print_warning(f"Response: {response_text}")
            else:
                self.print_error(f"Water logging failed: {response.status_code} - {response.text}")
                return False
                
            # Verify the water was logged with decimal amount
            try:
                # Wait a moment for DB to update
                time.sleep(2)
                
                # Get today's water logs
                today = datetime.now().strftime("%Y-%m-%d")
                response = requests.get(
                    f"{API_BASE_URL}/water-logs/day/{today}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    logs = response.json()
                    
                    # Find water log with the decimal amount
                    found_log = False
                    for log in logs:
                        if abs(float(log.get("amount", 0)) - water_amount) < 0.01:
                            found_log = True
                            self.print_success(f"Verified water log with decimal amount in database: {log.get('amount')}")
                            break
                    
                    if not found_log:
                        self.print_warning("Could not find water log with exact decimal amount in database")
                else:
                    self.print_error(f"Failed to fetch water logs: {response.status_code} - {response.text}")
            except Exception as e:
                self.print_error(f"Error verifying water log: {str(e)}")
            
            return True
                
        except Exception as e:
            self.print_error(f"Error in water logging test: {str(e)}")
            return False
    
    def test_health_insights_with_decimal_data(self):
        """Test health insights with decimal data integration"""
        self.print_test("Testing health insights with decimal data integration")
        
        if not self.token:
            self.print_error("Authentication required")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/ai/health-insights",
                headers=headers,
                json={"analysis_period": 7},
                timeout=TIMEOUT*2  # Health insights can take longer
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Check if insights include decimal value references
                insights_str = json.dumps(result).lower()
                
                # Look for decimal patterns in the response
                import re
                decimal_pattern = r'\d+\.\d+'
                decimals_found = re.findall(decimal_pattern, insights_str)
                
                if decimals_found:
                    self.print_success(f"Health insights include decimal values: {', '.join(decimals_found[:5])}")
                else:
                    self.print_warning("Health insights may not include decimal values in analysis")
            else:
                self.print_error(f"Health insights failed: {response.status_code} - {response.text}")
                return False
                
            return True
                
        except Exception as e:
            self.print_error(f"Error in health insights test: {str(e)}")
            return False
    
    def test_dashboard_data_with_decimal_integration(self):
        """Test dashboard data with decimal value integration"""
        self.print_test("Testing dashboard data with decimal value integration")
        
        if not self.token:
            self.print_error("Authentication required")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.get(
                f"{API_BASE_URL}/ai/dashboard",
                headers=headers,
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Check nutritional data for decimal values
                nutritional_data = result.get("nutritional_data", {})
                water_intake = nutritional_data.get("water_intake", {})
                
                decimal_found = False
                decimal_examples = []
                
                # Check water intake
                if "actual" in water_intake and "." in str(water_intake["actual"]):
                    decimal_found = True
                    decimal_examples.append(f"Water intake: {water_intake['actual']}")
                
                # Check macros
                macros = nutritional_data.get("macros", {})
                for key, value in macros.items():
                    if "actual" in value and "." in str(value["actual"]):
                        decimal_found = True
                        decimal_examples.append(f"{key.capitalize()}: {value['actual']}")
                        if len(decimal_examples) >= 4:
                            break
                
                if decimal_found:
                    self.print_success("Dashboard data includes decimal values:")
                    for example in decimal_examples[:4]:
                        self.print_success(f"  - {example}")
                else:
                    self.print_warning("Dashboard data doesn't appear to include decimal values")
            else:
                self.print_error(f"Dashboard data fetch failed: {response.status_code} - {response.text}")
                return False
                
            return True
                
        except Exception as e:
            self.print_error(f"Error in dashboard data test: {str(e)}")
            return False
    
    def test_comprehensive_conversation_flow(self):
        """Test a comprehensive conversation flow testing all aspects of the system"""
        self.print_test("Testing comprehensive conversation flow (all system aspects)")
        
        if not self.token:
            self.print_error("Authentication required")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Multi-turn conversation to test various aspects with decimal values
        conversation = [
            "What's my calorie target for today?",
            "Log 1.25 servings of oatmeal with 0.5 tablespoons of honey for breakfast",
            "What foods have I logged today?",
            "Create a meal plan for 3 days with 0.75 servings of salmon for dinner",
            "Update my water goal to 2.5 liters per day",
            "Suggest a lunch with 1.5 servings of protein and under 450 calories",
            "What's my nutrition summary for today including my water intake?"
        ]
        
        messages = []
        all_passed = True
        
        for i, message in enumerate(conversation):
            messages.append({"role": "user", "content": message})
            
            try:
                payload = {"messages": messages}
                
                response = requests.post(
                    f"{API_BASE_URL}/ai/chat",
                    headers=headers,
                    json=payload,
                    timeout=TIMEOUT
                )
                
                if response.status_code == 200:
                    result = response.json()
                    response_text = result.get("response", "")
                    
                    # Add assistant response to messages for context
                    messages.append({"role": "assistant", "content": response_text})
                    
                    self.print_success(f"Step {i+1}: Message processed successfully")
                    
                    # Check for decimal value handling in specific steps
                    if i == 1:  # Food logging with decimals
                        if "1.25" in response_text and "0.5" in response_text:
                            self.print_success("Food logging with decimal values confirmed")
                        else:
                            self.print_warning("Food logging response may not confirm decimal values")
                            self.print_warning(f"Response: {response_text}")
                    elif i == 3:  # Meal plan with decimals
                        if "0.75" in response_text and "salmon" in response_text.lower():
                            self.print_success("Meal planning with decimal values confirmed")
                        else:
                            self.print_warning("Meal planning response may not confirm decimal values")
                            self.print_warning(f"Response: {response_text}")
                    elif i == 5:  # Meal suggestions with decimals
                        if "1.5" in response_text and "protein" in response_text.lower():
                            self.print_success("Meal suggestions with decimal values confirmed")
                        else:
                            self.print_warning("Meal suggestions response may not confirm decimal values")
                            self.print_warning(f"Response: {response_text}")
                else:
                    self.print_error(f"Step {i+1} failed: {response.status_code} - {response.text}")
                    all_passed = False
                    break
                
                # Add a small delay between requests
                time.sleep(1)
                
            except Exception as e:
                self.print_error(f"Error in conversation step {i+1}: {str(e)}")
                all_passed = False
                break
        
        return all_passed
    
    def run_tests(self):
        """Run all tests"""
        self.print_section("UNIFIED AI SYSTEM END-TO-END TEST")
        
        if not self.check_services():
            return False
            
        if not self.authenticate():
            return False
        
        tests = [
            self.test_chat_with_context,
            self.test_food_logging_with_decimals,
            self.test_food_indexing_with_decimals,
            self.test_meal_planning_with_decimals,
            self.test_meal_suggestions_with_decimals,
            self.test_water_logging_with_decimals,
            self.test_health_insights_with_decimal_data,
            self.test_dashboard_data_with_decimal_integration,
            self.test_comprehensive_conversation_flow
        ]
        
        results = []
        
        for test in tests:
            result = test()
            results.append(result)
        
        # Print summary
        self.print_section("TEST SUMMARY")
        passed = sum(1 for r in results if r is True)
        failed = sum(1 for r in results if r is False)
        print(f"{BOLD}Total tests: {len(results)}{RESET}")
        print(f"{GREEN}Passed: {passed}{RESET}")
        print(f"{RED}Failed: {failed}{RESET}")
        
        return all(results)


if __name__ == "__main__":
    tester = TestUnifiedAI()
    success = tester.run_tests()
    sys.exit(0 if success else 1)
