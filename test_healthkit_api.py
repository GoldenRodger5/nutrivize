#!/usr/bin/env python3
"""
Test script for the HealthKit API endpoints.
This script simulates an iOS companion app sending HealthKit data to the Nutrivize backend.
"""

import requests
import json
import datetime
import random
import time
import argparse

# Default API URL
DEFAULT_API_URL = "http://localhost:5001"

def generate_random_health_data(user_id, days=7):
    """
    Generate random health data for testing.
    
    Args:
        user_id (str): The user ID to generate data for
        days (int): Number of days of data to generate
        
    Returns:
        list: A list of HealthKit data entries
    """
    data = []
    today = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    for i in range(days):
        date = today - datetime.timedelta(days=i)
        
        # Generate random but realistic health data
        entry = {
            "user_id": user_id,
            "date": date.isoformat(),
            "steps": random.randint(2000, 15000),
            "calories": random.randint(100, 800),
            "distance": random.randint(1500, 12000),
            "exercise_minutes": random.randint(10, 120),
            "resting_heart_rate": random.randint(55, 75),
            "walking_heart_rate": random.randint(85, 130),
            "sleep_hours": round(random.uniform(5.0, 9.0), 1)
        }
        
        data.append(entry)
    
    return data

def test_single_upload(api_url, user_id, token):
    """
    Test the single upload endpoint.
    
    Args:
        api_url (str): The base API URL
        user_id (str): The user ID to use
        token (str): Authentication token
    """
    print("\n📊 Testing single HealthKit data upload")
    
    # Generate one day of data
    health_data = generate_random_health_data(user_id, days=1)[0]
    
    # Headers with authentication
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    # Send request
    url = f"{api_url}/api/healthkit/upload"
    print(f"POST {url}")
    print(f"Request payload: {json.dumps(health_data, indent=2)}")
    
    try:
        response = requests.post(url, json=health_data, headers=headers)
        
        # Print response
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            print("Response: ", json.dumps(response.json(), indent=2))
            print("✅ Single upload test passed")
        else:
            print("❌ Single upload test failed")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error during single upload test: {str(e)}")

def test_batch_upload(api_url, user_id, token, days=7):
    """
    Test the batch upload endpoint.
    
    Args:
        api_url (str): The base API URL
        user_id (str): The user ID to use
        token (str): Authentication token
        days (int): Number of days of data to generate
    """
    print("\n📈 Testing batch HealthKit data upload")
    
    # Generate data for specified number of days
    health_data = generate_random_health_data(user_id, days=days)
    
    # Create batch payload
    batch_payload = {
        "entries": health_data
    }
    
    # Headers with authentication
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    # Send request
    url = f"{api_url}/api/healthkit/batch-upload"
    print(f"POST {url}")
    print(f"Uploading data for {len(health_data)} days")
    
    try:
        response = requests.post(url, json=batch_payload, headers=headers)
        
        # Print response
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Successfully uploaded: {result.get('successful')} entries")
            print(f"Failed: {result.get('failed')} entries")
            print("✅ Batch upload test passed")
        else:
            print("❌ Batch upload test failed")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error during batch upload test: {str(e)}")

def test_get_data(api_url, user_id, token):
    """
    Test retrieving HealthKit data.
    
    Args:
        api_url (str): The base API URL
        user_id (str): The user ID to use
        token (str): Authentication token
    """
    print("\n📋 Testing HealthKit data retrieval")
    
    # Headers with authentication
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Get data for the last 30 days
    today = datetime.datetime.now().date().isoformat()
    thirty_days_ago = (datetime.datetime.now() - datetime.timedelta(days=30)).date().isoformat()
    
    # Send request
    url = f"{api_url}/api/healthkit/data"
    params = {
        "start_date": thirty_days_ago,
        "end_date": today
    }
    
    print(f"GET {url}")
    print(f"Params: {params}")
    
    try:
        response = requests.get(url, params=params, headers=headers)
        
        # Print response
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            entries_count = len(result.get("data", []))
            print(f"Retrieved {entries_count} HealthKit entries")
            print("✅ Data retrieval test passed")
        else:
            print("❌ Data retrieval test failed")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error during data retrieval test: {str(e)}")

def test_get_summary(api_url, user_id, token):
    """
    Test retrieving HealthKit summary data.
    
    Args:
        api_url (str): The base API URL
        user_id (str): The user ID to use
        token (str): Authentication token
    """
    print("\n📊 Testing HealthKit summary retrieval")
    
    # Headers with authentication
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Get summary for the last 7 days
    today = datetime.datetime.now().date().isoformat()
    seven_days_ago = (datetime.datetime.now() - datetime.timedelta(days=7)).date().isoformat()
    
    # Send request
    url = f"{api_url}/api/healthkit/summary"
    params = {
        "start_date": seven_days_ago,
        "end_date": today
    }
    
    print(f"GET {url}")
    print(f"Params: {params}")
    
    try:
        response = requests.get(url, params=params, headers=headers)
        
        # Print response
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("Summary data retrieved successfully")
            print(f"Date range: {result.get('date_range', {}).get('start')} to {result.get('date_range', {}).get('end')}")
            print(f"Average steps: {result.get('averages', {}).get('steps', 0)}")
            print(f"Average calories: {result.get('averages', {}).get('calories', 0)}")
            print(f"Average sleep: {result.get('averages', {}).get('sleep_hours', 0)} hours")
            print("✅ Summary retrieval test passed")
        else:
            print("❌ Summary retrieval test failed")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error during summary retrieval test: {str(e)}")

def run_all_tests(api_url, user_id, token):
    """
    Run all API tests
    
    Args:
        api_url (str): The base API URL
        user_id (str): The user ID to use
        token (str): Authentication token
    """
    print(f"🧪 Running all HealthKit API tests")
    print(f"API URL: {api_url}")
    print(f"User ID: {user_id}")
    
    # Run tests
    test_single_upload(api_url, user_id, token)
    time.sleep(1)  # Small delay between tests
    
    test_batch_upload(api_url, user_id, token)
    time.sleep(1)
    
    test_get_data(api_url, user_id, token)
    time.sleep(1)
    
    test_get_summary(api_url, user_id, token)
    
    print("\n✨ All tests completed")

def login(api_url, email, password):
    """
    Login to get an authentication token
    
    Args:
        api_url (str): The base API URL
        email (str): User email
        password (str): User password
        
    Returns:
        tuple: (user_id, token) if successful, (None, None) otherwise
    """
    print(f"🔐 Logging in as {email}")
    
    url = f"{api_url}/auth/login"
    payload = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            user_id = data.get("uid")
            print(f"✅ Login successful. User ID: {user_id}")
            return user_id, token
        else:
            print(f"❌ Login failed. Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Error during login: {str(e)}")
        return None, None

def main():
    """Main function to run the tests"""
    parser = argparse.ArgumentParser(description="Test the HealthKit API endpoints")
    parser.add_argument("--url", default=DEFAULT_API_URL, help=f"API URL (default: {DEFAULT_API_URL})")
    parser.add_argument("--email", required=True, help="User email for authentication")
    parser.add_argument("--password", required=True, help="User password for authentication")
    parser.add_argument("--user-id", help="User ID (if not provided, will be obtained from login)")
    parser.add_argument("--token", help="Authentication token (if not provided, will be obtained from login)")
    parser.add_argument("--days", type=int, default=7, help="Number of days of data to generate for batch upload (default: 7)")
    
    args = parser.parse_args()
    
    # Get user_id and token if not provided
    user_id = args.user_id
    token = args.token
    
    if not user_id or not token:
        user_id, token = login(args.url, args.email, args.password)
        
        if not user_id or not token:
            print("Could not obtain authentication credentials. Exiting.")
            return
    
    # Run tests
    run_all_tests(args.url, user_id, token)

if __name__ == "__main__":
    main() 