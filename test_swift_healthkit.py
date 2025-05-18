import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://127.0.0.1:5001"

# Step 1: Login to get a token
login_data = {
    "email": "isaacmineo@gmail.com",
    "password": "Buddydog41"
}

print(f"Logging in as {login_data['email']}...")
login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)

if login_response.status_code != 200:
    print(f"Login failed with status code {login_response.status_code}: {login_response.text}")
    exit(1)

login_json = login_response.json()
token = login_json.get("token")
user_id = login_json.get("uid")

print(f"Login successful! User ID: {user_id}")
print(f"Token: {token[:20]}...")

# Step 2: Use the token to fetch HealthKit data
headers = {
    "Authorization": f"Bearer {token}"
}

# Calculate date range
end_date = datetime.now().strftime("%Y-%m-%d")
# One week ago
start_date = (datetime.now().replace(day=datetime.now().day - 7)).strftime("%Y-%m-%d")

print(f"\nFetching HealthKit data from {start_date} to {end_date}...")
data_url = f"{BASE_URL}/api/swift/healthkit/data?start_date={start_date}&end_date={end_date}"
print(f"URL: {data_url}")

data_response = requests.get(data_url, headers=headers)

print(f"Response status code: {data_response.status_code}")
print(f"Response headers: {data_response.headers}")

if data_response.status_code == 200:
    try:
        data_json = data_response.json()
        print(f"Success! Received {len(data_json.get('data', []))} HealthKit entries")
        
        # Print some data for verification
        if data_json.get('data'):
            print("\nSample data:")
            for i, entry in enumerate(data_json.get('data')[:3]):  # Show up to 3 entries
                print(f"Entry {i+1}: Date={entry.get('date_key', 'N/A')}, Steps={entry.get('steps', 'N/A')}")
        else:
            print("No data entries found for this date range")
            
    except json.JSONDecodeError:
        print("Error decoding JSON response")
        print(f"Raw response: {data_response.text[:500]}...")  # Show first 500 chars
else:
    print(f"Error fetching data: {data_response.text}")

# Step 3: Test the /api/healthkit/summary endpoint as well
print("\nFetching HealthKit summary...")
summary_url = f"{BASE_URL}/api/healthkit/summary?start_date={start_date}&end_date={end_date}"
summary_response = requests.get(summary_url, headers=headers)

print(f"Summary response status code: {summary_response.status_code}")

if summary_response.status_code == 200:
    try:
        summary_json = summary_response.json()
        print("Summary successfully retrieved!")
        print(f"Date range: {summary_json.get('date_range', {}).get('start')} to {summary_json.get('date_range', {}).get('end')}")
        print(f"Daily data points: {len(summary_json.get('daily_data', {}))}")
        
        # Show averages
        if summary_json.get('averages'):
            print("\nAverages:")
            for key, value in summary_json.get('averages', {}).items():
                print(f"  {key}: {value}")
    except json.JSONDecodeError:
        print("Error decoding JSON summary response")
        print(f"Raw response: {summary_response.text[:500]}...")  # Show first 500 chars
else:
    print(f"Error fetching summary: {summary_response.text}") 