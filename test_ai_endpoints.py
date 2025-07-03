#!/usr/bin/env python3
"""
Test AI endpoints with longer timeout
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

def test_ai_endpoints():
    """Test AI endpoints with longer timeouts"""
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
    
    print("🤖 Testing AI endpoints with extended timeouts...")
    
    # Test 1: Simple AI chat (should be faster)
    print("\n1️⃣ Testing AI chat")
    try:
        chat_data = {
            "message": "Hello, what's a healthy breakfast?",
            "conversation_history": []
        }
        response = requests.post(f"{base_url}/ai/chat", headers=headers, json=chat_data, timeout=60)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            chat_result = response.json()
            response_text = chat_result.get('response', '')
            print(f"   ✅ SUCCESS: Got {len(response_text)} char response")
            print(f"   Preview: {response_text[:100]}...")
        else:
            print(f"   ❌ FAILED: {response.text}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
    
    # Test 2: AI meal suggestions (should be faster than meal plans)
    print("\n2️⃣ Testing AI meal suggestions")
    try:
        meal_suggestion_data = {
            "meal_type": "lunch",
            "remaining_calories": 400,
            "remaining_protein": 20,
            "dietary_preferences": ["vegetarian"],
            "allergies": []
        }
        response = requests.post(f"{base_url}/ai/meal-suggestions", headers=headers, json=meal_suggestion_data, timeout=60)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            suggestions = response.json()
            suggestion_count = len(suggestions.get('suggestions', []))
            print(f"   ✅ SUCCESS: Got {suggestion_count} suggestions")
            if suggestion_count > 0:
                first_suggestion = suggestions['suggestions'][0]
                print(f"   Example: {first_suggestion.get('name', 'N/A')}")
        else:
            print(f"   ❌ FAILED: {response.text}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
    
    # Test 3: Simple meal plan (1 day only)
    print("\n3️⃣ Testing simple meal plan generation (1 day)")
    try:
        meal_plan_data = {
            "days": 1,  # Just 1 day
            "dietary_restrictions": [],
            "calories_per_day": 2000,
            "meal_types": ["breakfast"]  # Just breakfast
        }
        print("   Attempting to generate 1-day breakfast plan...")
        response = requests.post(f"{base_url}/meal-planning/generate-plan", headers=headers, json=meal_plan_data, timeout=120)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            meal_plan = response.json()
            plan_id = meal_plan.get('plan_id')
            days_count = len(meal_plan.get('days', []))
            print(f"   ✅ SUCCESS: Generated plan {plan_id} with {days_count} days")
        else:
            print(f"   ❌ FAILED: {response.text}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")

if __name__ == "__main__":
    test_ai_endpoints()
