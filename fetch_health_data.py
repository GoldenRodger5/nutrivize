import requests
import json
from datetime import datetime, timedelta

# Calculate date range for the last 7 days
end_date = datetime.now().strftime("%Y-%m-%d")
start_date = (datetime.now() - timedelta(days=6)).strftime("%Y-%m-%d")

print(f"Fetching health data from {start_date} to {end_date}")

# API endpoint
url = "http://localhost:5001/api/healthkit/summary"

# Parameters
params = {
    "start_date": start_date,
    "end_date": end_date
}

# Make the request
try:
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        # Get the data
        data = response.json()
        
        # Save to file
        with open("last_7_days_health_data.json", "w") as f:
            json.dump(data, f, indent=2)
        
        print(f"Successfully fetched data and saved to last_7_days_health_data.json")
        
        # Print a summary
        print("\nSummary of fetched data:")
        print(f"Date range: {data.get('date_range', {}).get('start')} to {data.get('date_range', {}).get('end')}")
        print(f"Number of days: {data.get('date_range', {}).get('days')}")
        
        # Print averages
        if 'averages' in data:
            print("\nAverages:")
            for key, value in data['averages'].items():
                print(f"  {key}: {value}")
        
        # Print daily data dates
        if 'daily_data' in data:
            print("\nData available for these dates:")
            for date in sorted(data['daily_data'].keys()):
                print(f"  {date}")
    else:
        print(f"Error: Received status code {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}") 