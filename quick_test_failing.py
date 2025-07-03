#!/usr/bin/env python3
"""
Quick test for failing endpoints only
"""

import requests
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
import os
import json
from datetime import datetime, date, timedelta

def get_firebase_token(email, password):
    """Get Firebase token using Firebase Auth REST API"""
    try:
        api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"
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
            return token
        else:
            print(f"❌ Firebase authentication failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting Firebase token: {e}")
        return None

def test_failing_endpoints():
    """Test only the previously failing endpoints"""
    base_url = "http://localhost:8000"
    
    # Get auth token
    email = "IsaacMineo@gmail.com"
    password = "Buddydog41"
    token = get_firebase_token(email, password)
    
    if not token:
        print("❌ Could not get auth token")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("🔍 Testing previously failing endpoints...")
    
    # Test 1: Daily logs with goal progress
    print("\n1️⃣ Testing GET /food-logs/daily/with-goals")
    try:
        today = date.today().isoformat()
        response = requests.get(f"{base_url}/food-logs/daily/{today}/with-goals", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ SUCCESS: Got response with goal_progress: {data.get('goal_progress') is not None}")
            print(f"   Data keys: {list(data.keys())}")
        else:
            print(f"   ❌ FAILED: {response.text}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
    
    # Test 2: Create a goal first (for testing goal updates)
    print("\n2️⃣ Creating a test goal for update testing...")
    created_goal_id = None
    try:
        goal_data = {
            "title": "Test Goal for Update",
            "goal_type": "weight_loss",
            "start_date": date.today().isoformat(),
            "end_date": (date.today() + timedelta(days=30)).isoformat(),
            "nutrition_targets": {
                "calories": 2000,
                "protein": 150,
                "carbs": 200,
                "fat": 65,
                "fiber": 30
            },
            "is_active": True
        }
        
        response = requests.post(f"{base_url}/goals/", headers=headers, json=goal_data)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            goal_result = response.json()
            created_goal_id = goal_result.get('id')
            print(f"   ✅ Created test goal: {created_goal_id}")
        else:
            print(f"   ❌ Failed to create goal: {response.text}")
    except Exception as e:
        print(f"   ❌ Error creating goal: {e}")
    
    # Test 3: Update goal (this was failing)
    if created_goal_id:
        print(f"\n3️⃣ Testing PUT /goals/{created_goal_id}")
        try:
            goal_updates = {
                "title": "Updated Test Goal",
                "nutrition_targets": {
                    "calories": 1800,
                    "protein": 140,
                    "carbs": 180,
                    "fat": 60,
                    "fiber": 25
                }
            }
            response = requests.put(f"{base_url}/goals/{created_goal_id}", headers=headers, json=goal_updates)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                updated_goal = response.json()
                print(f"   ✅ SUCCESS: Updated goal")
                print(f"   New title: {updated_goal.get('title', 'N/A')}")
            else:
                print(f"   ❌ FAILED: {response.text}")
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
    
    # Test 4: Test goal integration - check if daily logs now show goal progress
    if created_goal_id:
        print("\n4️⃣ Re-testing goal integration after creating active goal")
        try:
            today = date.today().isoformat()
            response = requests.get(f"{base_url}/food-logs/daily/{today}/with-goals", headers=headers)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                goal_progress = data.get('goal_progress')
                if goal_progress:
                    print(f"   ✅ SUCCESS: Goal progress is now available!")
                    print(f"   Calories target: {goal_progress.get('calories', {}).get('target', 'N/A')}")
                    print(f"   Protein target: {goal_progress.get('protein', {}).get('target', 'N/A')}")
                else:
                    print(f"   ⚠️  Goal progress still None (may need food logs)")
            else:
                print(f"   ❌ FAILED: {response.text}")
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
    
    # Test 5: Test meal plan generation (might have AI issues)
    print("\n5️⃣ Testing meal plan generation")
    try:
        meal_plan_data = {
            "days": 2,  # Smaller plan for testing
            "dietary_restrictions": ["vegetarian"],
            "calories_per_day": 2000,
            "protein_target": 100,
            "meal_types": ["breakfast", "lunch"]
        }
        response = requests.post(f"{base_url}/meal-planning/generate-plan", headers=headers, json=meal_plan_data, timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            meal_plan = response.json()
            plan_id = meal_plan.get('plan_id')
            print(f"   ✅ SUCCESS: Generated plan {plan_id}")
            
            # Test shopping list generation if plan was created
            if plan_id:
                print(f"\n6️⃣ Testing shopping list for plan {plan_id}")
                try:
                    response = requests.post(f"{base_url}/meal-planning/plans/{plan_id}/shopping-list", headers=headers, timeout=60)
                    print(f"   Status: {response.status_code}")
                    if response.status_code == 200:
                        shopping_list = response.json()
                        item_count = len(shopping_list.get('items', []))
                        total_cost = shopping_list.get('total_estimated_cost', 0)
                        print(f"   ✅ SUCCESS: {item_count} items, ${total_cost}")
                        print(f"   Store location: {shopping_list.get('store_location', 'N/A')}")
                    else:
                        print(f"   ❌ FAILED: {response.text}")
                except Exception as e:
                    print(f"   ❌ ERROR: {e}")
        else:
            print(f"   ❌ FAILED: {response.text}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
    
    print(f"\n🧹 Cleaning up test goal...")
    if created_goal_id:
        try:
            response = requests.delete(f"{base_url}/goals/{created_goal_id}", headers=headers)
            if response.status_code == 200:
                print(f"   ✅ Cleaned up test goal")
            else:
                print(f"   ⚠️  Could not clean up goal: {response.status_code}")
        except:
            print(f"   ⚠️  Could not clean up goal")

if __name__ == "__main__":
    test_failing_endpoints()
