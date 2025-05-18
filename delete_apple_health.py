#!/usr/bin/env python3
import sys
import os
import traceback

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Import the database module from the app
try:
    from app.database import get_database
    print("✅ Successfully imported database module")
except ImportError as e:
    print(f"❌ Error importing database module: {e}")
    sys.exit(1)

# User ID to delete data for
USER_ID = "GME7nGpJQRc2v9T057vJ4oyqAJN2"

def main():
    print(f"Connecting to MongoDB to delete Apple Health data for user {USER_ID}...")
    
    try:
        # Get the database connection using the app's config
        db = get_database()
        
        # Test connection
        db.command('ping')
        print("✅ Successfully connected to MongoDB")
        
        # Check all health data collections
        collections = ["healthkit_data", "health_data"]
        
        for collection_name in collections:
            if collection_name in db.list_collection_names():
                print(f"\nChecking collection: {collection_name}")
                
                # Count documents before deletion
                before_count = db[collection_name].count_documents({"user_id": USER_ID})
                print(f"Found {before_count} records for user {USER_ID}")
                
                # Delete all documents for this user
                result = db[collection_name].delete_many({"user_id": USER_ID})
                print(f"Deleted {result.deleted_count} records")
                
                # Verify deletion
                after_count = db[collection_name].count_documents({"user_id": USER_ID})
                print(f"Remaining records: {after_count}")
            else:
                print(f"\nCollection {collection_name} does not exist")
        
        print("\n✅ Health data deletion complete")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        traceback.print_exc()

if __name__ == "__main__":
    main() 