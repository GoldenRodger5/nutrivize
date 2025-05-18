import requests
import json
from datetime import datetime, timedelta

# Calculate date range for the last 7 days
end_date = datetime.now().strftime("%Y-%m-%d")
start_date = (datetime.now() - timedelta(days=6)).strftime("%Y-%m-%d")

print(f"Fetching detailed health data from {start_date} to {end_date}")

# API endpoint for detailed records
url = "http://localhost:5001/api/healthkit/data"

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
        with open("last_7_days_detailed_health_data.json", "w") as f:
            json.dump(data, f, indent=2)
        
        print(f"Successfully fetched detailed data and saved to last_7_days_detailed_health_data.json")
        
        # Print a summary of the data
        if 'data' in data and data['data']:
            print(f"\nRetrieved {len(data['data'])} health data records")
            
            # Group by date
            data_by_date = {}
            for entry in data['data']:
                date = entry.get('date', '').split('T')[0]  # Extract just the date part
                if date not in data_by_date:
                    data_by_date[date] = []
                data_by_date[date].append(entry)
            
            print("\nData available for these dates:")
            for date in sorted(data_by_date.keys()):
                print(f"  {date}: {len(data_by_date[date])} records")
                
                # Print a summary of the first record for each date
                if data_by_date[date]:
                    first_record = data_by_date[date][0]
                    print(f"    Sample data: Steps: {first_record.get('steps')}, Calories: {first_record.get('calories')}")
        else:
            print("No data records found")
    else:
        print(f"Error: Received status code {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}") 