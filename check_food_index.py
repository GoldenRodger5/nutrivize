#!/usr/bin/env python3

import sys
import os
from pymongo import MongoClient
from dotenv import load_dotenv
import json
from bson import ObjectId
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load environment variables from .env.local
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), 'backend/.env.local'))

# Custom JSON encoder to handle ObjectId and datetime
class MongoJSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)

def check_food_index(user_id=None):
    """Check user's food index in MongoDB"""
    # Get MongoDB connection string from environment
    mongodb_url = os.environ.get("MONGODB_URL")
    if not mongodb_url:
        print("❌ Error: MONGODB_URL not set in environment")
        sys.exit(1)
    
    try:
        # Connect to MongoDB
        print(f"🔄 Connecting to MongoDB...")
        client = MongoClient(mongodb_url)
        
        # Test connection
        client.admin.command('ping')
        print("✅ Connected to MongoDB")
        
        # Get database (last part of connection string after last /)
        db_name = mongodb_url.split("/")[-1].split("?")[0]
        db = client[db_name]
        
        # List collections
        collections = db.list_collection_names()
        print(f"📊 Collections in database: {collections}")
        
        # Check the foods collection
        if "foods" not in collections:
            print("❌ Error: 'foods' collection not found")
            return
        
        # Count total food items
        total_count = db.foods.count_documents({})
        print(f"📊 Total food items: {total_count}")
        
        # Use the default user ID or accept from command line if provided
        if user_id is None:
            # Use default user ID
            user_id = "GME7nGpJQRc2v9T057vJ4oyqAJN2"
            print(f"🔍 Using default user ID: {user_id}")
        
        # Check for user's food items
        if user_id:
            query = {"user_id": user_id}
            count = db.foods.count_documents(query)
            print(f"📊 Food items for user {user_id}: {count}")
            
            # Show sample items
            if count > 0:
                print("\n📋 Sample food items for this user:")
                for item in db.foods.find(query).limit(5):
                    print(json.dumps(item, indent=2, cls=MongoJSONEncoder))
            else:
                print("⚠️ No food items found for this user")
                
            # Check query with $or to see if it would return results
            or_query = {"$or": [
                {"user_id": user_id},
                {"user_id": None},
                {"user_id": {"$exists": False}}
            ]}
            or_count = db.foods.count_documents(or_query)
            print(f"📊 Food items with $or query: {or_count}")
            
            # Show sample items with $or query
            if or_count > 0:
                print("\n📋 Sample food items with $or query:")
                for item in db.foods.find(or_query).limit(5):
                    print(json.dumps(item, indent=2, cls=MongoJSONEncoder))
        else:
            # List unique user IDs in the foods collection
            user_ids = db.foods.distinct("user_id")
            print(f"👥 Unique user IDs in foods collection: {user_ids}")
            
            # Count items without user_id
            null_count = db.foods.count_documents({"user_id": None})
            print(f"📊 Food items with null user_id: {null_count}")
            
            missing_count = db.foods.count_documents({"user_id": {"$exists": False}})
            print(f"📊 Food items without user_id field: {missing_count}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    # Check if user ID is provided as command line argument
    user_id_arg = sys.argv[1] if len(sys.argv) > 1 else None
    check_food_index(user_id_arg)
