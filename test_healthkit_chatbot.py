#!/usr/bin/env python3
import requests
import json
import sys
import time

# Test different realistic user queries about HealthKit data
test_queries = [
    "Based on my Apple Health data, how many steps did I average last week?",
    "What's my calorie adjustment based on my activity level from Apple Health?",
    "According to my Apple Health data, am I getting enough sleep?",
    "Based on my heart rate data from HealthKit, should I adjust my workout intensity?",
    "Can you compare my current activity level from Apple Health with my weight loss goals?",
    "My Apple Health shows I walked 8000 steps today. What else should I do to meet my fitness goals?",
    "Given my sleep patterns from Apple Health, suggest a meal plan that might help improve my rest",
    "How does my exercise data from HealthKit compare to my nutrition intake? Am I eating enough?",
    "Based on my heart rate trends in Apple Health, am I recovering properly between workouts?",
    "Looking at my Apple Health data and food logs, what changes should I make to improve my overall health?"
]

def test_chat_direct(message):
    """Test the API server directly on port 5000"""
    api_url = 'http://localhost:5000'
    
    # Get auth token first
    auth_response = requests.post(
        f'{api_url}/auth/login',
        json={
            'email': 'IsaacMineo@gmail.com',
            'password': 'Buddydog41'
        }
    )
    
    if auth_response.status_code != 200:
        print(f"Authentication failed: {auth_response.status_code}")
        return {"error": "Authentication failed"}
    
    auth_data = auth_response.json()
    token = auth_data.get('token')
    
    # Make authenticated request
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    response = requests.post(
        f'{api_url}/api/chat',
        headers=headers,
        json={'message': message}
    )
    
    print(f'Query: "{message}"')
    print(f'Status: {response.status_code}')
    try:
        result = response.json()
        print(f'Response: {result.get("response", "")[:200]}...\n')
        return result
    except:
        print(f'Error: {response.text[:100]}...\n')
        return {"error": response.text}

def run_all_tests():
    """Run all test queries"""
    print("Running tests against the Node.js API server...\n")
    
    for i, query in enumerate(test_queries, 1):
        print(f"TEST {i}/{len(test_queries)}")
        result = test_chat_direct(query)
        
        # Analyze response quality
        response = result.get("response", "")
        if response:
            if "Apple Health" in response or "HealthKit" in response:
                print("✅ Response correctly references health data")
            else:
                print("⚠️ Response doesn't mention health data")
                
            if len(response) > 300:
                print("✅ Response is detailed")
            else:
                print("⚠️ Response seems brief")
        
        time.sleep(1)  # Add a small delay between requests
    
    print("All tests completed!")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        result = test_chat_direct(sys.argv[1])
        print(json.dumps(result, indent=2))
    else:
        run_all_tests() 