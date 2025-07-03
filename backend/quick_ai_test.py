#!/usr/bin/env python3
"""
Simple test for AI meal suggestions endpoint
"""

import requests
import json
import pyrebase

def get_firebase_token():
    """Get Firebase ID token for IsaacMineo@gmail.com"""
    firebase_config = {
        "apiKey": "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks",
        "authDomain": "food-tracker-6096d.firebaseapp.com",
        "databaseURL": "https://food-tracker-6096d-default-rtdb.firebaseio.com",
        "projectId": "food-tracker-6096d",
        "storageBucket": "food-tracker-6096d.firebasestorage.app",
        "messagingSenderId": "215135700985",
        "appId": "1:215135700985:web:bfb71581010bcaab6c5f28"
    }
    
    firebase = pyrebase.initialize_app(firebase_config)
    auth = firebase.auth()
    
    user = auth.sign_in_with_email_and_password("IsaacMineo@gmail.com", "Buddydog41")
    return user['idToken']

# Get token
print("Getting Firebase token...")
token = get_firebase_token()
print("✅ Got token")

# Test simple endpoints first
print("\n1. Testing auth endpoint...")
response = requests.get(
    "http://localhost:8000/auth/me",
    headers={"Authorization": f"Bearer {token}"}
)
print(f"Auth endpoint: {response.status_code}")
if response.status_code == 200:
    print(f"User: {response.json().get('email')}")

print("\n2. Testing AI chat endpoint (simpler)...")
response = requests.post(
    "http://localhost:8000/ai/chat",
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    json={"message": "Hello", "conversation_history": []},
    timeout=120
)
print(f"Chat endpoint: {response.status_code}")
if response.status_code != 200:
    print(f"Error: {response.text}")

print("\n3. Testing meal suggestions endpoint...")
response = requests.post(
    "http://localhost:8000/ai/meal-suggestions",
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    json={
        "meal_type": "dinner",
        "remaining_calories": 800,
        "dietary_preferences": [],
        "allergies": []
    },
    timeout=120
)
print(f"Meal suggestions endpoint: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    print(f"Got {len(result.get('suggestions', []))} suggestions")
    for i, suggestion in enumerate(result.get('suggestions', [])[:2], 1):
        print(f"{i}. {suggestion.get('name')}")
else:
    print(f"Error: {response.text}")
