import sys
import os
sys.path.append(os.path.abspath("."))
from backend.app.database import get_database
from datetime import datetime, timedelta
import json

def main():
    """Check for health data sent from the Swift app"""
    print("Checking for health data sent from the Swift app using official backend connection...")
    
    try:
        # Use the backend's database connection
        db = get_database()
        
        # List all collections
        collections = db.list_collection_names()
        print(f"Collections in nutrivize database: {', '.join(collections)}")
        
        # Check all health-related collections
        health_collections = [coll for coll in collections if "health" in coll.lower()]
        
        if not health_collections:
            print("No health-related collections found.")
            return
        
        print(f"\nExamining {len(health_collections)} health-related collections:")
        
        for collection_name in health_collections:
            collection = db[collection_name]
            total_count = collection.count_documents({})
            print(f"\nCollection: {collection_name} ({total_count} documents)")
            
            # Check distinct user IDs
            user_ids = collection.distinct("user_id")
            print(f"User IDs: {', '.join(user_ids) if user_ids else 'None'}")
            
            # Check distinct sources
            sources = collection.distinct("source")
            print(f"Sources: {', '.join(sources) if sources else 'None'}")
            
            # Get date range
            if total_count > 0:
                earliest_doc = collection.find_one({}, sort=[("date", 1)])
                latest_doc = collection.find_one({}, sort=[("date", -1)])
                
                earliest_date = earliest_doc.get("date") if earliest_doc else None
                latest_date = latest_doc.get("date") if latest_doc else None
                
                if earliest_date and latest_date:
                    print(f"Date range: {earliest_date.strftime('%Y-%m-%d')} to {latest_date.strftime('%Y-%m-%d')}")
                    
                    # Count records by date
                    date_counts = {}
                    cursor = collection.aggregate([
                        {
                            "$group": {
                                "_id": {
                                    "$dateToString": {
                                        "format": "%Y-%m-%d",
                                        "date": "$date"
                                    }
                                },
                                "count": {"$sum": 1}
                            }
                        },
                        {"$sort": {"_id": 1}}
                    ])
                    
                    for doc in cursor:
                        date_counts[doc["_id"]] = doc["count"]
                    
                    print("Records by date:")
                    for date, count in date_counts.items():
                        print(f"  {date}: {count} records")
                    
                    # Check for entries with zero values
                    zero_values = collection.count_documents({"steps": 0, "calories": 0})
                    if zero_values > 0:
                        print(f"Found {zero_values} records with zero values!")
                    
                    # Show a sample of entries
                    print("\nSample entries:")
                    # Get a sampling of entries with both zero and non-zero values
                    normal_entry = collection.find_one({"steps": {"$gt": 0}, "calories": {"$gt": 0}})
                    zero_entry = collection.find_one({"steps": 0, "calories": 0})
                    
                    if normal_entry:
                        print(f"  Non-zero entry:")
                        print(f"    Date: {normal_entry.get('date_key', normal_entry.get('date').strftime('%Y-%m-%d') if isinstance(normal_entry.get('date'), datetime) else 'Unknown')}")
                        print(f"    Steps: {normal_entry.get('steps')}")
                        print(f"    Calories: {normal_entry.get('calories')}")
                        print(f"    Source: {normal_entry.get('source')}")
                    
                    if zero_entry:
                        print(f"  Zero-value entry:")
                        print(f"    Date: {zero_entry.get('date_key', zero_entry.get('date').strftime('%Y-%m-%d') if isinstance(zero_entry.get('date'), datetime) else 'Unknown')}")
                        print(f"    Steps: {zero_entry.get('steps')}")
                        print(f"    Calories: {zero_entry.get('calories')}")
                        print(f"    Source: {zero_entry.get('source')}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return

if __name__ == "__main__":
    main() 