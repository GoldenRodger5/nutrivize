"""
Comprehensive testing script for the Nutrivize AI chatbot functionality.
Tests all major features and captures any issues that need to be fixed.
"""
import os
import sys
import json
import traceback
import re
from datetime import datetime, timedelta

# Set up the path to import from backend
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), 'backend')
sys.path.append(backend_dir)

try:
    # Import required modules
    print(f"Importing from: {backend_dir}")
    from app.constants import USER_ID
    from app.chatbot import process_food_operations
    print("Successfully imported required modules")
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

class TestResults:
    """Class to track test results"""
    def __init__(self):
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        self.issues = []

    def record_test(self, test_name, passed, issue=None):
        self.total_tests += 1
        if passed:
            self.passed_tests += 1
            print(f"✅ PASS: {test_name}")
        else:
            self.failed_tests += 1
            print(f"❌ FAIL: {test_name}")
            if issue:
                self.issues.append(f"{test_name}: {issue}")
                print(f"   Issue: {issue}")

    def print_summary(self):
        print("\n===== TEST SUMMARY =====")
        print(f"Total tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.failed_tests}")
        
        if self.issues:
            print("\n===== ISSUES FOUND =====")
            for i, issue in enumerate(self.issues, 1):
                print(f"{i}. {issue}")
        else:
            print("\nNo issues found! All tests passed.")

async def test_chatbot():
    """Run comprehensive tests on the chatbot functionality"""
    results = TestResults()
    
    try:
        # ===== Test Category 1: Food Logging =====
        print("\n===== TESTING FOOD LOGGING =====")
        
        # Test 1.1: Log a simple food item
        test_response = """
        I'll log that apple for you.

        FOOD_LOG: {"name": "Apple", "amount": 1, "meal_type": "Snack", "calories": 95, "proteins": 0.5, "carbs": 25, "fats": 0.3}
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "I've logged" in processed and "Apple" in processed
        results.record_test("Log simple food item", success, None if success else "Failed to log apple as snack")
        
        # Test 1.2: Log food with missing fields (should use defaults)
        test_response = """
        I'll add that to your lunch.

        FOOD_LOG: {"name": "Chicken Salad", "amount": 200, "meal_type": "Lunch"}
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "I've logged" in processed and "Chicken Salad" in processed
        results.record_test("Log food with missing fields", success, None if success else "Failed to handle missing nutritional data")
        
        # ===== Test Category 2: Food Indexing =====
        print("\n===== TESTING FOOD INDEXING =====")
        
        # Test 2.1: Add a new food to the database
        test_response = """
        I'll add that to your food database.

        FOOD_INDEX: {"name": "Greek Yogurt", "serving_size": 100, "serving_unit": "g", "calories": 59, "proteins": 10, "carbs": 3.6, "fats": 0.4}
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "I've added Greek Yogurt to your food database" in processed
        results.record_test("Add food to database", success, None if success else "Failed to add Greek Yogurt to database")
        
        # Test 2.2: List foods in the database
        test_response = """
        Here are the foods in your database:

        FOOD_LIST:
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "food" in processed.lower() and ("database" in processed.lower() or "here are" in processed.lower())
        results.record_test("List foods in database", success, None if success else "Failed to list foods in database")
        
        # Test 2.3: Search for a specific food
        test_response = """
        Here are the matching foods:

        FOOD_LIST: yogurt
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = ("yogurt" in processed.lower() or "greek" in processed.lower()) and not "couldn't find any foods" in processed.lower()
        results.record_test("Search for food", success, None if success else "Failed to search for yogurt in database")
        
        # ===== Test Category 3: Food Index Modification =====
        print("\n===== TESTING FOOD INDEX MODIFICATION =====")
        
        # Test 3.1: Modify an existing food
        test_response = """
        I'll update the nutritional information.

        FOOD_MODIFY: {"name": "Greek Yogurt", "calories": 60, "proteins": 10.5}
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "I've updated Greek Yogurt in your food database" in processed
        results.record_test("Modify food in database", success, None if success else "Failed to update Greek Yogurt")
        
        # Test 3.2: Delete a food
        test_response = """
        I'll remove that from your database.

        FOOD_DELETE: {"name": "Greek Yogurt"}
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "I've deleted" in processed or "I couldn't find" in processed
        results.record_test("Delete food from database", success, None if success else "Failed to handle food deletion")
        
        # ===== Test Category 4: Goal Information and Modification =====
        print("\n===== TESTING GOAL INFORMATION AND MODIFICATION =====")
        
        # Test 4.1: List current goals
        test_response = """
        Here are your current goals:

        GOAL_LIST:
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "goal" in processed.lower()
        results.record_test("List goals", success, None if success else "Failed to list goals")
        
        # Test 4.2: Modify goal - well formed JSON
        test_response = """
        I'll update your calorie target to 2100.

        GOAL_MODIFY: {"goal_id": "6816c44b16cda5d475acf11f", "nutrition_targets": [{"daily_calories": 2100}]}
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "I've updated your goal" in processed
        results.record_test("Update goal with well-formed JSON", success, None if success else "Failed to update goal with well-formed JSON")
        
        # Test 4.3: Modify goal - malformed JSON
        test_response = """
        I'll update your calorie target to 2000.

        GOAL_MODIFY: {"goal_id": "6816c44b16cda5d475acf11f", "nutrition_targets": [{"daily_calories": 2000}
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "I've updated your goal" in processed or "couldn't modify" not in processed
        results.record_test("Update goal with malformed JSON", success, None if success else "Failed to handle malformed JSON")
        
        # ===== Test Category 5: Meal Suggestions =====
        print("\n===== TESTING MEAL SUGGESTIONS =====")
        
        # Test 5.1: Generate a meal suggestion
        test_response = """
        Here's a meal suggestion based on your preferences:

        MEAL_SUGGESTION: {"meal_type": "dinner", "time_of_day": "evening", "preference": "high-protein", "remaining_macros": {"calories": 600, "protein": 40, "carbs": 50, "fat": 20}}
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "meal suggestion" in processed.lower() or "here are some" in processed.lower()
        results.record_test("Generate meal suggestion", success, None if success else "Failed to generate meal suggestion")
        
        # ===== Test Category 6: Meal Planning =====
        print("\n===== TESTING MEAL PLANNING =====")
        
        # Test 6.1: Generate a meal plan
        test_response = """
        I'll create a meal plan for you.

        MEAL_PLAN_GENERATE: {"days": 3, "start_date": "2023-06-01", "preferences": ["high-protein", "low-carb"]}
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "meal plan" in processed.lower() and "day" in processed.lower()
        results.record_test("Generate meal plan", success, None if success else "Failed to generate meal plan")
        
        # Test 6.2: View meal plan
        test_response = """
        Here's your current meal plan:

        MEAL_PLAN_VIEW:
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "meal plan" in processed.lower() or "don't have" in processed.lower()
        results.record_test("View meal plan", success, None if success else "Failed to view meal plan")
        
        # ===== Test Category 7: Complex Scenarios =====
        print("\n===== TESTING COMPLEX SCENARIOS =====")
        
        # Test 7.1: Log food based on meal suggestion
        test_response = """
        I'll log that suggested meal for you.

        FOOD_LOG: {"name": "High Protein Chicken Bowl", "amount": 1, "meal_type": "Dinner", "calories": 550, "proteins": 45, "carbs": 40, "fats": 15}
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "I've logged" in processed and "Chicken Bowl" in processed
        results.record_test("Log suggested meal", success, None if success else "Failed to log suggested meal")
        
        # Test 7.2: Food index operation with error handling
        test_response = """
        I'll add this to your database.

        FOOD_INDEX: {"name": "Incomplete Food Data"}
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "couldn't add" in processed.lower() or "added" in processed.lower()
        results.record_test("Handle incomplete food data", success, None if success else "Failed to handle incomplete food data")
        
        # ===== Test Category 8: Special Operation Formats =====
        print("\n===== TESTING SPECIAL OPERATION FORMATS =====")
        
        # Test 8.1: Single quotes in JSON
        test_response = """
        I'll log this food.

        FOOD_LOG: {'name': 'Banana', 'amount': 1, 'meal_type': 'Snack', 'calories': 105, 'proteins': 1.3, 'carbs': 27, 'fats': 0.4}
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "I've logged" in processed and "Banana" in processed
        results.record_test("Handle single quotes in JSON", success, None if success else "Failed to handle single quotes")
        
        # Test 8.2: JSON with trailing commas
        test_response = """
        I'll add this to your foods.

        FOOD_INDEX: {"name": "Almond Butter", "serving_size": 30, "serving_unit": "g", "calories": 180, "proteins": 7, "carbs": 6, "fats": 16,}
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "I've added" in processed or "couldn't add" in processed
        results.record_test("Handle trailing commas in JSON", success, None if success else "Failed to handle trailing commas")
        
        # ===== Test Category 9: Error Handling =====
        print("\n===== TESTING ERROR HANDLING =====")
        
        # Test 9.1: Non-existent operation
        test_response = """
        Let me try this.

        INVALID_OPERATION: {"test": "data"}
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = processed == test_response or "INVALID_OPERATION" not in processed
        results.record_test("Handle non-existent operation", success, None if success else "Failed to handle invalid operation")
        
        # Test 9.2: Missing required parameters
        test_response = """
        I'll delete this.

        FOOD_DELETE: {}
        """
        
        processed = await process_food_operations(test_response, USER_ID)
        success = "couldn't" in processed.lower() or "need" in processed.lower()
        results.record_test("Handle missing required parameters", success, None if success else "Failed to handle missing parameters")
        
        # ===== Summarize test results =====
        results.print_summary()
        
        return results.passed_tests == results.total_tests
    
    except Exception as e:
        print(f"Error during testing: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import asyncio
    
    print("Starting comprehensive chatbot testing")
    result = asyncio.run(test_chatbot())
    
    if result:
        print("\n✅ All tests passed! The chatbot is functioning correctly.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please see the issues above and fix them.")
        sys.exit(1) 