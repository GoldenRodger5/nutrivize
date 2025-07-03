#!/usr/bin/env python3
"""
Test script to verify that meal suggestions strictly comply with all user filters.
"""

import json
import requests
import time
from typing import List, Dict, Any

def authenticate() -> str:
    """Authenticate with Firebase and return token."""
    auth_data = {
        "email": "IsaacMineo@gmail.com",
        "password": "password123",
        "returnSecureToken": True
    }
    
    response = requests.post(
        "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDT3GnIHVS6AZOQl3NDKhiqEFV2GU8Y4Q8",
        json=auth_data
    )
    
    if response.status_code == 200:
        return response.json()['idToken']
    else:
        raise Exception(f"Authentication failed: {response.text}")

def get_meal_suggestions(token: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Get meal suggestions from the API."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        "http://localhost:8000/ai/meal-suggestions",
        json=payload,
        headers=headers,
        timeout=60
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"API call failed: {response.status_code} - {response.text}")

def check_compliance(suggestions: List[Dict[str, Any]], expected_filters: Dict[str, Any]) -> Dict[str, List[str]]:
    """Check if suggestions comply with all filters."""
    issues = []
    passed = []
    
    for i, suggestion in enumerate(suggestions):
        suggestion_name = suggestion.get('name', f'Suggestion {i+1}')
        
        # Check calories compliance
        nutrition = suggestion.get('nutrition', {})
        calories = nutrition.get('calories', 0)
        max_calories = expected_filters.get('remaining_calories', float('inf'))
        
        if calories > max_calories:
            issues.append(f"{suggestion_name}: Exceeds calorie limit ({calories} > {max_calories})")
        else:
            passed.append(f"{suggestion_name}: Calories within limit ({calories} <= {max_calories})")
        
        # Check prep time compliance
        prep_time = suggestion.get('prep_time', 0)
        prep_preference = expected_filters.get('prep_time_preference')
        
        if prep_preference == 'quick' and prep_time > 20:
            issues.append(f"{suggestion_name}: Prep time too long for 'quick' preference ({prep_time} minutes)")
        elif prep_preference == 'moderate' and prep_time > 45:
            issues.append(f"{suggestion_name}: Prep time too long for 'moderate' preference ({prep_time} minutes)")
        else:
            passed.append(f"{suggestion_name}: Prep time appropriate for '{prep_preference}' ({prep_time} minutes)")
        
        # Check main ingredients compliance
        main_ingredients = expected_filters.get('main_ingredients', [])
        if main_ingredients:
            ingredients_list = [ing.get('name', '').lower() for ing in suggestion.get('ingredients', [])]
            ingredients_text = (suggestion.get('name', '') + ' ' + suggestion.get('description', '')).lower()
            
            found_ingredients = []
            for main_ing in main_ingredients:
                main_ing_lower = main_ing.lower()
                if any(main_ing_lower in ing for ing in ingredients_list) or main_ing_lower in ingredients_text:
                    found_ingredients.append(main_ing)
            
            if len(found_ingredients) < len(main_ingredients):
                missing = set(main_ingredients) - set(found_ingredients)
                issues.append(f"{suggestion_name}: Missing required main ingredients: {missing}")
            else:
                passed.append(f"{suggestion_name}: Contains all required main ingredients: {found_ingredients}")
        
        # Check dietary preferences compliance
        dietary_prefs = expected_filters.get('dietary_preferences', [])
        for pref in dietary_prefs:
            if pref.lower() == 'vegetarian':
                meat_keywords = ['chicken', 'beef', 'pork', 'fish', 'turkey', 'lamb', 'seafood']
                has_meat = any(keyword in ingredients_text for keyword in meat_keywords)
                if has_meat:
                    issues.append(f"{suggestion_name}: Contains meat but user is vegetarian")
                else:
                    passed.append(f"{suggestion_name}: Vegetarian compliant")
            
            if pref.lower() == 'vegan':
                animal_keywords = ['chicken', 'beef', 'pork', 'fish', 'turkey', 'lamb', 'seafood', 'dairy', 'milk', 'cheese', 'yogurt', 'egg']
                has_animal = any(keyword in ingredients_text for keyword in animal_keywords)
                if has_animal:
                    issues.append(f"{suggestion_name}: Contains animal products but user is vegan")
                else:
                    passed.append(f"{suggestion_name}: Vegan compliant")
        
        # Check allergies compliance
        allergies = expected_filters.get('allergies', [])
        for allergy in allergies:
            allergy_lower = allergy.lower()
            if allergy_lower in ingredients_text:
                issues.append(f"{suggestion_name}: Contains allergen '{allergy}' which user is allergic to")
            else:
                passed.append(f"{suggestion_name}: Free of allergen '{allergy}'")
    
    return {'issues': issues, 'passed': passed}

def run_test(test_name: str, payload: Dict[str, Any]) -> bool:
    """Run a single test case."""
    print(f"\n{'='*60}")
    print(f"🧪 TEST: {test_name}")
    print(f"{'='*60}")
    print(f"📦 Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = get_meal_suggestions(token, payload)
        suggestions = response.get('suggestions', [])
        
        print(f"✅ Got {len(suggestions)} suggestions")
        
        # Check compliance
        compliance = check_compliance(suggestions, payload)
        
        print(f"\n✅ PASSED CHECKS ({len(compliance['passed'])}):")
        for check in compliance['passed']:
            print(f"   ✓ {check}")
        
        if compliance['issues']:
            print(f"\n❌ FAILED CHECKS ({len(compliance['issues'])}):")
            for issue in compliance['issues']:
                print(f"   ✗ {issue}")
            return False
        else:
            print(f"\n🎉 ALL CHECKS PASSED! AI strictly followed all filters.")
            return True
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

if __name__ == "__main__":
    print("🔐 Authenticating...")
    token = authenticate()
    print("✅ Authentication successful!")
    
    # Test cases to verify strict compliance
    test_cases = [
        {
            "name": "Quick Prep + Chicken & Vegetables",
            "payload": {
                "meal_type": "lunch",
                "remaining_calories": 400,
                "dietary_preferences": [],
                "allergies": [],
                "prep_time_preference": "quick",
                "main_ingredients": ["chicken", "vegetables"]
            }
        },
        {
            "name": "Moderate Prep + Vegetarian + No Nuts",
            "payload": {
                "meal_type": "dinner",
                "remaining_calories": 600,
                "dietary_preferences": ["vegetarian"],
                "allergies": ["nuts"],
                "prep_time_preference": "moderate",
                "main_ingredients": ["tofu", "spinach"]
            }
        },
        {
            "name": "Quick Prep + Vegan + Multiple Allergies",
            "payload": {
                "meal_type": "breakfast",
                "remaining_calories": 350,
                "dietary_preferences": ["vegan"],
                "allergies": ["gluten", "soy"],
                "prep_time_preference": "quick",
                "main_ingredients": ["oats", "berries"]
            }
        },
        {
            "name": "Low Calorie + Seafood Focus",
            "payload": {
                "meal_type": "lunch",
                "remaining_calories": 300,
                "dietary_preferences": [],
                "allergies": [],
                "prep_time_preference": "quick",
                "main_ingredients": ["salmon", "broccoli", "quinoa"]
            }
        }
    ]
    
    passed_tests = 0
    total_tests = len(test_cases)
    
    for test_case in test_cases:
        if run_test(test_case["name"], test_case["payload"]):
            passed_tests += 1
        time.sleep(2)  # Brief pause between tests
    
    print(f"\n{'='*60}")
    print(f"🏁 FINAL RESULTS")
    print(f"{'='*60}")
    print(f"✅ Passed: {passed_tests}/{total_tests}")
    print(f"❌ Failed: {total_tests - passed_tests}/{total_tests}")
    
    if passed_tests == total_tests:
        print(f"🎉 ALL TESTS PASSED! AI is strictly following all user filters.")
    else:
        print(f"⚠️  Some tests failed. AI needs improvement for strict compliance.")
