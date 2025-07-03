#!/usr/bin/env python3
"""
Comprehensive Unified AI System Test
Tests all major functionalities with decimal/float support:
- Food logging with decimal serving sizes
- Food indexing with decimal serving sizes
- Meal plan generation, editing, and logging
- Meal suggestion generation, editing, and logging
- User data queries and modifications
- Water logging and dashboard integration
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
AUTH_EMAIL = "isaacmineo@gmail.com"
AUTH_PASSWORD = "Buddydog41"

class UnifiedAITester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if data and not success:
            print(f"   Response: {json.dumps(data, indent=2)}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        print()

    def authenticate(self):
        """Authenticate and get token"""
        print("🔐 Authenticating...")
        try:
            response = self.session.post(
                f"{BASE_URL}/auth/login",
                json={"email": AUTH_EMAIL, "password": AUTH_PASSWORD}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token")
                user_data = data.get("user", {})
                self.user_id = user_data.get("uid")
                
                # Set authorization header for all future requests
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                
                self.log_test("Authentication", True, f"User ID: {self.user_id}")
                return True
            else:
                self.log_test("Authentication", False, f"Status: {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_test("Authentication", False, f"Exception: {str(e)}")
            return False

    def test_unified_ai_chat(self):
        """Test basic AI chat functionality"""
        print("💬 Testing Unified AI Chat...")
        
        messages = [
            "Hello! Can you help me with my nutrition tracking?",
            "What's my current daily calorie intake?",
            "How much water should I drink daily?",
            "Can you suggest a healthy breakfast?"
        ]
        
        for i, message in enumerate(messages):
            try:
                response = self.session.post(
                    f"{BASE_URL}/ai/chat",
                    json={"message": message, "conversation_id": f"test_conv_{i}"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    ai_response = data.get("response", "")
                    
                    if ai_response and len(ai_response) > 10:
                        self.log_test(f"AI Chat Message {i+1}", True, f"Response length: {len(ai_response)}")
                    else:
                        self.log_test(f"AI Chat Message {i+1}", False, "Empty or too short response", data)
                else:
                    self.log_test(f"AI Chat Message {i+1}", False, f"Status: {response.status_code}", response.json())
                    
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                self.log_test(f"AI Chat Message {i+1}", False, f"Exception: {str(e)}")

    def test_food_logging_with_decimals(self):
        """Test food logging with decimal serving sizes via AI"""
        print("🍎 Testing Food Logging with Decimal Serving Sizes...")
        
        test_foods = [
            {
                "message": "I ate 1.5 servings of grilled chicken breast for lunch",
                "expected_amount": 1.5,
                "name": "Grilled Chicken Breast"
            },
            {
                "message": "I had 0.75 cups of quinoa with dinner",
                "expected_amount": 0.75,
                "name": "Quinoa"
            },
            {
                "message": "I consumed 2.25 pieces of whole grain toast for breakfast",
                "expected_amount": 2.25,
                "name": "Whole Grain Toast"
            }
        ]
        
        for i, food_data in enumerate(test_foods):
            try:
                response = self.session.post(
                    f"{BASE_URL}/ai/smart-food-log",
                    params={"message": food_data["message"]}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    success = data.get("message") == "Food operations processed"
                    
                    if success:
                        result = data.get("result", {})
                        self.log_test(
                            f"Food Logging Decimal {i+1}",
                            True,
                            f"Successfully processed: {food_data['name']} - {food_data['expected_amount']} servings"
                        )
                    else:
                        self.log_test(f"Food Logging Decimal {i+1}", False, "Processing failed", data)
                else:
                    self.log_test(f"Food Logging Decimal {i+1}", False, f"Status: {response.status_code}", response.json())
                    
                time.sleep(2)  # Rate limiting
                
            except Exception as e:
                self.log_test(f"Food Logging Decimal {i+1}", False, f"Exception: {str(e)}")

    def test_food_indexing_with_decimals(self):
        """Test food indexing (adding custom foods) with decimal serving sizes"""
        print("📝 Testing Food Indexing with Decimal Serving Sizes...")
        
        custom_foods = [
            {
                "message": "Add a new food: 'Homemade Protein Smoothie' with 1.5 servings containing 250 calories, 25g protein, 15g carbs, 8g fat",
                "food_name": "Homemade Protein Smoothie",
                "serving_size": 1.5
            },
            {
                "message": "Index this food: 'Custom Energy Bar' with 0.5 bar serving size, 180 calories, 12g protein, 20g carbs, 6g fat",
                "food_name": "Custom Energy Bar", 
                "serving_size": 0.5
            }
        ]
        
        for i, food_data in enumerate(custom_foods):
            try:
                response = self.session.post(
                    f"{BASE_URL}/ai/chat",
                    json={
                        "message": food_data["message"],
                        "conversation_id": f"food_index_test_{i}"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    ai_response = data.get("response", "")
                    
                    # Check if AI understood and processed the food indexing request
                    success_indicators = [
                        "added",
                        "indexed",
                        "created",
                        "saved",
                        food_data["food_name"].lower()
                    ]
                    
                    if any(indicator in ai_response.lower() for indicator in success_indicators):
                        self.log_test(
                            f"Food Indexing Decimal {i+1}",
                            True,
                            f"Successfully indexed {food_data['food_name']} with decimal serving"
                        )
                    else:
                        self.log_test(
                            f"Food Indexing Decimal {i+1}",
                            False,
                            "AI didn't confirm food indexing",
                            {"response": ai_response}
                        )
                else:
                    self.log_test(f"Food Indexing Decimal {i+1}", False, f"Status: {response.status_code}", response.json())
                    
                time.sleep(2)
                
            except Exception as e:
                self.log_test(f"Food Indexing Decimal {i+1}", False, f"Exception: {str(e)}")

    def test_meal_plan_operations(self):
        """Test meal plan generation, editing, and logging with decimal serving sizes"""
        print("🍽️ Testing Meal Plan Operations with Decimals...")
        
        # Test meal plan generation
        try:
            response = self.session.post(
                f"{BASE_URL}/ai/meal-plan",
                json={
                    "duration": 1,
                    "meals_per_day": 3,
                    "budget": "moderate",
                    "prep_time": "moderate",
                    "variety": "high",
                    "special_requests": "Include decimal serving sizes where appropriate"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                meal_plan = data.get("meal_plan", {})
                
                if meal_plan and "daily_meals" in meal_plan:
                    self.log_test("Meal Plan Generation", True, "Generated meal plan successfully")
                    
                    # Test meal plan editing with decimals
                    edit_message = "Edit my meal plan: change breakfast to 1.5 servings of oatmeal with 0.75 cups of berries"
                    
                    edit_response = self.session.post(
                        f"{BASE_URL}/ai/chat",
                        json={
                            "message": edit_message,
                            "conversation_id": "meal_plan_edit_test"
                        }
                    )
                    
                    if edit_response.status_code == 200:
                        edit_data = edit_response.json()
                        edit_result = edit_data.get("response", "")
                        
                        if "1.5" in edit_result and "0.75" in edit_result:
                            self.log_test("Meal Plan Editing with Decimals", True, "Successfully edited with decimal servings")
                        else:
                            self.log_test("Meal Plan Editing with Decimals", False, "Decimals not preserved in edit")
                    
                    # Test meal plan logging
                    log_message = "Log today's breakfast from my meal plan with 1.25 servings"
                    
                    log_response = self.session.post(
                        f"{BASE_URL}/ai/smart-food-log",
                        json={
                            "message": log_message,
                            "conversation_id": "meal_plan_log_test"
                        }
                    )
                    
                    if log_response.status_code == 200:
                        log_data = log_response.json()
                        if log_data.get("success"):
                            self.log_test("Meal Plan Logging with Decimals", True, "Successfully logged meal plan items")
                        else:
                            self.log_test("Meal Plan Logging with Decimals", False, "Failed to log meal plan", log_data)
                else:
                    self.log_test("Meal Plan Generation", False, "No meal plan in response", data)
            else:
                self.log_test("Meal Plan Generation", False, f"Status: {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Meal Plan Operations", False, f"Exception: {str(e)}")

    def test_meal_suggestions_operations(self):
        """Test meal suggestion generation, editing, and logging with decimal serving sizes"""
        print("💡 Testing Meal Suggestion Operations with Decimals...")
        
        try:
            response = self.session.post(
                f"{BASE_URL}/ai/meal-suggestions",
                json={
                    "meal_type": "lunch",
                    "remaining_calories": 600,
                    "dietary_preferences": [],
                    "prep_time_preference": "moderate"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                suggestions = data.get("suggestions", [])
                
                if suggestions and len(suggestions) > 0:
                    self.log_test("Meal Suggestions Generation", True, f"Generated {len(suggestions)} suggestions")
                    
                    # Test suggestion editing with decimals
                    suggestion_name = suggestions[0].get("name", "suggested meal")
                    edit_message = f"Modify the {suggestion_name} to use 1.75 servings of the main ingredient and 0.5 cups of the side"
                    
                    edit_response = self.session.post(
                        f"{BASE_URL}/ai/chat",
                        json={
                            "message": edit_message,
                            "conversation_id": "suggestion_edit_test"
                        }
                    )
                    
                    if edit_response.status_code == 200:
                        edit_data = edit_response.json()
                        edit_result = edit_data.get("response", "")
                        
                        if "1.75" in edit_result and "0.5" in edit_result:
                            self.log_test("Meal Suggestion Editing with Decimals", True, "Successfully edited with decimal servings")
                        else:
                            self.log_test("Meal Suggestion Editing with Decimals", False, "Decimals not preserved in edit")
                    
                    # Test suggestion logging
                    log_message = f"Log the first meal suggestion with 1.33 servings"
                    
                    log_response = self.session.post(
                        f"{BASE_URL}/ai/smart-food-log",
                        json={
                            "message": log_message,
                            "conversation_id": "suggestion_log_test"
                        }
                    )
                    
                    if log_response.status_code == 200:
                        log_data = log_response.json()
                        if log_data.get("success"):
                            self.log_test("Meal Suggestion Logging with Decimals", True, "Successfully logged suggestion items")
                        else:
                            self.log_test("Meal Suggestion Logging with Decimals", False, "Failed to log suggestion", log_data)
                else:
                    self.log_test("Meal Suggestions Generation", False, "No suggestions generated", data)
            else:
                self.log_test("Meal Suggestions Generation", False, f"Status: {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Meal Suggestions Operations", False, f"Exception: {str(e)}")

    def test_water_logging_with_decimals(self):
        """Test water logging with decimal amounts"""
        print("💧 Testing Water Logging with Decimals...")
        
        water_amounts = [16.5, 12.25, 8.75, 20.0]
        
        for i, amount in enumerate(water_amounts):
            try:
                # Test through AI chat
                message = f"I drank {amount} fl oz of water"
                
                response = self.session.post(
                    f"{BASE_URL}/ai/chat",
                    json={
                        "message": message,
                        "conversation_id": f"water_test_{i}"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    ai_response = data.get("response", "")
                    
                    # Check if AI acknowledged the water logging
                    if str(amount) in ai_response and ("water" in ai_response.lower() or "logged" in ai_response.lower()):
                        self.log_test(f"Water Logging Decimal {i+1}", True, f"Logged {amount} fl oz")
                    else:
                        self.log_test(f"Water Logging Decimal {i+1}", False, "Water logging not confirmed", {"response": ai_response})
                else:
                    self.log_test(f"Water Logging Decimal {i+1}", False, f"Status: {response.status_code}", response.json())
                    
                time.sleep(1)
                
            except Exception as e:
                self.log_test(f"Water Logging Decimal {i+1}", False, f"Exception: {str(e)}")

    def test_user_data_queries(self):
        """Test AI's ability to query and discuss user data"""
        print("📊 Testing User Data Queries...")
        
        queries = [
            "What did I eat today?",
            "How many calories have I consumed so far?",
            "What's my protein intake looking like?",
            "How much water have I logged today?",
            "What are my recent meal patterns?",
            "Can you analyze my nutrition trends?",
            "What foods do I eat most frequently?",
            "Am I meeting my daily nutrition goals?"
        ]
        
        for i, query in enumerate(queries):
            try:
                response = self.session.post(
                    f"{BASE_URL}/ai/chat",
                    json={
                        "message": query,
                        "conversation_id": f"data_query_test_{i}"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    ai_response = data.get("response", "")
                    
                    # Check if AI provided a substantive response
                    if ai_response and len(ai_response) > 50:
                        self.log_test(f"User Data Query {i+1}", True, f"Query: '{query[:30]}...' - Response length: {len(ai_response)}")
                    else:
                        self.log_test(f"User Data Query {i+1}", False, "Insufficient response", {"query": query, "response": ai_response})
                else:
                    self.log_test(f"User Data Query {i+1}", False, f"Status: {response.status_code}", response.json())
                    
                time.sleep(1)
                
            except Exception as e:
                self.log_test(f"User Data Query {i+1}", False, f"Exception: {str(e)}")

    def test_data_modification_capabilities(self):
        """Test AI's ability to modify and update user data"""
        print("✏️ Testing Data Modification Capabilities...")
        
        modifications = [
            "Change my daily calorie goal to 2200",
            "Update my weight to 175.5 lbs",
            "Set my water intake goal to 64.5 fl oz per day",
            "Modify yesterday's breakfast - I actually had 1.75 servings of oatmeal",
            "Delete the snack I logged at 3 PM today",
            "Update my dietary preferences to include vegetarian options"
        ]
        
        for i, modification in enumerate(modifications):
            try:
                response = self.session.post(
                    f"{BASE_URL}/ai/chat",
                    json={
                        "message": modification,
                        "conversation_id": f"data_mod_test_{i}"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    ai_response = data.get("response", "")
                    
                    # Check if AI acknowledged the modification
                    success_indicators = [
                        "updated", "changed", "modified", "set", "deleted", "removed",
                        "adjusted", "saved", "confirmed"
                    ]
                    
                    if any(indicator in ai_response.lower() for indicator in success_indicators):
                        self.log_test(f"Data Modification {i+1}", True, f"Modification: '{modification[:40]}...'")
                    else:
                        self.log_test(f"Data Modification {i+1}", False, "Modification not confirmed", {"modification": modification, "response": ai_response})
                else:
                    self.log_test(f"Data Modification {i+1}", False, f"Status: {response.status_code}", response.json())
                    
                time.sleep(1)
                
            except Exception as e:
                self.log_test(f"Data Modification {i+1}", False, f"Exception: {str(e)}")

    def test_conversation_context(self):
        """Test AI's ability to maintain conversation context"""
        print("🧠 Testing Conversation Context...")
        
        # Test with related messages in sequence
        conversation_id = "context_test"
        
        messages = [
            "I want to track my breakfast",
            "I had scrambled eggs",
            "Make that 2.5 servings of scrambled eggs",
            "Also add 1.25 slices of whole grain toast",
            "And 0.75 cups of orange juice",
            "Log all of that for breakfast today",
            "What did I just log?",
            "How many calories was that total?"
        ]
        
        context_preserved = 0
        
        for i, message in enumerate(messages):
            try:
                response = self.session.post(
                    f"{BASE_URL}/ai/chat",
                    json={
                        "message": message,
                        "conversation_id": conversation_id
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    ai_response = data.get("response", "")
                    
                    # Check for context indicators based on message
                    if i == 6:  # "What did I just log?"
                        if "eggs" in ai_response.lower() and "toast" in ai_response.lower():
                            context_preserved += 1
                    elif i == 7:  # "How many calories was that total?"
                        if any(char.isdigit() for char in ai_response):
                            context_preserved += 1
                    
                    self.log_test(f"Context Message {i+1}", True, f"Message: '{message[:30]}...'")
                else:
                    self.log_test(f"Context Message {i+1}", False, f"Status: {response.status_code}", response.json())
                    
                time.sleep(1)
                
            except Exception as e:
                self.log_test(f"Context Message {i+1}", False, f"Exception: {str(e)}")
        
        # Overall context test
        if context_preserved >= 1:
            self.log_test("Conversation Context Preservation", True, f"Context preserved in {context_preserved}/2 key tests")
        else:
            self.log_test("Conversation Context Preservation", False, "Context not properly maintained")

    def test_dashboard_integration(self):
        """Test AI dashboard data integration"""
        print("📈 Testing Dashboard Integration...")
        
        try:
            # Test AI dashboard endpoint
            response = self.session.get(f"{BASE_URL}/ai-dashboard/coaching")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for key dashboard data
                required_fields = ["personalizedInsight", "dailyHealthTip", "urgentAction"]
                
                dashboard_complete = all(field in data for field in required_fields)
                
                if dashboard_complete:
                    # Check AI confidence
                    ai_confidence = data.get("aiConfidence", 0)
                    
                    self.log_test("Dashboard Integration", True, f"Dashboard loaded with AI confidence: {ai_confidence}%")
                else:
                    self.log_test("Dashboard Integration", False, f"Missing fields: {[f for f in required_fields if f not in data]}")
            else:
                self.log_test("Dashboard Integration", False, f"Status: {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Dashboard Integration", False, f"Exception: {str(e)}")

    def generate_report(self):
        """Generate final test report"""
        print("\n" + "="*60)
        print("🎯 UNIFIED AI SYSTEM TEST REPORT")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📊 SUMMARY:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {passed_tests} ✅")
        print(f"   Failed: {failed_tests} ❌")
        print(f"   Pass Rate: {pass_rate:.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
            print()
        
        print("🎯 KEY FUNCTIONALITY STATUS:")
        
        # Group tests by functionality
        functionality_groups = {
            "Authentication": ["Authentication"],
            "AI Chat": [t for t in [r["test"] for r in self.test_results] if "AI Chat" in t],
            "Food Logging (Decimals)": [t for t in [r["test"] for r in self.test_results] if "Food Logging Decimal" in t],
            "Food Indexing (Decimals)": [t for t in [r["test"] for r in self.test_results] if "Food Indexing Decimal" in t],
            "Meal Plans": [t for t in [r["test"] for r in self.test_results] if "Meal Plan" in t],
            "Meal Suggestions": [t for t in [r["test"] for r in self.test_results] if "Meal Suggestion" in t],
            "Water Logging (Decimals)": [t for t in [r["test"] for r in self.test_results] if "Water Logging Decimal" in t],
            "User Data Queries": [t for t in [r["test"] for r in self.test_results] if "User Data Query" in t],
            "Data Modifications": [t for t in [r["test"] for r in self.test_results] if "Data Modification" in t],
            "Conversation Context": [t for t in [r["test"] for r in self.test_results] if "Context" in t],
            "Dashboard Integration": [t for t in [r["test"] for r in self.test_results] if "Dashboard" in t]
        }
        
        for group_name, test_names in functionality_groups.items():
            if test_names:
                group_results = [r for r in self.test_results if r["test"] in test_names]
                group_passed = sum(1 for r in group_results if r["success"])
                group_total = len(group_results)
                group_rate = (group_passed / group_total * 100) if group_total > 0 else 0
                
                status = "✅" if group_rate == 100 else "⚠️" if group_rate >= 50 else "❌"
                print(f"   {status} {group_name}: {group_passed}/{group_total} ({group_rate:.0f}%)")
        
        print("\n" + "="*60)
        
        # Overall system assessment
        if pass_rate >= 90:
            print("🎉 EXCELLENT: Unified AI system is working exceptionally well!")
        elif pass_rate >= 75:
            print("👍 GOOD: Unified AI system is working well with minor issues.")
        elif pass_rate >= 50:
            print("⚠️ NEEDS WORK: Unified AI system has significant issues to address.")
        else:
            print("🚨 CRITICAL: Unified AI system requires major fixes.")
        
        print("="*60)
        
        # Save detailed results
        with open("unified_ai_test_results.json", "w") as f:
            json.dump({
                "summary": {
                    "total_tests": total_tests,
                    "passed_tests": passed_tests,
                    "failed_tests": failed_tests,
                    "pass_rate": pass_rate,
                    "timestamp": datetime.now().isoformat()
                },
                "detailed_results": self.test_results
            }, f, indent=2)
        
        print(f"📁 Detailed results saved to: unified_ai_test_results.json")

    def run_all_tests(self):
        """Run all unified AI tests"""
        print("🚀 Starting Unified AI System Comprehensive Test")
        print("="*60)
        
        # Authentication is required for all tests
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return False
        
        # Run all test suites
        test_suites = [
            self.test_unified_ai_chat,
            self.test_food_logging_with_decimals,
            self.test_food_indexing_with_decimals,
            self.test_meal_plan_operations,
            self.test_meal_suggestions_operations,
            self.test_water_logging_with_decimals,
            self.test_user_data_queries,
            self.test_data_modification_capabilities,
            self.test_conversation_context,
            self.test_dashboard_integration
        ]
        
        for test_suite in test_suites:
            try:
                test_suite()
                time.sleep(2)  # Brief pause between test suites
            except Exception as e:
                print(f"❌ Test suite failed with exception: {str(e)}")
        
        # Generate final report
        self.generate_report()
        return True

if __name__ == "__main__":
    tester = UnifiedAITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
