#!/usr/bin/env python3
import requests
import json
import random
from datetime import datetime, timedelta

def add_healthkit_history():
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
    
    # Create realistic health data for the past 7 days
    # Base daily pattern with some mild randomization
    today = datetime.now()
    
    # This data is for demonstration - in a real app, this would come from the Apple HealthKit API
    # Realistic step counts, heart rates, etc. based on typical human patterns
    
    # Use the batch upload endpoint
    batch_url = "http://localhost:5001/api/healthkit/batch-upload"
    batch_data = {"entries": []}
    
    # Add data for each day
    for day_offset in range(7):
        date = (today - timedelta(days=day_offset)).strftime("%Y-%m-%d")
        
        # Generate realistic data with some variance for each day
        # Weekend vs weekday patterns
        is_weekend = (today - timedelta(days=day_offset)).weekday() >= 5
        
        # Base step count: higher on weekdays
        base_steps = 8500 if not is_weekend else 6200
        # Add some randomness
        steps = max(100, round(base_steps * random.uniform(0.75, 1.25)))
        
        # Calories are roughly correlated with steps
        calories = round(steps * 0.05 * random.uniform(0.9, 1.1))
        
        # Distance in meters - roughly correlates with steps
        distance = round(steps * 0.75 * random.uniform(0.95, 1.05))
        
        # Exercise minutes - higher on weekdays typically
        exercise_base = 45 if not is_weekend else 30
        exercise_minutes = max(0, round(exercise_base * random.uniform(0.7, 1.3)))
        
        # Heart rate data (realistic ranges)
        resting_heart_rate = round(60 + random.uniform(-5, 8))
        walking_heart_rate = round(100 + random.uniform(-10, 15))
        
        # Sleep data - typically slightly less on weekdays
        sleep_base = 7.2 if not is_weekend else 8.1
        sleep_hours = round(sleep_base * random.uniform(0.9, 1.1) * 10) / 10  # Round to 1 decimal place
        
        # Create entry for this day
        day_data = {
            "user_id": user_id,
            "date": f"{date}T00:00:00",
            "steps": float(steps),
            "calories": float(calories),
            "distance": float(distance),
            "exercise_minutes": float(exercise_minutes),
            "resting_heart_rate": float(resting_heart_rate),
            "walking_heart_rate": float(walking_heart_rate),
            "sleep_hours": float(sleep_hours),
            "source": "Apple HealthKit"
        }
        
        batch_data["entries"].append(day_data)
        print(f"Added data for {date}: {steps} steps, {sleep_hours} hrs sleep")
    
    # Send batch request
    print(f"Sending batch upload request with {len(batch_data['entries'])} days of data...")
    batch_response = requests.post(batch_url, headers=headers, json=batch_data)
    
    if batch_response.status_code == 200:
        print("Successfully uploaded HealthKit history data")
        return True
    else:
        print(f"Failed to upload history data: {batch_response.text}")
        return False

if __name__ == "__main__":
    add_healthkit_history() 