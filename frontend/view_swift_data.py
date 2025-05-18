import pymongo
import json
from datetime import datetime, timedelta
import sys

def main():
    """View Swift data in the database with date_key field"""
    print("Checking for Swift health data in the database...")
    
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
        
        # Check if date_key exists in any documents
        date_key_exists = healthkit_collection.count_documents({"date_key": {"$exists": True}}) > 0
        print(f"Documents with date_key field: {healthkit_collection.count_documents({'date_key': {'$exists': True}})}")
        
        # Retrieve documents with Swift source
        swift_data = list(healthkit_collection.find({"source": {"$regex": ".*Swift.*", "$options": "i"}}))
        apple_data = list(healthkit_collection.find({"source": {"$regex": ".*Apple.*", "$options": "i"}}))
        
        all_real_data = swift_data + [doc for doc in apple_data if doc not in swift_data]
        
        if all_real_data:
            print(f"\nFound {len(all_real_data)} entries from Apple/Swift sources")
            
            # Group by source
            data_by_source = {}
            for doc in all_real_data:
                source = doc.get("source", "Unknown")
                if source not in data_by_source:
                    data_by_source[source] = []
                data_by_source[source].append(doc)
            
            # Print information by source
            for source, docs in data_by_source.items():
                print(f"\nSource: {source}")
                print(f"Count: {len(docs)}")
                
                # Print date range
                if docs and "date" in docs[0]:
                    dates = [doc.get("date") for doc in docs if "date" in doc]
                    earliest = min(dates).strftime("%Y-%m-%d")
                    latest = max(dates).strftime("%Y-%m-%d")
                    print(f"Date range: {earliest} to {latest}")
                
                # Print date_keys if they exist
                if docs and "date_key" in docs[0]:
                    date_keys = sorted([doc.get("date_key") for doc in docs if "date_key" in doc])
                    print(f"Date keys: {', '.join(date_keys)}")
                
                # Sample document
                if docs:
                    sample = docs[0]
                    print("\nSample document:")
                    for key in ["user_id", "date", "date_key", "steps", "calories", "source"]:
                        if key in sample:
                            if key == "date" and isinstance(sample[key], datetime):
                                print(f"  {key}: {sample[key].isoformat()}")
                            else:
                                print(f"  {key}: {sample[key]}")
                                
                    # Print all keys 
                    print(f"\nAll fields in document: {', '.join(sample.keys())}")
        else:
            print("No Swift or Apple HealthKit data found")
            
            # Get most recent entries
            recent_entries = list(healthkit_collection.find().sort("date", -1).limit(3))
            
            if recent_entries:
                print("\nMost recent entries in database:")
                for i, entry in enumerate(recent_entries):
                    print(f"\nEntry {i+1}:")
                    print(f"  Source: {entry.get('source', 'Unknown')}")
                    print(f"  Date: {entry.get('date').isoformat() if 'date' in entry and isinstance(entry['date'], datetime) else entry.get('date')}")
                    print(f"  Date key: {entry.get('date_key', 'Not present')}")
                    print(f"  Steps: {entry.get('steps')}")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main() 