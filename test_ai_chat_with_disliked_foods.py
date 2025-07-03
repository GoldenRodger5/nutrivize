#!/usr/bin/env python3
"""
Test AI chat to verify disliked foods are working
"""

import requests
import json

# Configuration
EMAIL = "IsaacMineo@gmail.com"
PASSWORD = "Buddydog41"
API_BASE_URL = "http://localhost:8000"

def authenticate() -> str:
    """Authenticate with Firebase and get token"""
    print("🔐 Authenticating with Firebase...")
    
    # Firebase Auth REST API endpoint
    firebase_api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"
    auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={firebase_api_key}"
    
    auth_data = {
        "email": EMAIL,
        "password": PASSWORD,
        "returnSecureToken": True
    }
    
    try:
        response = requests.post(auth_url, json=auth_data)
        response.raise_for_status()
        auth_result = response.json()
        
        token = auth_result.get('idToken')
        if not token:
            print("❌ Failed to get auth token")
            return None
            
        print("✅ Successfully authenticated with Firebase")
        return token
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Firebase authentication failed: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return None

def test_ai_chat(token: str):
    """Test AI chat endpoint"""
    print("🤖 Testing AI chat endpoint...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test message about dietary preferences
    chat_data = {
        "message": "I want to avoid chicken and dairy products. Can you suggest a healthy meal?",
        "context": {
            "current_page": "chat",
            "user_intent": "dietary_preferences"
        }
    }
    
    try:
        url = f"{API_BASE_URL}/ai/chat"
        print(f"📡 Sending chat request to: {url}")
        
        response = requests.post(url, headers=headers, json=chat_data)
        response.raise_for_status()
        
        chat_response = response.json()
        print("✅ AI Chat Response:")
        print(f"Message: {chat_response.get('message', 'No message')}")
        print(f"Context: {chat_response.get('context', {})}")
        
        return chat_response
        
    except requests.exceptions.RequestException as e:
        print(f"❌ AI chat request failed: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return None

def test_meal_suggestions(token: str):
    """Test meal suggestions endpoint"""
    print("🍽️ Testing meal suggestions endpoint...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test meal suggestion request
    suggestion_data = {
        "meal_type": "dinner",
        "preferences": ["healthy", "high-protein"],
        "context": {
            "current_page": "meal_suggestions",
            "dietary_goals": ["avoid_chicken", "avoid_dairy"]
        }
    }
    
    try:
        url = f"{API_BASE_URL}/ai/meal-suggestions"
        print(f"📡 Sending meal suggestion request to: {url}")
        
        response = requests.post(url, headers=headers, json=suggestion_data)
        response.raise_for_status()
        
        suggestion_response = response.json()
        print("✅ Meal Suggestion Response:")
        print(f"Suggestions: {suggestion_response.get('suggestions', [])}")
        print(f"Context: {suggestion_response.get('context', {})}")
        
        return suggestion_response
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Meal suggestion request failed: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return None

def main():
    """Main function"""
    print("🚀 Testing AI Chat and Meal Suggestions with Disliked Foods")
    print(f"👤 User: {EMAIL}")
    print(f"🌐 API: {API_BASE_URL}")
    
    # Step 1: Authenticate
    token = authenticate()
    if not token:
        print("❌ Authentication failed. Cannot proceed.")
        return
    
    # Step 2: Test AI Chat
    chat_result = test_ai_chat(token)
    
    print("\n" + "="*50)
    
    # Step 3: Test Meal Suggestions
    meal_result = test_meal_suggestions(token)
    
    print("\n🎯 TESTING COMPLETE!")

if __name__ == "__main__":
    main()
