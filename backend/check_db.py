#!/usr/bin/env python3
"""
Check what's in the database
"""

import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_database():
    """Check what's in the database"""
    
    # Connect to MongoDB
    mongo_uri = os.getenv("MONGODB_URL")
    if not mongo_uri:
        print("❌ MONGODB_URL not found in environment variables")
        return
    
    client = MongoClient(mongo_uri)
    db = client.food_tracker
    
    # Check collections
    collections = db.list_collection_names()
    print(f"📊 Collections in database: {collections}")
    
    # Check foods collection
    foods_collection = db.foods
    food_count = foods_collection.count_documents({})
    print(f"🍎 Foods in collection: {food_count}")
    
    if food_count > 0:
        # Show sample foods
        sample_foods = list(foods_collection.find({}).limit(3))
        print(f"🔍 Sample foods:")
        for food in sample_foods:
            print(f"   - {food.get('name', 'Unknown')}: {food.get('dietary_attributes', 'No attributes')}")
    
    client.close()

if __name__ == "__main__":
    check_database()
