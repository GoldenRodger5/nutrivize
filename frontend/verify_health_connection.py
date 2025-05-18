#!/usr/bin/env python3
import requests
import os
import sys
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import the database functions from the backend
try:
    from app.database import get_database
    print("✅ Successfully imported database module")
except ImportError as e:
    print(f"❌ Error importing database module: {e}")
    sys.exit(1)

# User ID to check
USER_ID = "GME7nGpJQRc2v9T057vJ4oyqAJN2"

def test_backend_api():
    """Test the backend API healthkit endpoints"""
    print("\n1. Testing backend API endpoints...")
    
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
            with open("api_health_data.json", "w") as f:
                json.dump(data, f, indent=2)
            
            print(f"Successfully fetched data from API and saved to api_health_data.json")
            
            # Print a summary
            print("\nSummary of fetched data from API:")
            if 'date_range' in data:
                print(f"Date range: {data.get('date_range', {}).get('start')} to {data.get('date_range', {}).get('end')}")
                print(f"Number of days: {data.get('date_range', {}).get('days')}")
            
            # Print daily data dates
            if 'daily_data' in data and data['daily_data']:
                print("\nData available for these dates:")
                for date in sorted(data['daily_data'].keys()):
                    print(f"  {date}")
            else:
                print("\nNo daily data available from API.")
        else:
            print(f"Error: Received status code {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error accessing API: {e}")

def check_direct_mongodb():
    """Check MongoDB connection directly"""
    print("\n2. Checking MongoDB Atlas connection directly...")
    
    try:
        # Get the database connection using the app's config
        db = get_database()
        
        # Test connection
        db.command('ping')
        print("✅ Successfully connected to MongoDB Atlas")
        
        # Check if the healthkit_data collection exists
        if "healthkit_data" not in db.list_collection_names():
            print("❌ The healthkit_data collection does not exist")
            return
        
        # Query data for the user
        query = {"user_id": USER_ID}
        healthkit_data = list(db.healthkit_data.find(query))
        
        print(f"Found {len(healthkit_data)} health data entries for user {USER_ID}")
        
        if not healthkit_data:
            print("No health data found for this user.")
            return
        
        # Organize by date for easier viewing
        data_by_date = {}
        for entry in healthkit_data:
            date_str = None
            
            # Handle different date formats
            if "date_key" in entry and entry["date_key"]:
                date_str = entry["date_key"]
            elif "date" in entry:
                if isinstance(entry["date"], datetime):
                    date_str = entry["date"].strftime("%Y-%m-%d")
                elif isinstance(entry["date"], str):
                    try:
                        date_obj = datetime.fromisoformat(entry["date"].replace('Z', '+00:00'))
                        date_str = date_obj.strftime("%Y-%m-%d")
                    except:
                        date_str = entry["date"]
            
            if date_str:
                if date_str not in data_by_date:
                    data_by_date[date_str] = []
                data_by_date[date_str].append(entry)
        
        # Print summary by date
        print("\nData available by date:")
        for date in sorted(data_by_date.keys()):
            entries = data_by_date[date]
            first_entry = entries[0] if entries else {}
            steps = first_entry.get("steps", 0)
            calories = first_entry.get("calories", 0)
            print(f"  {date}: {len(entries)} entries - Steps: {steps}, Calories: {calories}")
        
        # Save the direct data for comparison
        direct_data = {"entries": []}
        for entry in healthkit_data:
            entry_copy = dict(entry)
            if "_id" in entry_copy:
                entry_copy["_id"] = str(entry_copy["_id"])
            for key, value in entry_copy.items():
                if isinstance(value, datetime):
                    entry_copy[key] = value.isoformat()
            direct_data["entries"].append(entry_copy)
        
        with open("direct_mongodb_data.json", "w") as f:
            json.dump(direct_data, f, indent=2)
        
        print("\nSaved direct MongoDB data to direct_mongodb_data.json for comparison")
    except Exception as e:
        print(f"\n❌ Error checking MongoDB directly: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_backend_api()
    check_direct_mongodb() 