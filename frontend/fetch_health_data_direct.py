import pymongo
import json
from datetime import datetime, timedelta
import sys

def main():
    """Fetch health data directly from MongoDB database"""
    print("Fetching health data directly from the database...")
    
    # Calculate date range for the last 7 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=6)
    
    print(f"Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    
    try:
        # Connect to MongoDB
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        
        # Access the database
        db = client["nutrivize"]
        
        # Access the healthkit_data collection
        healthkit_collection = db["healthkit_data"]
        
        # Query for the last 7 days of data
        query = {
            "date": {
                "$gte": start_date,
                "$lte": end_date
            }
        }
        
        # Execute the query
        results = list(healthkit_collection.find(query))
        
        # Check if we have data
        if not results:
            print("No health data found for the specified date range.")
            print("Make sure the data is available in the database.")
            return
        
        print(f"Found {len(results)} health data records")
        
        # Process the data for display
        data_by_date = {}
        for entry in results:
            # Convert MongoDB ObjectId to string
            entry["_id"] = str(entry["_id"])
            
            # Extract date string for grouping
            date_str = entry["date"].strftime("%Y-%m-%d")
            
            if date_str not in data_by_date:
                data_by_date[date_str] = []
                
            data_by_date[date_str].append(entry)
        
        # Save full data to file
        with open("last_7_days_health_data_direct.json", "w") as f:
            # Convert datetime objects to strings for JSON serialization
            serializable_results = []
            for entry in results:
                serializable_entry = {**entry}
                for key, value in entry.items():
                    if isinstance(value, datetime):
                        serializable_entry[key] = value.isoformat()
                serializable_results.append(serializable_entry)
                
            json.dump(serializable_results, f, indent=2)
        
        print(f"Successfully saved full data to last_7_days_health_data_direct.json")
        
        # Print summary
        print("\nSummary by date:")
        for date in sorted(data_by_date.keys()):
            entries = data_by_date[date]
            print(f"  {date}: {len(entries)} records")
            
            # Display the first entry details
            if entries:
                first_entry = entries[0]
                print(f"    Sample data - Steps: {first_entry.get('steps')}, "
                      f"Calories: {first_entry.get('calories')}, "
                      f"Sleep: {first_entry.get('sleep_hours')}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return

if __name__ == "__main__":
    main() 