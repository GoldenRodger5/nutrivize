import requests
import json
from datetime import datetime, timedelta
import random

def main():
    """Test the Swift authentication system and upload HealthKit data"""
    print("Testing Swift auth endpoints and authenticated HealthKit upload...")
    
    # Base URL for the API
    base_url = "http://localhost:5001/api"
    
    # Step 1: Get a mock auth token (for testing only)
    token = get_auth_token(base_url)
    if not token:
        print("Failed to get auth token. Exiting.")
        return
    
    # Step 2: Generate mock health data for the last 10 days
    health_data = generate_mock_health_data()
    
    # Step 3: Upload the data with authentication
    upload_data_with_auth(base_url, token, health_data)
    
def get_auth_token(base_url):
    """Get a mock authentication token"""
    print("\n1. Getting authentication token...")
    
    # For testing, we'll use the mock login endpoint
    user_id = "GME7nGpJQRc2v9T057vJ4oyqAJN2"  # Your test user ID
    
    try:
        url = f"{base_url}/swift/mock-login"
        response = requests.post(url, json={"user_id": user_id})
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print(f"Success! Got token: {token[:15]}...")
            return token
        else:
            print(f"Error: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"Error getting token: {str(e)}")
        return None

def generate_mock_health_data():
    """Generate mock HealthKit data for 10 days"""
    print("\n2. Generating mock health data...")
    
    data = []
    
    # Fixed user ID - make sure this matches the user ID used for authentication
    user_id = "GME7nGpJQRc2v9T057vJ4oyqAJN2"  
    
    # Today's date
    end_date = datetime.now()
    
    # Generate data for last 10 days
    for i in range(10):
        date = end_date - timedelta(days=i)
        date_iso = date.strftime("%Y-%m-%dT04:00:00Z")  # T04:00:00Z is the format from Swift
        date_key = date.strftime("%Y-%m-%d")
        
        # Create realistic but random health data
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
            "source": "Apple HealthKit (Swift Test)"
        }
        
        data.append(entry)
    
    print(f"Generated {len(data)} days of mock health data")
    return data

def upload_data_with_auth(base_url, token, health_data):
    """Upload health data with authentication"""
    print("\n3. Uploading health data with authentication...")
    
    try:
        url = f"{base_url}/swift/healthkit/batch-upload"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "entries": health_data
        }
        
        print(f"Uploading to: {url}")
        print(f"Using authorization header: Bearer {token[:15]}...")
        
        # Send the request
        response = requests.post(url, headers=headers, json=payload)
        
        print(f"\nResponse status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success! Uploaded {len(data.get('results', []))} entries")
            
            # Print details of created/updated entries
            if "results" in data:
                created = sum(1 for r in data["results"] if r["status"] == "created")
                updated = sum(1 for r in data["results"] if r["status"] == "updated")
                print(f"  Created: {created}")
                print(f"  Updated: {updated}")
            
            # Print any errors
            if "errors" in data and data["errors"]:
                print(f"  Errors: {len(data['errors'])}")
                for error in data["errors"]:
                    print(f"    Entry {error['index']}: {error['error']}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error uploading data: {str(e)}")

if __name__ == "__main__":
    main() 