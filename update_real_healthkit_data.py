#!/usr/bin/env python3
import requests
import json
from datetime import datetime

def update_real_healthkit_data():
    # Login to get token
    login_url = "http://localhost:5001/auth/login"
    login_data = {
        "email": "IsaacMineo@gmail.com",
        "password": "Buddydog41"
    }
    
    print("Logging in...")
    login_response = requests.post(login_url, json=login_data)
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return False
    
    token = login_response.json()["token"]
    user_id = login_response.json()["uid"]
    
    print(f"Logged in as user: {user_id}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Create batch data with the exact values from Swift
    batch_url = "http://localhost:5001/api/healthkit/batch-upload"
    
    # Exact data from Swift terminal output
    real_data = [
        {
            "user_id": "GME7nGpJQRc2v9T057vJ4oyqAJN2",
            "date": "2025-05-15T00:00:00",
            "steps": 3887.0,
            "calories": 322.3,
            "distance": 2847.0,
            "exercise_minutes": 12.0,
            "resting_heart_rate": 69.0,
            "walking_heart_rate": 111.5,
            "sleep_hours": 0.0,
            "source": "Apple HealthKit"
        },
        {
            "user_id": "GME7nGpJQRc2v9T057vJ4oyqAJN2",
            "date": "2025-05-16T00:00:00",
            "steps": 992.0,
            "calories": 87.63,
            "distance": 712.66,
            "exercise_minutes": 2.0,
            "resting_heart_rate": 66.0,
            "walking_heart_rate": 110.0,
            "sleep_hours": 2.375,
            "source": "Apple HealthKit"
        },
        {
            "user_id": "GME7nGpJQRc2v9T057vJ4oyqAJN2",
            "date": "2025-05-17T00:00:00",
            "steps": 776.0,
            "calories": 209.56,
            "distance": 560.88,
            "exercise_minutes": 1.0,
            "resting_heart_rate": 59.0,
            "walking_heart_rate": 108.0,
            "sleep_hours": 0.0,
            "source": "Apple HealthKit"
        }
    ]
    
    batch_data = {"entries": real_data}
    
    # Send batch request
    print(f"Sending batch upload request with {len(batch_data['entries'])} days of data...")
    batch_response = requests.post(batch_url, headers=headers, json=batch_data)
    
    if batch_response.status_code == 200:
        print("Successfully uploaded real HealthKit data from Swift")
        return True
    else:
        print(f"Failed to upload data: {batch_response.text}")
        return False

if __name__ == "__main__":
    update_real_healthkit_data() 