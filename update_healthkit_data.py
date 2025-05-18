#!/usr/bin/env python3
import sys
import json
import requests
from datetime import datetime

def update_healthkit_data(email, password, steps):
    # Login to get token
    login_url = "http://localhost:5001/auth/login"
    login_data = {
        "email": email,
        "password": password
    }
    
    login_response = requests.post(login_url, json=login_data)
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return False
    
    token = login_response.json()["token"]
    user_id = login_response.json()["uid"]
    
    # Get today's date in ISO format
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Create new data payload for single upload
    healthkit_data = {
        "user_id": user_id,
        "date": f"{today}T00:00:00",
        "steps": float(steps),
        "calories": 35.0,  # Estimated based on step count
        "distance": 0.55,  # Estimated based on step count (km)
        "exercise_minutes": 7.0,  # Estimated
        "resting_heart_rate": 68.0,  # Default value
        "walking_heart_rate": 88.0,  # Default value
        "sleep_hours": 7.8,  # Default value
        "source": "Apple HealthKit"
    }
    
    # Send data to upload endpoint
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Try both endpoints to see which one works
    upload_url = "http://localhost:5001/api/healthkit/upload"
    response = requests.post(upload_url, headers=headers, json=healthkit_data)
    
    if response.status_code == 200:
        print(f"Successfully updated HealthKit data with {steps} steps for {today}")
        return True
    else:
        print(f"Single upload failed: {response.text}")
        print("Trying batch upload...")
        
        # Try the batch upload with the proper format
        batch_url = "http://localhost:5001/api/healthkit/batch-upload"
        batch_data = {"entries": [healthkit_data]}
        batch_response = requests.post(batch_url, headers=headers, json=batch_data)
        
        if batch_response.status_code == 200:
            print(f"Successfully batch updated HealthKit data with {steps} steps for {today}")
            return True
        else:
            print(f"Batch upload failed: {batch_response.text}")
            return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python update_healthkit_data.py [step_count]")
        sys.exit(1)
    
    email = "IsaacMineo@gmail.com"
    password = "Buddydog41"
    steps = sys.argv[1]
    
    update_healthkit_data(email, password, steps) 