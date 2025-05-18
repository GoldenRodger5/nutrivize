import pymongo
from datetime import datetime

def main():
    """Add date_key field to existing healthkit records"""
    print("Adding date_key field to existing healthkit records...")
    
    try:
        # Connect to MongoDB
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        
        # Access the database
        db = client["nutrivize"]
        
        # Access the healthkit_data collection
        healthkit_collection = db["healthkit_data"]
        
        # Get count of documents without date_key
        missing_date_key_count = healthkit_collection.count_documents({"date_key": {"$exists": False}})
        print(f"Found {missing_date_key_count} documents without date_key field")
        
        if missing_date_key_count == 0:
            print("No documents need updating.")
            return
        
        # Get all documents without date_key
        documents = list(healthkit_collection.find({"date_key": {"$exists": False}}))
        
        updated_count = 0
        
        # Update each document
        for doc in documents:
            # Extract date_key from date
            if "date" in doc and isinstance(doc["date"], datetime):
                date_key = doc["date"].strftime("%Y-%m-%d")
                
                # Update the document
                result = healthkit_collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {"date_key": date_key}}
                )
                
                if result.modified_count > 0:
                    updated_count += 1
        
        print(f"Updated {updated_count} documents with date_key field")
        
        # Verify all documents now have date_key
        missing_date_key_count = healthkit_collection.count_documents({"date_key": {"$exists": False}})
        if missing_date_key_count == 0:
            print("All documents now have a date_key field")
        else:
            print(f"There are still {missing_date_key_count} documents without date_key field")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main() 