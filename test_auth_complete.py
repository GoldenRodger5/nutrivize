#!/usr/bin/env python3
"""
Comprehensive authentication and endpoint test for Nutrivize V2
This script will:
1. Test Firebase authentication with provided credentials
2. Get Firebase token
3. Test all backend endpoints with the token
"""

import requests
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
import os
import json
from datetime import datetime, date, timedelta

def setup_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Use the service account from environment
        service_account_path = "/Users/isaacmineo/Main/projects/nutrivize-v2/backend/food-tracker-6096d-firebase-adminsdk-fbsvc-6d95aba762.json"
        
        if not os.path.exists(service_account_path):
            print(f"❌ Firebase service account file not found: {service_account_path}")
            return False
            
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK initialized")
        return True
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        return False

def get_firebase_token(email, password):
    """Get Firebase token using Firebase Auth REST API"""
    try:
        # Firebase Auth REST API endpoint
        api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"  # Correct API key from .env
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
        
        payload = {
            "email": email,
            "password": password,
            "returnSecureToken": True
        }
        
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('idToken')
            print(f"✅ Got Firebase token: {token[:50]}...")
            return token
        else:
            print(f"❌ Firebase authentication failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting Firebase token: {e}")
        return None

def test_backend_health():
    """Test backend health endpoint"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend health check passed")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend not reachable: {e}")
        return False

def test_protected_endpoints(token):
    """Test all protected endpoints with token"""
    base_url = "http://localhost:8000"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    tests = []
    created_food_id = None
    created_log_id = None
    created_goal_id = None
    meal_plan = None
    
    print("\n🔒 Testing protected endpoints...")
    
    # AUTH ENDPOINTS
    print("\n📁 Testing AUTH endpoints...")
    
    # Test 1: Get current user
    try:
        response = requests.get(f"{base_url}/auth/me", headers=headers)
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ GET /auth/me: {user_data.get('email')}")
            tests.append(("GET /auth/me", True, user_data.get('email')))
        else:
            print(f"❌ /auth/me failed: {response.status_code} - {response.text}")
            tests.append(("GET /auth/me", False, response.text))
    except Exception as e:
        print(f"❌ /auth/me error: {e}")
        tests.append(("GET /auth/me", False, str(e)))
    
    # Test 2: Verify token
    try:
        response = requests.get(f"{base_url}/auth/verify", headers=headers)
        if response.status_code == 200:
            print(f"✅ GET /auth/verify: Token valid")
            tests.append(("GET /auth/verify", True, "Token valid"))
        else:
            print(f"❌ /auth/verify failed: {response.status_code} - {response.text}")
            tests.append(("GET /auth/verify", False, response.text))
    except Exception as e:
        print(f"❌ /auth/verify error: {e}")
        tests.append(("GET /auth/verify", False, str(e)))

    # FOODS ENDPOINTS
    print("\n🍎 Testing FOODS endpoints...")
    
    # Test 3: Search foods
    try:
        response = requests.get(f"{base_url}/foods/search?q=apple&limit=5", headers=headers)
        if response.status_code == 200:
            foods = response.json()
            print(f"✅ GET /foods/search: Found {len(foods)} foods")
            tests.append(("GET /foods/search", True, f"Found {len(foods)} foods"))
        else:
            print(f"❌ /foods/search failed: {response.status_code} - {response.text}")
            tests.append(("GET /foods/search", False, response.text))
    except Exception as e:
        print(f"❌ /foods/search error: {e}")
        tests.append(("GET /foods/search", False, str(e)))

    # Test 4: Create food item
    try:
        food_data = {
            "name": "Test Apple",
            "brand": "Test Brand",
            "serving_size": 1.0,
            "serving_unit": "medium",
            "nutrition": {
                "calories": 95,
                "protein": 0.5,
                "carbs": 25,
                "fat": 0.3,
                "fiber": 4,
                "sugar": 19,
                "sodium": 2
            },
            "barcode": "123456789012",
            "category": "fruits",
            "is_verified": False
        }
        response = requests.post(f"{base_url}/foods/", headers=headers, json=food_data)
        if response.status_code == 200:
            food_result = response.json()
            created_food_id = food_result.get('id')
            print(f"✅ POST /foods/: Created food {created_food_id}")
            tests.append(("POST /foods/", True, f"Created food {created_food_id}"))
        else:
            print(f"❌ POST /foods/ failed: {response.status_code} - {response.text}")
            tests.append(("POST /foods/", False, response.text))
    except Exception as e:
        print(f"❌ POST /foods/ error: {e}")
        tests.append(("POST /foods/", False, str(e)))

    # Test 5: Get food item by ID (if we created one)
    if created_food_id:
        try:
            response = requests.get(f"{base_url}/foods/{created_food_id}", headers=headers)
            if response.status_code == 200:
                food_data = response.json()
                print(f"✅ GET /foods/{{id}}: Retrieved {food_data.get('name')}")
                tests.append(("GET /foods/{id}", True, f"Retrieved {food_data.get('name')}"))
            else:
                print(f"❌ GET /foods/{{id}} failed: {response.status_code} - {response.text}")
                tests.append(("GET /foods/{id}", False, response.text))
        except Exception as e:
            print(f"❌ GET /foods/{{id}} error: {e}")
            tests.append(("GET /foods/{id}", False, str(e)))

    # FOOD LOGS ENDPOINTS
    print("\n📝 Testing FOOD LOGS endpoints...")
    
    # Test 6: Get daily food logs
    try:
        today = date.today().isoformat()
        response = requests.get(f"{base_url}/food-logs/daily/{today}", headers=headers)
        if response.status_code == 200:
            daily_logs = response.json()
            print(f"✅ GET /food-logs/daily: {len(daily_logs.get('food_logs', []))} logs today")
            tests.append(("GET /food-logs/daily", True, f"{len(daily_logs.get('food_logs', []))} logs"))
        else:
            print(f"❌ /food-logs/daily failed: {response.status_code} - {response.text}")
            tests.append(("GET /food-logs/daily", False, response.text))
    except Exception as e:
        print(f"❌ /food-logs/daily error: {e}")
        tests.append(("GET /food-logs/daily", False, str(e)))
    
    # Test 7: Create a food log entry
    try:
        log_data = {
            "food_id": created_food_id or "test_food_001",
            "food_name": "Test Apple",
            "amount": 1.0,
            "unit": "medium",
            "meal_type": "snack",
            "nutrition": {
                "calories": 95,
                "protein": 0.5,
                "carbs": 25,
                "fat": 0.3,
                "fiber": 4,
                "sugar": 19,
                "sodium": 2
            },
            "date": date.today().isoformat()
        }
        
        response = requests.post(f"{base_url}/food-logs/", headers=headers, json=log_data)
        if response.status_code == 200:
            log_result = response.json()
            created_log_id = log_result.get('id')
            print(f"✅ POST /food-logs/: Created log {created_log_id}")
            tests.append(("POST /food-logs/", True, f"Created log {created_log_id}"))
        else:
            print(f"❌ POST /food-logs/ failed: {response.status_code} - {response.text}")
            tests.append(("POST /food-logs/", False, response.text))
    except Exception as e:
        print(f"❌ POST /food-logs/ error: {e}")
        tests.append(("POST /food-logs/", False, str(e)))

    # Test 8: Get date range logs
    try:
        start_date = date.today().isoformat()
        end_date = date.today().isoformat()
        response = requests.get(f"{base_url}/food-logs/range?start_date={start_date}&end_date={end_date}", headers=headers)
        if response.status_code == 200:
            range_logs = response.json()
            print(f"✅ GET /food-logs/range: {len(range_logs)} days")
            tests.append(("GET /food-logs/range", True, f"{len(range_logs)} days"))
        else:
            print(f"❌ /food-logs/range failed: {response.status_code} - {response.text}")
            tests.append(("GET /food-logs/range", False, response.text))
    except Exception as e:
        print(f"❌ /food-logs/range error: {e}")
        tests.append(("GET /food-logs/range", False, str(e)))

    # Test 21: Get daily logs with goal progress
    try:
        today = date.today().isoformat()
        response = requests.get(f"{base_url}/food-logs/daily/{today}/with-goals", headers=headers)
        if response.status_code == 200:
            goal_data = response.json()
            has_progress = goal_data.get('goal_progress') is not None
            print(f"✅ GET /food-logs/daily/with-goals: Goal progress {'available' if has_progress else 'not available'}")
            tests.append(("GET /food-logs/daily/with-goals", True, f"Goal progress {'available' if has_progress else 'not available'}"))
        else:
            print(f"❌ /food-logs/daily/with-goals failed: {response.status_code} - {response.text}")
            tests.append(("GET /food-logs/daily/with-goals", False, response.text))
    except Exception as e:
        print(f"❌ /food-logs/daily/with-goals error: {e}")
        tests.append(("GET /food-logs/daily/with-goals", False, str(e)))

    # GOALS ENDPOINTS
    print("\n🎯 Testing GOALS endpoints...")
    
    # Test 9: Get user goals
    try:
        response = requests.get(f"{base_url}/goals/", headers=headers)
        if response.status_code == 200:
            goals = response.json()
            print(f"✅ GET /goals/: {len(goals)} goals found")
            tests.append(("GET /goals/", True, f"{len(goals)} goals"))
        else:
            print(f"❌ /goals/ failed: {response.status_code} - {response.text}")
            tests.append(("GET /goals/", False, response.text))
    except Exception as e:
        print(f"❌ /goals/ error: {e}")
        tests.append(("GET /goals/", False, str(e)))

    # Test 10: Create a goal
    try:
        goal_data = {
            "title": "Test Weight Loss Goal",
            "goal_type": "weight_loss",
            "start_date": date.today().isoformat(),
            "end_date": (date.today() + timedelta(days=90)).isoformat(),
            "weight_target": {
                "current_weight": 80.0,
                "target_weight": 70.0,
                "weekly_rate": 0.5
            },
            "nutrition_targets": {
                "calories": 2000,
                "protein": 150,
                "carbs": 200,
                "fat": 65,
                "fiber": 30
            }
        }
        
        response = requests.post(f"{base_url}/goals/", headers=headers, json=goal_data)
        if response.status_code == 200:
            goal_result = response.json()
            created_goal_id = goal_result.get('id')
            print(f"✅ POST /goals/: Created goal {created_goal_id}")
            tests.append(("POST /goals/", True, f"Created goal {created_goal_id}"))
        else:
            print(f"❌ POST /goals/ failed: {response.status_code} - {response.text}")
            tests.append(("POST /goals/", False, response.text))
    except Exception as e:
        print(f"❌ POST /goals/ error: {e}")
        tests.append(("POST /goals/", False, str(e)))

    # Test 11: Get active goal
    try:
        response = requests.get(f"{base_url}/goals/active", headers=headers)
        if response.status_code == 200:
            active_goal = response.json()
            print(f"✅ GET /goals/active: {active_goal.get('title', 'No active goal')}")
            tests.append(("GET /goals/active", True, active_goal.get('title', 'No active goal')))
        else:
            print(f"❌ /goals/active failed: {response.status_code} - {response.text}")
            tests.append(("GET /goals/active", False, response.text))
    except Exception as e:
        print(f"❌ /goals/active error: {e}")
        tests.append(("GET /goals/active", False, str(e)))

    # AI ENDPOINTS
    print("\n🤖 Testing AI endpoints...")
    
    # Test 12: Chat with AI
    try:
        chat_data = {
            "message": "What are the benefits of eating apples?",
            "conversation_history": []
        }
        response = requests.post(f"{base_url}/ai/chat", headers=headers, json=chat_data)
        if response.status_code == 200:
            chat_result = response.json()
            print(f"✅ POST /ai/chat: Got response ({len(chat_result.get('response', ''))} chars)")
            tests.append(("POST /ai/chat", True, f"Response length: {len(chat_result.get('response', ''))}"))
        else:
            print(f"❌ POST /ai/chat failed: {response.status_code} - {response.text}")
            tests.append(("POST /ai/chat", False, response.text))
    except Exception as e:
        print(f"❌ POST /ai/chat error: {e}")
        tests.append(("POST /ai/chat", False, str(e)))

    # Test 13: Meal suggestions
    try:
        meal_suggestion_data = {
            "meal_type": "lunch",
            "remaining_calories": 400,
            "remaining_protein": 20,
            "dietary_preferences": ["vegetarian"],
            "allergies": []
        }
        response = requests.post(f"{base_url}/ai/meal-suggestions", headers=headers, json=meal_suggestion_data)
        if response.status_code == 200:
            suggestions = response.json()
            print(f"✅ POST /ai/meal-suggestions: {len(suggestions.get('suggestions', []))} suggestions")
            tests.append(("POST /ai/meal-suggestions", True, f"{len(suggestions.get('suggestions', []))} suggestions"))
        else:
            print(f"❌ POST /ai/meal-suggestions failed: {response.status_code} - {response.text}")
            tests.append(("POST /ai/meal-suggestions", False, response.text))
    except Exception as e:
        print(f"❌ POST /ai/meal-suggestions error: {e}")
        tests.append(("POST /ai/meal-suggestions", False, str(e)))

    # ANALYTICS ENDPOINTS
    print("\n📊 Testing ANALYTICS endpoints...")
    
    # Test 14: Weekly summary
    try:
        response = requests.get(f"{base_url}/analytics/weekly-summary", headers=headers)
        if response.status_code == 200:
            summary = response.json()
            print(f"✅ GET /analytics/weekly-summary: Got summary")
            tests.append(("GET /analytics/weekly-summary", True, "Got summary"))
        else:
            print(f"❌ /analytics/weekly-summary failed: {response.status_code} - {response.text}")
            tests.append(("GET /analytics/weekly-summary", False, response.text))
    except Exception as e:
        print(f"❌ /analytics/weekly-summary error: {e}")
        tests.append(("GET /analytics/weekly-summary", False, str(e)))

    # Test 15: Monthly summary
    try:
        response = requests.get(f"{base_url}/analytics/monthly-summary", headers=headers)
        if response.status_code == 200:
            summary = response.json()
            print(f"✅ GET /analytics/monthly-summary: Got summary")
            tests.append(("GET /analytics/monthly-summary", True, "Got summary"))
        else:
            print(f"❌ /analytics/monthly-summary failed: {response.status_code} - {response.text}")
            tests.append(("GET /analytics/monthly-summary", False, response.text))
    except Exception as e:
        print(f"❌ /analytics/monthly-summary error: {e}")
        tests.append(("GET /analytics/monthly-summary", False, str(e)))

    # MEAL PLANNING ENDPOINTS
    print("\n🍽️ Testing MEAL PLANNING endpoints...")
    
    created_meal_plan = None
    
    # Test 16: Generate meal plan
    try:
        meal_plan_data = {
            "days": 3,
            "dietary_restrictions": ["vegetarian"],
            "preferred_cuisines": ["mediterranean"],
            "calories_per_day": 2000,
            "protein_target": 100,
            "meal_types": ["breakfast", "lunch", "dinner"]
        }
        response = requests.post(f"{base_url}/meal-planning/generate-plan", headers=headers, json=meal_plan_data)
        if response.status_code == 200:
            created_meal_plan = response.json()
            print(f"✅ POST /meal-planning/generate: Generated {len(created_meal_plan.get('days', []))} day plan")
            tests.append(("POST /meal-planning/generate-plan", True, f"{len(created_meal_plan.get('days', []))} days"))
        else:
            print(f"❌ POST /meal-planning/generate failed: {response.status_code} - {response.text}")
            tests.append(("POST /meal-planning/generate-plan", False, response.text))
    except Exception as e:
        print(f"❌ POST /meal-planning/generate error: {e}")
        tests.append(("POST /meal-planning/generate-plan", False, str(e)))

    # Test 17: Quick meal suggestion
    try:
        quick_meal_data = {
            "meal_type": "dinner",
            "dietary_restrictions": [],
            "max_prep_time": 30,
            "cuisine_preference": "italian"
        }
        response = requests.post(f"{base_url}/meal-planning/quick-suggestion", headers=headers, json=quick_meal_data)
        if response.status_code == 200:
            quick_meal = response.json()
            print(f"✅ POST /meal-planning/quick-suggestion: {quick_meal.get('meal_name', 'Got suggestion')}")
            tests.append(("POST /meal-planning/quick-suggestion", True, quick_meal.get('meal_name', 'Got suggestion')))
        else:
            print(f"❌ POST /meal-planning/quick-suggestion failed: {response.status_code} - {response.text}")
            tests.append(("POST /meal-planning/quick-suggestion", False, response.text))
    except Exception as e:
        print(f"❌ POST /meal-planning/quick-suggestion error: {e}")
        tests.append(("POST /meal-planning/quick-suggestion", False, str(e)))

    # Test 22: Get shopping list for meal plan (if we created one)
    if created_meal_plan and created_meal_plan.get('plan_id'):
        try:
            plan_id = created_meal_plan['plan_id']
            response = requests.post(f"{base_url}/meal-planning/plans/{plan_id}/shopping-list", headers=headers)
            if response.status_code == 200:
                shopping_list = response.json()
                item_count = len(shopping_list.get('items', []))
                total_cost = shopping_list.get('total_estimated_cost', 0)
                print(f"✅ POST /meal-planning/plans/shopping-list: {item_count} items, ${total_cost}")
                tests.append(("POST /meal-planning/plans/shopping-list", True, f"{item_count} items, ${total_cost}"))
            else:
                print(f"❌ /meal-planning/plans/shopping-list failed: {response.status_code} - {response.text}")
                tests.append(("POST /meal-planning/plans/shopping-list", False, response.text))
        except Exception as e:
            print(f"❌ /meal-planning/plans/shopping-list error: {e}")
            tests.append(("POST /meal-planning/plans/shopping-list", False, str(e)))

    # PREFERENCES ENDPOINTS
    print("\n⚙️ Testing PREFERENCES endpoints...")
    
    # Test 18: Get dietary preferences
    try:
        response = requests.get(f"{base_url}/preferences/dietary", headers=headers)
        if response.status_code == 200:
            prefs = response.json()
            print(f"✅ GET /preferences/dietary: Got dietary preferences")
            tests.append(("GET /preferences/dietary", True, "Got dietary preferences"))
        else:
            print(f"❌ /preferences/dietary failed: {response.status_code} - {response.text}")
            tests.append(("GET /preferences/dietary", False, response.text))
    except Exception as e:
        print(f"❌ /preferences/dietary error: {e}")
        tests.append(("GET /preferences/dietary", False, str(e)))

    # Test 19: Update dietary preferences
    try:
        dietary_prefs = {
            "dietary_restrictions": ["vegetarian"],
            "allergens": ["nuts"],
            "disliked_foods": ["mushrooms"],
            "preferred_cuisines": ["mediterranean", "italian"],
            "cooking_skill_level": "intermediate",
            "max_prep_time": 45,
            "budget_preference": "moderate"
        }
        response = requests.put(f"{base_url}/preferences/dietary", headers=headers, json=dietary_prefs)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ PUT /preferences/dietary: Updated preferences")
            tests.append(("PUT /preferences/dietary", True, "Updated preferences"))
        else:
            print(f"❌ PUT /preferences/dietary failed: {response.status_code} - {response.text}")
            tests.append(("PUT /preferences/dietary", False, response.text))
    except Exception as e:
        print(f"❌ PUT /preferences/dietary error: {e}")
        tests.append(("PUT /preferences/dietary", False, str(e)))

    # Test 20: Get nutrition preferences
    try:
        response = requests.get(f"{base_url}/preferences/nutrition", headers=headers)
        if response.status_code == 200:
            prefs = response.json()
            print(f"✅ GET /preferences/nutrition: Got nutrition preferences")
            tests.append(("GET /preferences/nutrition", True, "Got nutrition preferences"))
        else:
            print(f"❌ /preferences/nutrition failed: {response.status_code} - {response.text}")
            tests.append(("GET /preferences/nutrition", False, response.text))
    except Exception as e:
        print(f"❌ /preferences/nutrition error: {e}")
        tests.append(("GET /preferences/nutrition", False, str(e)))
    
    # Test 23: Update goal (if we created one)
    if created_goal_id:
        try:
            goal_updates = {
                "title": "Updated Test Weight Loss Goal",
                "nutrition_targets": {
                    "calories": 1800,  # Updated target
                    "protein": 140,
                    "carbs": 180,
                    "fat": 60,
                    "fiber": 25
                }
            }
            response = requests.put(f"{base_url}/goals/{created_goal_id}", headers=headers, json=goal_updates)
            if response.status_code == 200:
                updated_goal = response.json()
                print(f"✅ PUT /goals/{{id}}: Updated goal {created_goal_id}")
                tests.append(("PUT /goals/{id}", True, f"Updated goal {created_goal_id}"))
            else:
                print(f"❌ PUT /goals/{{id}} failed: {response.status_code} - {response.text}")
                tests.append(("PUT /goals/{id}", False, response.text))
        except Exception as e:
            print(f"❌ PUT /goals/{{id}} error: {e}")
            tests.append(("PUT /goals/{id}", False, str(e)))

    # Test 24: Calculate nutrition targets
    try:
        calculation_data = {
            "age": 30,
            "weight": 70,
            "height": 175,
            "gender": "male",
            "activity_level": "moderate",
            "goal_type": "weight_loss"
        }
        response = requests.post(f"{base_url}/goals/calculate-targets", headers=headers, json=calculation_data)
        if response.status_code == 200:
            targets = response.json()
            calories = targets.get('calories', 0)
            print(f"✅ POST /goals/calculate-targets: Calculated {calories} calories")
            tests.append(("POST /goals/calculate-targets", True, f"Calculated {calories} calories"))
        else:
            print(f"❌ POST /goals/calculate-targets failed: {response.status_code} - {response.text}")
            tests.append(("POST /goals/calculate-targets", False, response.text))
    except Exception as e:
        print(f"❌ POST /goals/calculate-targets error: {e}")
        tests.append(("POST /goals/calculate-targets", False, str(e)))

    # Test 25: Update food log (if we created one)
    if created_log_id:
        try:
            log_updates = {
                "amount": 1.5,  # Updated amount
                "notes": "Updated portion size"
            }
            response = requests.put(f"{base_url}/food-logs/{created_log_id}", headers=headers, json=log_updates)
            if response.status_code == 200:
                updated_log = response.json()
                print(f"✅ PUT /food-logs/{{id}}: Updated log {created_log_id}")
                tests.append(("PUT /food-logs/{id}", True, f"Updated log {created_log_id}"))
            else:
                print(f"❌ PUT /food-logs/{{id}} failed: {response.status_code} - {response.text}")
                tests.append(("PUT /food-logs/{id}", False, response.text))
        except Exception as e:
            print(f"❌ PUT /food-logs/{{id}} error: {e}")
            tests.append(("PUT /food-logs/{id}", False, str(e)))

    # MEAL PLANNING EXTENDED TESTS
    print("\n🍽️ Testing extended MEAL PLANNING endpoints...")
    
    # Test 26: Get meal plans list
    try:
        response = requests.get(f"{base_url}/meal-planning/plans?limit=5", headers=headers)
        if response.status_code == 200:
            plans_data = response.json()
            plan_count = len(plans_data.get('meal_plans', []))
            print(f"✅ GET /meal-planning/plans: {plan_count} meal plans")
            tests.append(("GET /meal-planning/plans", True, f"{plan_count} meal plans"))
        else:
            print(f"❌ GET /meal-planning/plans failed: {response.status_code} - {response.text}")
            tests.append(("GET /meal-planning/plans", False, response.text))
    except Exception as e:
        print(f"❌ GET /meal-planning/plans error: {e}")
        tests.append(("GET /meal-planning/plans", False, str(e)))

    # Test 27: Get meal plan by ID (if we created one)
    if created_meal_plan and created_meal_plan.get('plan_id'):
        try:
            plan_id = created_meal_plan['plan_id']
            response = requests.get(f"{base_url}/meal-planning/plans/{plan_id}", headers=headers)
            if response.status_code == 200:
                plan_data = response.json()
                plan_title = plan_data.get('title', 'Unknown')
                print(f"✅ GET /meal-planning/plans/{{id}}: {plan_title}")
                tests.append(("GET /meal-planning/plans/{id}", True, plan_title))
            else:
                print(f"❌ GET /meal-planning/plans/{{id}} failed: {response.status_code} - {response.text}")
                tests.append(("GET /meal-planning/plans/{id}", False, response.text))
        except Exception as e:
            print(f"❌ GET /meal-planning/plans/{{id}} error: {e}")
            tests.append(("GET /meal-planning/plans/{id}", False, str(e)))

    # Test 28: Get meal plan versions (if we created one)
    if created_meal_plan and created_meal_plan.get('plan_id'):
        try:
            plan_id = created_meal_plan['plan_id']
            response = requests.get(f"{base_url}/meal-planning/plans/{plan_id}/versions", headers=headers)
            if response.status_code == 200:
                versions_data = response.json()
                version_count = versions_data.get('total_versions', 0)
                print(f"✅ GET /meal-planning/plans/{{id}}/versions: {version_count} versions")
                tests.append(("GET /meal-planning/plans/{id}/versions", True, f"{version_count} versions"))
            else:
                print(f"❌ GET /meal-planning/plans/{{id}}/versions failed: {response.status_code} - {response.text}")
                tests.append(("GET /meal-planning/plans/{id}/versions", False, response.text))
        except Exception as e:
            print(f"❌ GET /meal-planning/plans/{{id}}/versions error: {e}")
            tests.append(("GET /meal-planning/plans/{id}/versions", False, str(e)))

    # Test 29: Save new meal plan version (if we created one)
    if created_meal_plan and created_meal_plan.get('plan_id'):
        try:
            plan_id = created_meal_plan['plan_id']
            new_version_data = {
                "title": "Updated Mediterranean Plan v2",
                "description": "Enhanced version with more variety",
                "days": created_meal_plan.get('days', [])  # Use same structure but updated
            }
            response = requests.post(f"{base_url}/meal-planning/plans/{plan_id}/save-version", headers=headers, json=new_version_data)
            if response.status_code == 200:
                version_result = response.json()
                print(f"✅ POST /meal-planning/plans/{{id}}/save-version: Created new version")
                tests.append(("POST /meal-planning/plans/{id}/save-version", True, "Created new version"))
            else:
                print(f"❌ POST /meal-planning/plans/{{id}}/save-version failed: {response.status_code} - {response.text}")
                tests.append(("POST /meal-planning/plans/{id}/save-version", False, response.text))
        except Exception as e:
            print(f"❌ POST /meal-planning/plans/{{id}}/save-version error: {e}")
            tests.append(("POST /meal-planning/plans/{id}}/save-version", False, str(e)))

    # Test 30: Get shopping lists
    try:
        response = requests.get(f"{base_url}/meal-planning/shopping-lists", headers=headers)
        if response.status_code == 200:
            shopping_data = response.json()
            list_count = len(shopping_data.get('shopping_lists', []))
            print(f"✅ GET /meal-planning/shopping-lists: {list_count} shopping lists")
            tests.append(("GET /meal-planning/shopping-lists", True, f"{list_count} shopping lists"))
        else:
            print(f"❌ GET /meal-planning/shopping-lists failed: {response.status_code} - {response.text}")
            tests.append(("GET /meal-planning/shopping-lists", False, response.text))
    except Exception as e:
        print(f"❌ GET /meal-planning/shopping-lists error: {e}")
        tests.append(("GET /meal-planning/shopping-lists", False, str(e)))

    # Test 31: Get meal recommendations
    try:
        response = requests.get(f"{base_url}/meal-planning/recommendations?meal_type=dinner", headers=headers)
        if response.status_code == 200:
            recommendations = response.json()
            rec_count = len(recommendations.get('recommendations', []))
            print(f"✅ GET /meal-planning/recommendations: {rec_count} recommendations")
            tests.append(("GET /meal-planning/recommendations", True, f"{rec_count} recommendations"))
        else:
            print(f"❌ GET /meal-planning/recommendations failed: {response.status_code} - {response.text}")
            tests.append(("GET /meal-planning/recommendations", False, response.text))
    except Exception as e:
        print(f"❌ GET /meal-planning/recommendations error: {e}")
        tests.append(("GET /meal-planning/recommendations", False, str(e)))

    # Test 32: Update food item (if we created one)
    if created_food_id:
        try:
            food_updates = {
                "name": "Updated Test Apple",
                "nutrition": {
                    "calories": 100,  # Updated value
                    "protein": 0.6,
                    "carbs": 26,
                    "fat": 0.3,
                    "fiber": 4,
                    "sugar": 20,
                    "sodium": 1
                }
            }
            response = requests.put(f"{base_url}/foods/{created_food_id}", headers=headers, json=food_updates)
            if response.status_code == 200:
                updated_food = response.json()
                print(f"✅ PUT /foods/{{id}}: Updated food {created_food_id}")
                tests.append(("PUT /foods/{id}", True, f"Updated food {created_food_id}"))
            else:
                print(f"❌ PUT /foods/{{id}} failed: {response.status_code} - {response.text}")
                tests.append(("PUT /foods/{id}", False, response.text))
        except Exception as e:
            print(f"❌ PUT /foods/{{id}} error: {e}")
            tests.append(("PUT /foods/{id}", False, str(e)))

    # Test 33: Delete food log (if we created one) - Test this before deleting food
    if created_log_id:
        try:
            response = requests.delete(f"{base_url}/food-logs/{created_log_id}", headers=headers)
            if response.status_code == 200:
                print(f"✅ DELETE /food-logs/{{id}}: Deleted log {created_log_id}")
                tests.append(("DELETE /food-logs/{id}", True, f"Deleted log {created_log_id}"))
            else:
                print(f"❌ DELETE /food-logs/{{id}} failed: {response.status_code} - {response.text}")
                tests.append(("DELETE /food-logs/{id}", False, response.text))
        except Exception as e:
            print(f"❌ DELETE /food-logs/{{id}} error: {e}")
            tests.append(("DELETE /food-logs/{id}", False, str(e)))

    # Test 34: Delete food item (if we created one)
    if created_food_id:
        try:
            response = requests.delete(f"{base_url}/foods/{created_food_id}", headers=headers)
            if response.status_code == 200:
                print(f"✅ DELETE /foods/{{id}}: Deleted food {created_food_id}")
                tests.append(("DELETE /foods/{id}", True, f"Deleted food {created_food_id}"))
            else:
                print(f"❌ DELETE /foods/{{id}} failed: {response.status_code} - {response.text}")
                tests.append(("DELETE /foods/{id}", False, response.text))
        except Exception as e:
            print(f"❌ DELETE /foods/{{id}} error: {e}")
            tests.append(("DELETE /foods/{id}", False, str(e)))

    return tests

def main():
    """Main test function"""
    print("🧪 Nutrivize V2 Authentication & Endpoint Test")
    print("=" * 50)
    
    # Test 1: Backend health
    if not test_backend_health():
        print("❌ Backend is not running. Please start the backend server first.")
        return
    
    # Test 2: Firebase setup
    if not setup_firebase():
        print("❌ Firebase setup failed. Check service account configuration.")
        return
    
    # Test 3: Firebase authentication
    email = "IsaacMineo@gmail.com"
    password = "Buddydog41"
    
    print(f"\n🔐 Testing Firebase authentication for {email}...")
    token = get_firebase_token(email, password)
    
    if not token:
        print("❌ Could not get Firebase token. Check credentials.")
        return
    
    # Test 4: Backend endpoints
    test_results = test_protected_endpoints(token)
    
    # Summary
    print("\n📊 Test Summary:")
    print("=" * 50)
    passed = sum(1 for _, success, _ in test_results if success)
    total = len(test_results)
    
    for test_name, success, details in test_results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if not success:
            print(f"     Details: {details}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Authentication and endpoints are working.")
    else:
        print("⚠️  Some tests failed. Check the details above.")

if __name__ == "__main__":
    main()
