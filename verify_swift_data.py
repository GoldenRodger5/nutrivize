import pymongo
import json
from datetime import datetime, timedelta
import sys

def main():
    """Verify if any Swift data exists in the database"""
    print("Verifying if any Swift data exists in the healthkit_data collection...")
    
    try:
        # Connect to MongoDB
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        
        # Access the database
        db = client["nutrivize"]
        
        # Access the healthkit_data collection
        healthkit_collection = db["healthkit_data"]
        
        # Get all sources
        sources = healthkit_collection.distinct("source")
        print(f"Sources in healthkit_data: {', '.join(sources)}")
        
        # Check for records with source other than "Mock Data Generator"
        real_data = list(healthkit_collection.find({"source": {"$ne": "Mock Data Generator"}}))
        
        if real_data:
            print(f"FOUND {len(real_data)} RECORDS FROM REAL SOURCES!")
            
            # Group by source
            data_by_source = {}
            for doc in real_data:
                source = doc.get("source", "Unknown")
                if source not in data_by_source:
                    data_by_source[source] = []
                data_by_source[source].append(doc)
            
            # Print summary for each source
            for source, docs in data_by_source.items():
                print(f"\nSource: {source}")
                print(f"Record count: {len(docs)}")
                
                # Print date range
                dates = [doc.get("date") for doc in docs if "date" in doc]
                if dates:
                    earliest = min(dates)
                    latest = max(dates)
                    print(f"Date range: {earliest.strftime('%Y-%m-%d')} to {latest.strftime('%Y-%m-%d')}")
                
                # Print sample record
                if docs:
                    sample = docs[0]
                    print("\nSample record:")
                    for key in ["user_id", "date", "steps", "calories", "distance", "exercise_minutes", "sleep_hours"]:
                        if key in sample:
                            if key == "date" and isinstance(sample[key], datetime):
                                print(f"  {key}: {sample[key].strftime('%Y-%m-%d')}")
                            else:
                                print(f"  {key}: {sample[key]}")
        else:
            print("No records found from sources other than 'Mock Data Generator'")
            
            # List all entries
            all_entries = list(healthkit_collection.find({}))
            print(f"\nTotal entries in collection: {len(all_entries)}")
            if all_entries:
                print("All data currently in the database is from the mock generator")
                print("\nHere are the most recent entries:")
                
                # Sort by date descending and show the 3 most recent
                sorted_entries = sorted(all_entries, key=lambda x: x.get("date", datetime.min), reverse=True)
                for i, entry in enumerate(sorted_entries[:3]):
                    print(f"\nEntry {i+1} (date: {entry.get('date').strftime('%Y-%m-%d')}):")
                    for key in ["user_id", "steps", "calories", "source", "updated_at"]:
                        if key in entry:
                            if isinstance(entry[key], datetime):
                                print(f"  {key}: {entry[key].strftime('%Y-%m-%d %H:%M:%S')}")
                            else:
                                print(f"  {key}: {entry[key]}")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main() 