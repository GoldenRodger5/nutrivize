import requests
import json
from datetime import datetime, timedelta
import random

def main():
    """Test the updated Swift batch upload endpoint with mock data in the expected format"""
    print("Testing Swift batch upload endpoint...")
    
    # API endpoint for batch upload
    url = "http://localhost:5001/api/healthkit/batch-upload"
    
    # Generate mock data for the last 10 days in Swift format
    data = []
    
    # Fixed user ID - make sure this matches a valid user in your system
    user_id = "GME7nGpJQRc2v9T057vJ4oyqAJN2"  
    
    # Today's date
    end_date = datetime.now()
    
    # Generate data for last 10 days
    for i in range(10):
        date = end_date - timedelta(days=i)
        date_iso = date.strftime("%Y-%m-%dT04:00:00Z")  # Notice the T04:00:00Z format from Swift
        date_key = date.strftime("%Y-%m-%d")
        
        # Create realistic but random health data
        # Base values with some random variation for each day
        base_steps = random.randint(600, 12000)
        base_calories = base_steps * 0.05  # Roughly proportional to steps
        base_distance = base_steps * 0.0007  # Roughly in meters
        base_exercise = random.randint(0, 120)
        base_resting_hr = random.randint(55, 75)
        base_walking_hr = random.randint(90, 120)
        base_sleep = random.uniform(5.5, 8.5)
        
        # Create the mock data entry
        entry = {
            "user_id": user_id,
            "date": date_iso,
            "date_key": date_key,
            "steps": base_steps,
            "calories": round(base_calories, 2),
            "distance": round(base_distance, 2),
            "exercise_minutes": base_exercise,
            "resting_heart_rate": base_resting_hr,
            "walking_heart_rate": base_walking_hr,
            "sleep_hours": round(base_sleep, 1),
            "source": "Apple HealthKit (Swift)"
        }
        
        data.append(entry)
    
    # Print sample of what we're sending
    print(f"Generated {len(data)} days of mock Swift health data")
    print("\nSample entry:")
    print(json.dumps(data[0], indent=2))
    
    # Send the request
    try:
        # Use JWT token for authentication
        # If you have a way to get a valid token, replace this
        # Otherwise you'll need to comment out the headers and handle the 403 response
        # headers = {"Authorization": f"Bearer {token}"}
        
        # For now, let's try without authentication to see the error
        response = requests.post(url, json={"entries": data})
        
        print(f"\nResponse status code: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 403:
            print("\nAuthentication required. You need to be logged in to upload data.")
            print("Try using the frontend app to view the data instead.")
        
    except Exception as e:
        print(f"Error sending request: {str(e)}")

if __name__ == "__main__":
    main() 