#!/usr/bin/env python3

import os
import sys
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

# Load the MongoDB URL from the .env file
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
    env_vars = {}
    try:
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
        return env_vars
    except FileNotFoundError:
        print(f"❌ .env file not found at {env_path}")
        return {}

def test_mongodb_connection():
    print("🔍 Testing MongoDB connection...")
    
    # Load environment variables
    env_vars = load_env()
    mongodb_url = env_vars.get('MONGODB_URL')
    
    if not mongodb_url:
        print("❌ MONGODB_URL not found in .env file")
        return False
    
    print(f"📡 Connecting to: {mongodb_url[:50]}...")
    
    try:
        # Create a new client and connect to the server
        client = MongoClient(mongodb_url, server_api=ServerApi('1'))
        
        # Send a ping to confirm a successful connection
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB!")
        
        # Test the specific database and collection
        db = client.nutrivize_v2
        foods_collection = db.foods
        
        # Count total documents
        total_count = foods_collection.count_documents({})
        print(f"📊 Total foods in collection: {total_count}")
        
        # Count foods for specific user
        user_id = "GME7nGpJQRc2v9T057vJ4oyqAJN2"
        user_foods_count = foods_collection.count_documents({"user_id": user_id})
        print(f"👤 Foods for user {user_id}: {user_foods_count}")
        
        # Get a sample food for this user
        sample_food = foods_collection.find_one({"user_id": user_id})
        if sample_food:
            print(f"🍎 Sample food: {sample_food.get('name')}")
            print(f"📋 Has dietary_attributes: {sample_food.get('dietary_attributes') is not None}")
            if sample_food.get('dietary_attributes'):
                print(f"   - Restrictions: {sample_food['dietary_attributes'].get('dietary_restrictions', [])}")
                print(f"   - Allergens: {sample_food['dietary_attributes'].get('allergens', [])}")
                print(f"   - Categories: {sample_food['dietary_attributes'].get('food_categories', [])}")
        else:
            print("❌ No foods found for this user")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {e}")
        return False

if __name__ == "__main__":
    success = test_mongodb_connection()
    sys.exit(0 if success else 1)
