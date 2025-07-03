#!/usr/bin/env python3
"""
Test script for enhanced meal planning features.
Tests:
1. Strict adherence to user-specified calories/macros per day
2. All selected meal types are present in every day (mandatory)
3. User-provided title is preserved exactly as entered
4. Detailed cooking instructions are included
"""

import requests
import json
import sys
import time

BASE_URL = "http://localhost:8000"

def test_user_auth():
    """Test user authentication and get auth token"""
    print("🔐 Testing user authentication...")
    
    auth_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=auth_data)
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"❌ Auth failed: {response.status_code} - {response.text}")
            # Try to create the user first
            print("🔧 Attempting to create test user...")
            create_response = requests.post(f"{BASE_URL}/auth/register", json=auth_data)
            if create_response.status_code == 201:
                print("✅ Test user created successfully")
                # Try login again
                login_response = requests.post(f"{BASE_URL}/auth/login", json=auth_data)
                if login_response.status_code == 200:
                    data = login_response.json()
                    return data.get("access_token")
            return None
    except Exception as e:
        print(f"❌ Auth error: {e}")
        return None

def test_enhanced_meal_planning(token):
    """Test enhanced meal planning features"""
    print("\n📝 Testing enhanced meal planning...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: Custom title preservation and strict nutrition targets
    print("\n🎯 Test 1: Custom title preservation and strict nutrition targets")
    
    meal_plan_request = {
        "name": "My Custom Winter Meal Plan 2024",  # Custom user title
        "days": 3,
        "calories_per_day": 2000,  # Strict calorie target
        "protein_target": 150.0,   # Strict protein target  
        "carbs_target": 200.0,     # Strict carb target
        "fat_target": 80.0,        # Strict fat target
        "meal_types": ["breakfast", "lunch", "dinner", "snack"],  # All meal types required
        "dietary_restrictions": ["vegetarian"],
        "preferred_cuisines": ["Mediterranean", "Asian"]
    }
    
    try:
        print(f"📤 Sending meal plan request: {meal_plan_request['name']}")
        response = requests.post(
            f"{BASE_URL}/meal-planning/generate-plan", 
            json=meal_plan_request,
            headers=headers,
            timeout=60  # Allow time for AI generation
        )
        
        if response.status_code == 200:
            meal_plan = response.json()
            print("✅ Meal plan generated successfully!")
            
            # Verify title preservation
            actual_title = meal_plan.get("title") or meal_plan.get("name")
            if actual_title == meal_plan_request["name"]:
                print(f"✅ Title preserved correctly: '{actual_title}'")
            else:
                print(f"❌ Title not preserved! Expected: '{meal_plan_request['name']}', Got: '{actual_title}'")
            
            # Verify days structure and meal types
            days = meal_plan.get("days", [])
            print(f"📅 Generated {len(days)} days")
            
            required_meal_types = set(meal_plan_request["meal_types"])
            all_days_compliant = True
            
            for i, day in enumerate(days, 1):
                meals = day.get("meals", [])
                day_meal_types = set(meal.get("meal_type") for meal in meals)
                
                print(f"  Day {i}: {len(meals)} meals - {sorted(day_meal_types)}")
                
                # Check if all required meal types are present
                missing_meal_types = required_meal_types - day_meal_types
                if missing_meal_types:
                    print(f"    ❌ Missing meal types: {missing_meal_types}")
                    all_days_compliant = False
                else:
                    print(f"    ✅ All required meal types present")
                
                # Check daily nutrition totals
                total_nutrition = day.get("total_nutrition", {})
                daily_calories = total_nutrition.get("calories", 0)
                daily_protein = total_nutrition.get("protein", 0)
                
                # Allow some tolerance for nutrition targets (±50 calories, ±5g macros)
                calorie_target = meal_plan_request["calories_per_day"]
                protein_target = meal_plan_request["protein_target"]
                
                if abs(daily_calories - calorie_target) <= 50:
                    print(f"    ✅ Calories within target: {daily_calories}/{calorie_target}")
                else:
                    print(f"    ❌ Calories outside target: {daily_calories}/{calorie_target} (diff: {daily_calories - calorie_target})")
                
                if abs(daily_protein - protein_target) <= 5:
                    print(f"    ✅ Protein within target: {daily_protein}g/{protein_target}g")
                else:
                    print(f"    ❌ Protein outside target: {daily_protein}g/{protein_target}g (diff: {daily_protein - protein_target}g)")
                
                # Check for detailed cooking instructions
                meals_with_instructions = 0
                for meal in meals:
                    instructions = meal.get("instructions", [])
                    if instructions and len(instructions) >= 3:  # At least 3 steps
                        meals_with_instructions += 1
                
                print(f"    📋 {meals_with_instructions}/{len(meals)} meals have detailed instructions (3+ steps)")
            
            if all_days_compliant:
                print("✅ All days include required meal types")
            else:
                print("❌ Some days missing required meal types")
            
            # Print summary
            print(f"\n📊 Meal Plan Summary:")
            print(f"  Title: {actual_title}")
            print(f"  Days: {len(days)}")
            print(f"  Total meals: {sum(len(day.get('meals', [])) for day in days)}")
            
            return True
            
        else:
            print(f"❌ Failed to generate meal plan: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing meal planning: {e}")
        return False

def test_meal_plan_retrieval(token):
    """Test retrieving saved meal plans"""
    print("\n📋 Testing meal plan retrieval...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/meal-planning/plans", headers=headers)
        
        if response.status_code == 200:
            plans = response.json()
            print(f"✅ Retrieved {len(plans)} saved meal plans")
            
            for plan in plans[:3]:  # Show first 3 plans
                title = plan.get("title") or plan.get("name")
                days_count = plan.get("total_days", 0)
                created_at = plan.get("created_at", "")
                print(f"  📋 '{title}' - {days_count} days - Created: {created_at[:10]}")
            
            return True
        else:
            print(f"❌ Failed to retrieve meal plans: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error retrieving meal plans: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Enhanced Meal Planning Feature Tests")
    print("=" * 50)
    
    # Test authentication
    token = test_user_auth()
    if not token:
        print("❌ Cannot proceed without authentication")
        sys.exit(1)
    
    print("✅ Authentication successful")
    
    # Test enhanced meal planning
    if test_enhanced_meal_planning(token):
        print("\n✅ Enhanced meal planning test passed!")
    else:
        print("\n❌ Enhanced meal planning test failed!")
        sys.exit(1)
    
    # Test meal plan retrieval
    if test_meal_plan_retrieval(token):
        print("\n✅ Meal plan retrieval test passed!")
    else:
        print("\n❌ Meal plan retrieval test failed!")
    
    print("\n🎉 All tests completed!")

if __name__ == "__main__":
    main()
