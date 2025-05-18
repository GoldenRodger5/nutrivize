import requests
import json
from datetime import datetime, timedelta

def test_swift_endpoints():
    """Test all Swift API endpoints to ensure they are working correctly"""
    base_url = "http://127.0.0.1:5001/api"
    print(f"Testing Swift API endpoints at {base_url}")
    
    # Step 1: Test the Swift login endpoint
    login_data = {
        "email": "isaacmineo@gmail.com",
        "password": "Buddydog41",
        "device_id": "test-device"
    }
    
    print("\n1. Testing /swift/login endpoint")
    login_response = requests.post(f"{base_url}/swift/login", json=login_data)
    
    if login_response.status_code == 200:
        print(f"✅ Login successful (Status: {login_response.status_code})")
        token_data = login_response.json()
        token = token_data.get("access_token")
        user_id = token_data.get("user_id")
        print(f"User ID: {user_id}")
        print(f"Token: {token[:20]}...")
    else:
        print(f"❌ Login failed (Status: {login_response.status_code})")
        print(f"Response: {login_response.text}")
        return
    
    # Set headers with the auth token
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Step 2: Test token validation
    print("\n2. Testing /swift/validate endpoint")
    validate_response = requests.get(f"{base_url}/swift/validate", headers=headers)
    
    if validate_response.status_code == 200:
        print(f"✅ Token validation successful (Status: {validate_response.status_code})")
        print(f"Response: {validate_response.json()}")
    else:
        print(f"❌ Token validation failed (Status: {validate_response.status_code})")
        print(f"Response: {validate_response.text}")
    
    # Step 3: Test the token refresh endpoint
    print("\n3. Testing /swift/refresh endpoint")
    refresh_response = requests.post(f"{base_url}/swift/refresh", headers=headers)
    
    if refresh_response.status_code == 200:
        print(f"✅ Token refresh successful (Status: {refresh_response.status_code})")
        refresh_data = refresh_response.json()
        token = refresh_data.get("access_token")
        print(f"New token: {token[:20]}...")
        
        # Update headers with the new token
        headers = {
            "Authorization": f"Bearer {token}"
        }
    else:
        print(f"❌ Token refresh failed (Status: {refresh_response.status_code})")
        print(f"Response: {refresh_response.text}")
    
    # Step 4: Test the batch upload endpoint
    print("\n4. Testing /swift/healthkit/batch-upload endpoint")
    
    # Generate test health data for today and yesterday
    today = datetime.now()
    yesterday = today - timedelta(days=1)
    
    test_data = {
        "entries": [
            {
                "user_id": user_id,
                "date": today.strftime("%Y-%m-%dT04:00:00Z"),
                "date_key": today.strftime("%Y-%m-%d"),
                "steps": 5000,
                "calories": 350,
                "distance": 4000,
                "exercise_minutes": 30,
                "resting_heart_rate": 65,
                "walking_heart_rate": 110,
                "sleep_hours": 7.5,
                "source": "API Test Script"
            },
            {
                "user_id": user_id,
                "date": yesterday.strftime("%Y-%m-%dT04:00:00Z"),
                "date_key": yesterday.strftime("%Y-%m-%d"),
                "steps": 6500,
                "calories": 420,
                "distance": 5200,
                "exercise_minutes": 45,
                "resting_heart_rate": 62,
                "walking_heart_rate": 105,
                "sleep_hours": 8.2,
                "source": "API Test Script"
            }
        ]
    }
    
    upload_response = requests.post(
        f"{base_url}/swift/healthkit/batch-upload", 
        headers=headers,
        json=test_data
    )
    
    if upload_response.status_code == 200:
        print(f"✅ Batch upload successful (Status: {upload_response.status_code})")
        upload_result = upload_response.json()
        print(f"Successfully processed: {len(upload_result.get('results', []))} records")
        print(f"Errors: {len(upload_result.get('errors', []))}")
    else:
        print(f"❌ Batch upload failed (Status: {upload_response.status_code})")
        print(f"Response: {upload_response.text}")
    
    # Step 5: Test retrieving the data we just uploaded
    print("\n5. Testing /swift/healthkit/data endpoint")
    end_date = today.strftime("%Y-%m-%d")
    start_date = yesterday.strftime("%Y-%m-%d")
    
    data_response = requests.get(
        f"{base_url}/swift/healthkit/data?start_date={start_date}&end_date={end_date}", 
        headers=headers
    )
    
    if data_response.status_code == 200:
        print(f"✅ Data retrieval successful (Status: {data_response.status_code})")
        data_result = data_response.json()
        retrieved_count = len(data_result.get("data", []))
        print(f"Retrieved {retrieved_count} records for date range {start_date} to {end_date}")
        
        # Print brief summary of each record
        for i, record in enumerate(data_result.get("data", [])[:5]):  # Show first 5 records
            print(f"  Record {i+1}: {record.get('date_key')} - Steps: {record.get('steps')}, Calories: {record.get('calories')}")
        
        if retrieved_count > 5:
            print(f"  ... and {retrieved_count - 5} more records")
    else:
        print(f"❌ Data retrieval failed (Status: {data_response.status_code})")
        print(f"Response: {data_response.text}")
    
    print("\nAPI Testing Complete!")

if __name__ == "__main__":
    test_swift_endpoints() 