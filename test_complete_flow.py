#!/usr/bin/env python3
"""
Comprehensive test for new meal suggestion parameters
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

def test_complete_flow():
    """Test the complete flow with all new parameters"""
    print("🔄 Testing Complete Meal Suggestions Flow")
    print("=" * 50)
    
    token = get_auth_token()
    if not token:
        print("❌ Authentication failed")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test scenarios that match frontend options
    test_cases = [
        {
            "name": "Quick Chicken & Vegetable Lunch",
            "payload": {
                "meal_type": "lunch",
                "remaining_calories": 400,
                "prep_time_preference": "quick",
                "main_ingredients": ["chicken", "vegetables"],
                "dietary_preferences": [],
                "allergies": []
            },
            "expected": {
                "prep_time_max": 15,
                "should_contain": ["chicken"]
            }
        },
        {
            "name": "Complex Salmon Dinner",
            "payload": {
                "meal_type": "dinner",
                "remaining_calories": 650,
                "prep_time_preference": "complex",
                "main_ingredients": ["salmon"],
                "dietary_preferences": [],
                "allergies": []
            },
            "expected": {
                "prep_time_min": 45,
                "should_contain": ["salmon"]
            }
        },
        {
            "name": "Moderate Vegetarian Breakfast",
            "payload": {
                "meal_type": "breakfast",
                "remaining_calories": 350,
                "prep_time_preference": "moderate",
                "main_ingredients": ["eggs", "spinach"],
                "dietary_preferences": ["vegetarian"],
                "allergies": []
            },
            "expected": {
                "prep_time_min": 15,
                "prep_time_max": 45,
                "should_contain": ["eggs"]
            }
        },
        {
            "name": "Backward Compatibility Test",
            "payload": {
                "meal_type": "snack",
                "remaining_calories": 200,
                "dietary_preferences": ["vegan"],
                "allergies": []
            },
            "expected": {
                "should_not_contain": ["meat", "dairy", "eggs"]
            }
        }
    ]
    
    results = []
    
    for test_case in test_cases:
        print(f"\n🧪 Testing: {test_case['name']}")
        print(f"📦 Payload: {json.dumps(test_case['payload'], indent=2)}")
        
        try:
            start_time = time.time()
            response = requests.post(
                f"{BASE_URL}/ai/meal-suggestions",
                json=test_case['payload'],
                headers=headers,
                timeout=60
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                suggestions = result.get('suggestions', [])
                
                print(f"✅ Success! Got {len(suggestions)} suggestions in {response_time:.1f}s")
                
                # Validate expectations
                validation_results = []
                
                for i, suggestion in enumerate(suggestions, 1):
                    print(f"   {i}. {suggestion['name']} ({suggestion.get('prep_time', 'N/A')} min)")
                    
                    # Check prep time constraints
                    prep_time = suggestion.get('prep_time', 0)
                    if 'prep_time_max' in test_case['expected']:
                        if prep_time <= test_case['expected']['prep_time_max']:
                            validation_results.append(f"✅ Prep time OK ({prep_time}min ≤ {test_case['expected']['prep_time_max']}min)")
                        else:
                            validation_results.append(f"❌ Prep time too long ({prep_time}min > {test_case['expected']['prep_time_max']}min)")
                    
                    if 'prep_time_min' in test_case['expected']:
                        if prep_time >= test_case['expected']['prep_time_min']:
                            validation_results.append(f"✅ Prep time OK ({prep_time}min ≥ {test_case['expected']['prep_time_min']}min)")
                        else:
                            validation_results.append(f"❌ Prep time too short ({prep_time}min < {test_case['expected']['prep_time_min']}min)")
                    
                    # Check ingredient requirements
                    ingredients_text = ' '.join([ing['name'].lower() for ing in suggestion.get('ingredients', [])])
                    
                    if 'should_contain' in test_case['expected']:
                        for required_ingredient in test_case['expected']['should_contain']:
                            if required_ingredient.lower() in ingredients_text:
                                validation_results.append(f"✅ Contains {required_ingredient}")
                            else:
                                validation_results.append(f"❌ Missing {required_ingredient}")
                
                for validation in validation_results:
                    print(f"      {validation}")
                
                results.append({
                    'test': test_case['name'],
                    'success': True,
                    'response_time': response_time,
                    'suggestions_count': len(suggestions),
                    'validations': validation_results
                })
                
            else:
                print(f"❌ Failed: {response.status_code}")
                print(f"📄 Response: {response.text}")
                results.append({
                    'test': test_case['name'],
                    'success': False,
                    'error': f"HTTP {response.status_code}"
                })
                
        except Exception as e:
            print(f"💥 Error: {e}")
            results.append({
                'test': test_case['name'],
                'success': False,
                'error': str(e)
            })
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary")
    print("=" * 50)
    
    total_tests = len(results)
    passed_tests = sum(1 for r in results if r['success'])
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {total_tests - passed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if passed_tests == total_tests:
        print("\n🎉 All tests passed! New parameters are working correctly.")
    else:
        print(f"\n⚠️  {total_tests - passed_tests} test(s) failed.")
    
    return results

if __name__ == "__main__":
    test_complete_flow()
