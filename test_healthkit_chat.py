#!/usr/bin/env python3
import requests
import json
import sys
import time

"""
Test script for Apple HealthKit related queries using the chat API
"""

def login():
    """Get authentication token"""
    api_url = 'http://localhost:5001'
    
    auth_response = requests.post(
        f'{api_url}/auth/login',
        json={
            'email': 'IsaacMineo@gmail.com',
            'password': 'Buddydog41'
        }
    )
    
    if auth_response.status_code != 200:
        print(f"Authentication failed: {auth_response.status_code}")
        print(f"Response: {auth_response.text}")
        return None, None
    
    auth_data = auth_response.json()
    return auth_data.get('token'), auth_data.get('uid')

def test_health_query(query, token, user_id):
    """Test a health-related query"""
    api_url = 'http://localhost:5001'
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    payload = {
        'messages': [{'role': 'user', 'content': query}],
        'fetch_context': True,
        'user_id': user_id
    }
    
    print(f"\n\n--- Testing Query: {query} ---")
    
    try:
        response = requests.post(
            f'{api_url}/api/chat',
            headers=headers,
            json=payload
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            response_text = result.get('response', '')
            print(f"Response (first 300 chars): {response_text[:300]}...")
            
            # Simple analysis of response quality
            if "Apple Health" in response_text or "HealthKit" in response_text:
                print("✅ Response mentions health data")
            else:
                print("⚠️ Response doesn't mention health data")
            
            if "error" in response_text.lower():
                print("⚠️ Response contains error message")
            else:
                print("✅ No error messages in response")
                
            return True
        else:
            print(f"Error response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception: {e}")
        return False

def run_tests():
    """Run a series of Apple Health related tests"""
    token, user_id = login()
    
    if not token or not user_id:
        print("Failed to authenticate. Cannot run tests.")
        return
    
    health_queries = [
        "Based on my Apple Health data, how many steps did I average last week?",
        "What's my calorie adjustment based on my activity level from Apple Health?",
        "According to my Apple Health data, am I getting enough sleep?",
        "Based on my heart rate data from HealthKit, should I adjust my workout intensity?",
        "My Apple Health shows I walked 8000 steps today. What else should I do to meet my fitness goals?",
        "Looking at my Apple Health data and food logs, what changes should I make to improve my overall health?"
    ]
    
    success_count = 0
    
    for query in health_queries:
        if test_health_query(query, token, user_id):
            success_count += 1
        time.sleep(1)  # Small delay between tests
    
    print(f"\nTest Summary: {success_count}/{len(health_queries)} queries successful")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Single query mode
        token, user_id = login()
        if token and user_id:
            test_health_query(sys.argv[1], token, user_id)
    else:
        # Run all test queries
        run_tests() 