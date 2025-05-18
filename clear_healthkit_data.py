#!/usr/bin/env python3
import requests
import json

def clear_healthkit_data():
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
    
    # Now let's check existing data
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Get list of dates with data
    data_url = "http://localhost:5001/api/healthkit/data"
    data_response = requests.get(data_url, headers=headers)
    
    if data_response.status_code != 200:
        print(f"Failed to fetch data: {data_response.text}")
        return False
    
    # Get all document IDs
    documents = data_response.json().get("data", [])
    print(f"Found {len(documents)} HealthKit data documents")
    
    # Since there's no delete endpoint, we'll overwrite the data with empty values
    # Make sure to preserve the document IDs and dates
    for doc in documents:
        print(f"Clearing document ID: {doc['_id']} for date: {doc['date']}")
        
        # Create empty data document (0 values for all metrics)
        update_data = {
            "user_id": user_id,
            "date": doc["date"],
            "steps": 0.0,
            "calories": 0.0,
            "distance": 0.0,
            "exercise_minutes": 0.0,
            "resting_heart_rate": 0.0,
            "walking_heart_rate": 0.0,
            "sleep_hours": 0.0,
            "source": "Cleared Data"
        }
        
        # Use the upload endpoint to overwrite
        upload_url = "http://localhost:5001/api/healthkit/upload"
        upload_response = requests.post(upload_url, headers=headers, json=update_data)
        
        if upload_response.status_code != 200:
            print(f"Failed to clear document {doc['_id']}: {upload_response.text}")
        else:
            print(f"Successfully cleared document {doc['_id']}")
    
    print("HealthKit data clearing complete")
    return True

if __name__ == "__main__":
    clear_healthkit_data() 