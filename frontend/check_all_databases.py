import pymongo
import json
from datetime import datetime, timedelta
import sys

def main():
    """Check all MongoDB databases for health data"""
    print("Checking all MongoDB databases for health data...")
    
    try:
        # Connect to MongoDB
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        
        # List all databases
        databases = client.list_database_names()
        print(f"Found {len(databases)} databases: {', '.join(databases)}")
        
        # Check each database
        for db_name in databases:
            if db_name in ['admin', 'config', 'local']:
                print(f"\nSkipping system database: {db_name}")
                continue
                
            print(f"\nExamining database: {db_name}")
            db = client[db_name]
            
            # List all collections in this database
            collections = db.list_collection_names()
            print(f"Collections in {db_name}: {', '.join(collections)}")
            
            # Check each collection for health-related data
            for collection_name in collections:
                collection = db[collection_name]
                # Check if this collection might contain health data
                if any(term in collection_name.lower() for term in ['health', 'fit', 'step', 'calorie', 'exercise']):
                    print(f"\n  Health-related collection: {collection_name}")
                    
                    # Get count and sample
                    count = collection.count_documents({})
                    print(f"  Document count: {count}")
                    
                    if count > 0:
                        # Get a sample document
                        sample = collection.find_one()
                        print(f"  Sample document keys: {', '.join(sample.keys())}")
                        
                        # Check for specific health indicators
                        if any(key in sample for key in ['steps', 'calories', 'exercise_minutes', 'sleep_hours']):
                            print(f"  FOUND HEALTH DATA in {db_name}.{collection_name}!")
                            print(f"  Sample health data:")
                            for key in ['steps', 'calories', 'exercise_minutes', 'sleep_hours', 'source', 'user_id']:
                                if key in sample:
                                    print(f"    {key}: {sample[key]}")
                            
                            # Check for records added in the last 24 hours
                            recent_cutoff = datetime.now() - timedelta(days=1)
                            if 'updated_at' in sample:
                                recent_count = collection.count_documents({"updated_at": {"$gte": recent_cutoff}})
                                print(f"  Records updated in last 24 hours: {recent_count}")
                                
                                if recent_count > 0:
                                    # List the recent records
                                    recent_docs = collection.find({"updated_at": {"$gte": recent_cutoff}}).limit(5)
                                    for i, doc in enumerate(recent_docs):
                                        print(f"    Recent record {i+1}:")
                                        for key in ['date', 'steps', 'calories', 'source', 'user_id']:
                                            if key in doc:
                                                if key == 'date' and isinstance(doc[key], datetime):
                                                    print(f"      {key}: {doc[key].strftime('%Y-%m-%d')}")
                                                else:
                                                    print(f"      {key}: {doc[key]}")
                # Check all collections for any iOS or Swift related source
                try:
                    sources = collection.distinct("source")
                    ios_sources = [src for src in sources if any(term in src.lower() for term in ['ios', 'swift', 'apple', 'iphone', 'watch'])]
                    if ios_sources:
                        print(f"\n  Collection with iOS sources: {collection_name}")
                        print(f"  iOS Sources: {', '.join(ios_sources)}")
                        
                        # Get sample data
                        for source in ios_sources:
                            sample = collection.find_one({"source": source})
                            if sample:
                                print(f"  Sample document for source '{source}':")
                                print(f"  Keys: {', '.join(sample.keys())}")
                                # Print some values
                                for key in sample:
                                    if key not in ['_id']:
                                        print(f"    {key}: {sample[key]}")
                except:
                    pass
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return

if __name__ == "__main__":
    main() 