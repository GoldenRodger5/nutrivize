#!/usr/bin/env python3
import requests
import json
from datetime import datetime

# Define the user credentials
credentials = {
    "email": "isaacmineo@gmail.com",
    "password": "Buddydog41"  # Note: In a real script, never hardcode passwords
}

# API base URL
base_url = "http://localhost:5001"

def main():
    print("Testing Apple Health API authentication flow")
    print("===========================================")
    
    # Step 1: Login to get auth token
    print("\n1. Logging in to get authentication token...")
    try:
        login_response = requests.post(
            f"{base_url}/auth/login",
            json=credentials
        )
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            token = login_data.get("token")
            user_id = login_data.get("uid")
            print(f"✅ Login successful")
            print(f"User ID: {user_id}")
            print(f"Token received: {token[:15]}...")
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return
    except Exception as e:
        print(f"❌ Error during login: {str(e)}")
        return
    
    # Setup headers with auth token
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Step 2: Verify authentication by getting user profile
    print("\n2. Verifying authentication by getting user profile...")
    try:
        profile_response = requests.get(
            f"{base_url}/auth/me",
            headers=headers
        )
        
        if profile_response.status_code == 200:
            profile_data = profile_response.json()
            print(f"✅ Authentication verified")
            print(f"Profile data: {profile_data}")
        else:
            print(f"❌ Authentication verification failed: {profile_response.status_code}")
            print(f"Response: {profile_response.text}")
    except Exception as e:
        print(f"❌ Error verifying authentication: {str(e)}")
    
    # Step 3: Get today's date in the format used by the API
    today = datetime.now().strftime("%Y-%m-%d")
    week_ago = (datetime.now().replace(day=datetime.now().day-6)).strftime("%Y-%m-%d")
    
    print(f"\n3. Current date range: {week_ago} to {today}")
    
    # Step 4: Get health summary data
    print("\n4. Getting health summary data...")
    try:
        summary_response = requests.get(
            f"{base_url}/api/healthkit/summary",
            headers=headers,
            params={
                "start_date": week_ago,
                "end_date": today
            }
        )
        
        if summary_response.status_code == 200:
            summary_data = summary_response.json()
            print(f"✅ Successfully retrieved health summary data")
            
            # Save summary data to file
            with open("health_summary_debug.json", "w") as f:
                json.dump(summary_data, f, indent=2)
            
            print(f"Summary data saved to health_summary_debug.json")
            
            # Print available dates
            if "daily_data" in summary_data and summary_data["daily_data"]:
                print("\nAvailable dates in summary data:")
                for date in sorted(summary_data["daily_data"].keys()):
                    print(f"  - {date}")
            else:
                print("\nNo daily data found in summary response, even though data exists in MongoDB")
        else:
            print(f"❌ Failed to get health summary data: {summary_response.status_code}")
            print(f"Response: {summary_response.text}")
    except Exception as e:
        print(f"❌ Error getting health summary data: {str(e)}")
    
    # Step 5: Get detailed health data
    print("\n5. Getting detailed health data...")
    try:
        detail_response = requests.get(
            f"{base_url}/api/healthkit/data",
            headers=headers,
            params={
                "start_date": week_ago,
                "end_date": today
            }
        )
        
        if detail_response.status_code == 200:
            detail_data = detail_response.json()
            print(f"✅ Successfully retrieved detailed health data")
            
            # Save detailed data to file
            with open("health_detail_debug.json", "w") as f:
                json.dump(detail_data, f, indent=2)
            
            print(f"Detailed data saved to health_detail_debug.json")
            
            # Print available records
            if "data" in detail_data and detail_data["data"]:
                print(f"\nFound {len(detail_data['data'])} health records:")
                for idx, entry in enumerate(detail_data["data"]):
                    date_str = entry.get("date_key", str(entry.get("date", "Unknown")))
                    print(f"  {idx+1}. Date: {date_str} - Steps: {entry.get('steps', 0)}, Calories: {entry.get('calories', 0)}")
            else:
                print("\nNo health records found in detailed data response, even though data exists in MongoDB")
        else:
            print(f"❌ Failed to get detailed health data: {detail_response.status_code}")
            print(f"Response: {detail_response.text}")
    except Exception as e:
        print(f"❌ Error getting detailed health data: {str(e)}")

if __name__ == "__main__":
    main() 