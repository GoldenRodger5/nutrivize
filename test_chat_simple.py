#!/usr/bin/env python3
import requests
import json
import sys

def test_chat_api(message):
    api_url = 'http://localhost:5001'
    email = 'IsaacMineo@gmail.com'
    password = 'Buddydog41'

    # Login
    login_response = requests.post(
        f'{api_url}/auth/login',
        json={'email': email, 'password': password}
    )
    login_data = login_response.json()
    token = login_data.get('token')
    user_id = login_data.get('uid')

    if not token or not user_id:
        print("Failed to log in")
        return

    # Try a simple message format
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }

    response = requests.post(
        f'{api_url}/api/chat',
        headers=headers,
        json={'message': message}
    )

    print(f'Status: {response.status_code}')
    try:
        return response.json()
    except:
        return {"error": response.text}

if __name__ == "__main__":
    message = sys.argv[1] if len(sys.argv) > 1 else "Based on my Apple Health data and food logs, what should I eat today to meet my fitness goals?"
    result = test_chat_api(message)
    print(json.dumps(result, indent=2)) 