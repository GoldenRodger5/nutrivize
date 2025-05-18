import pymongo
import json
from datetime import datetime
import sys

def main():
    """Fetch all health data directly from MongoDB database"""
    print("Fetching all available health data from the database...")
    
    try:
        # Connect to MongoDB
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        
        # Access the database
        db = client["nutrivize"]
        
        # Check if the healthkit_data collection exists
        if "healthkit_data" not in db.list_collection_names():
            print("The healthkit_data collection does not exist in the database.")
            return
        
        # Access the healthkit_data collection
        healthkit_collection = db["healthkit_data"]
        
        # Get total count of records
        total_count = healthkit_collection.count_documents({})
        print(f"Total health data records in the database: {total_count}")
        
        if total_count == 0:
            print("No health data found in the database.")
            return
        
        # Execute the query to get all data
        results = list(healthkit_collection.find({}))
        
        print(f"Retrieved {len(results)} health data records")
        
        # Process the data for display
        data_by_date = {}
        for entry in results:
            # Convert MongoDB ObjectId to string
            entry["_id"] = str(entry["_id"])
            
            # Extract date string for grouping
            if isinstance(entry.get("date"), datetime):
                date_str = entry["date"].strftime("%Y-%m-%d")
            else:
                # If date is not a datetime object, use some default
                date_str = "unknown_date"
            
            if date_str not in data_by_date:
                data_by_date[date_str] = []
                
            data_by_date[date_str].append(entry)
        
        # Save full data to file
        with open("all_health_data.json", "w") as f:
            # Convert datetime objects to strings for JSON serialization
            serializable_results = []
            for entry in results:
                serializable_entry = {**entry}
                for key, value in entry.items():
                    if isinstance(value, datetime):
                        serializable_entry[key] = value.isoformat()
                serializable_results.append(serializable_entry)
                
            json.dump(serializable_results, f, indent=2)
        
        print(f"Successfully saved all data to all_health_data.json")
        
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
        
        # Also check other health-related collections
        print("\nChecking other health-related collections:")
        for collection_name in db.list_collection_names():
            if "health" in collection_name.lower():
                count = db[collection_name].count_documents({})
                print(f"  {collection_name}: {count} records")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return

if __name__ == "__main__":
    main() 