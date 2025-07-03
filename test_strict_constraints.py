#!/usr/bin/env python3
"""
Strict constraint compliance test for meal suggestions
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def get_auth_token():
    """Get Firebase auth token"""
    firebase_api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"
    auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={firebase_api_key}"
    
    payload = {
        "email": "IsaacMineo@gmail.com", 
        "password": "Buddydog41",
        "returnSecureToken": True
    }
    
    response = requests.post(auth_url, json=payload)
    return response.json()['idToken'] if response.status_code == 200 else None

def test_strict_constraints():
    """Test that AI strictly follows ALL constraints"""
    print("🔒 Testing STRICT Constraint Compliance")
    print("=" * 50)
    
    token = get_auth_token()
    if not token:
        print("❌ Authentication failed")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Critical test cases for strict compliance
    test_cases = [
        {
            "name": "COMPLEX prep time (must be 45+ min)",
            "payload": {
                "meal_type": "dinner",
                "remaining_calories": 600,
                "prep_time_preference": "complex",
                "main_ingredients": ["beef"],
                "dietary_preferences": [],
                "allergies": []
            },
            "strict_checks": {
                "min_prep_time": 45,
                "required_ingredients": ["beef"]
            }
        },
        {
            "name": "QUICK prep time (must be ≤15 min)",
            "payload": {
                "meal_type": "lunch",
                "remaining_calories": 400,
                "prep_time_preference": "quick",
                "main_ingredients": ["tuna"],
                "dietary_preferences": [],
                "allergies": []
            },
            "strict_checks": {
                "max_prep_time": 15,
                "required_ingredients": ["tuna"]
            }
        },
        {
            "name": "Multiple required ingredients",
            "payload": {
                "meal_type": "breakfast",
                "remaining_calories": 350,
                "prep_time_preference": "moderate",
                "main_ingredients": ["eggs", "cheese", "spinach"],
                "dietary_preferences": [],
                "allergies": []
            },
            "strict_checks": {
                "min_prep_time": 15,
                "max_prep_time": 45,
                "required_ingredients": ["eggs", "cheese", "spinach"]
            }
        }
    ]
    
    violations = []
    
    for test_case in test_cases:
        print(f"\n🧪 Testing: {test_case['name']}")
        print(f"📦 Payload: {json.dumps(test_case['payload'], indent=2)}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/ai/meal-suggestions",
                json=test_case['payload'],
                headers=headers,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                suggestions = result.get('suggestions', [])
                
                print(f"✅ Got {len(suggestions)} suggestions")
                
                for i, suggestion in enumerate(suggestions, 1):
                    name = suggestion['name']
                    prep_time = suggestion.get('prep_time', 0)
                    ingredients_text = ' '.join([ing['name'].lower() for ing in suggestion.get('ingredients', [])])
                    
                    print(f"   {i}. {name} ({prep_time} min)")
                    
                    # Check prep time constraints
                    if 'min_prep_time' in test_case['strict_checks']:
                        min_time = test_case['strict_checks']['min_prep_time']
                        if prep_time < min_time:
                            violation = f"❌ VIOLATION: {name} prep time {prep_time}min < required {min_time}min"
                            print(f"      {violation}")
                            violations.append(violation)
                        else:
                            print(f"      ✅ Prep time OK ({prep_time}min ≥ {min_time}min)")
                    
                    if 'max_prep_time' in test_case['strict_checks']:
                        max_time = test_case['strict_checks']['max_prep_time']
                        if prep_time > max_time:
                            violation = f"❌ VIOLATION: {name} prep time {prep_time}min > required {max_time}min"
                            print(f"      {violation}")
                            violations.append(violation)
                        else:
                            print(f"      ✅ Prep time OK ({prep_time}min ≤ {max_time}min)")
                    
                    # Check required ingredients
                    for required_ingredient in test_case['strict_checks'].get('required_ingredients', []):
                        # More thorough ingredient checking
                        ingredient_variations = [
                            required_ingredient.lower(),
                            required_ingredient.lower() + 's',  # plural
                            required_ingredient.lower().rstrip('s'),  # singular if plural given
                        ]
                        
                        found = any(var in ingredients_text for var in ingredient_variations)
                        
                        if found:
                            print(f"      ✅ Contains {required_ingredient}")
                        else:
                            violation = f"❌ VIOLATION: {name} missing required ingredient '{required_ingredient}'"
                            print(f"      {violation}")
                            violations.append(violation)
                            print(f"         Available ingredients: {ingredients_text}")
                
            else:
                print(f"❌ Failed: {response.status_code}")
                print(f"📄 Response: {response.text}")
                
        except Exception as e:
            print(f"💥 Error: {e}")
    
    # Final verdict
    print("\n" + "=" * 50)
    print("🏁 CONSTRAINT COMPLIANCE REPORT")
    print("=" * 50)
    
    if len(violations) == 0:
        print("🎉 PERFECT! All constraints were strictly followed.")
        print("✅ AI is fully compliant with user filters.")
    else:
        print(f"⚠️  FOUND {len(violations)} CONSTRAINT VIOLATIONS:")
        for violation in violations:
            print(f"   {violation}")
        print("\n🔧 Prompt needs further improvement to ensure strict compliance.")
    
    return len(violations) == 0

if __name__ == "__main__":
    test_strict_constraints()
