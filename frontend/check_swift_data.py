import pymongo
import json
from datetime import datetime, timedelta
import sys

def main():
    """Check for health data sent from the Swift app"""
    print("Checking for health data sent from the Swift app...")
    
    try:
        # Connect to MongoDB
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        
        # List all databases
        databases = client.list_database_names()
        print(f"Available databases: {', '.join(databases)}")
        
        # Access the database
        db = client["nutrivize"]
        
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
            print(f"User IDs: {', '.join(user_ids)}")
            
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
                    
                    # Check for recent records (within last 24 hours)
                    recent_cutoff = datetime.now() - timedelta(days=1)
                    recent_count = collection.count_documents({"updated_at": {"$gte": recent_cutoff}})
                    
                    if recent_count > 0:
                        print(f"Found {recent_count} records updated in the last 24 hours!")
                        
                        # List the recent records
                        recent_docs = collection.find({"updated_at": {"$gte": recent_cutoff}})
                        for i, doc in enumerate(recent_docs):
                            print(f"  Recent record {i+1}:")
                            print(f"    Date: {doc.get('date').strftime('%Y-%m-%d')}")
                            print(f"    Steps: {doc.get('steps')}")
                            print(f"    Calories: {doc.get('calories')}")
                            print(f"    Source: {doc.get('source')}")
                            print(f"    Updated: {doc.get('updated_at').strftime('%Y-%m-%d %H:%M:%S')}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return

if __name__ == "__main__":
    main() 