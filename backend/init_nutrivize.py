#!/usr/bin/env python
"""
Initialize Nutrivize MongoDB connection without resetting data
"""

import os
import sys
from app.database import test_connection, get_database
from app.models import search_food_items
from app.constants import TEST_USER_ID

def main():
    print("Nutrivize MongoDB Initialization")
    print("================================")
    
    # Test database connection
    print("\nTesting MongoDB connection...")
    connection_success = test_connection()
    
    if not connection_success:
        print("❌ Failed to connect to MongoDB. Please check your credentials.")
        sys.exit(1)
    
    print("✅ Successfully connected to MongoDB")
    
    # Check for food items in the database
    print("\nChecking food database...")
    foods = search_food_items("")
    
    if not foods:
        print("⚠️ No food items found in the database.")
        print("Would you like to initialize the database with sample foods? (y/n)")
        choice = input().lower()
        if choice == 'y':
            print("\nInitializing database with sample foods (without logs)...")
            from app.seed_mock_data import mock_foods
            db = get_database()
            
            # Only add foods without creating logs
            for food in mock_foods:
                existing = db.food_index.find_one({"name": food["name"]})
                if not existing:
                    # FIXME: In production, foods should be created with the actual authenticated user ID
                    food["created_by"] = TEST_USER_ID  # Only used for initialization
                    result = db.food_index.insert_one(food)
                    print(f"Added '{food['name']}' to food index")
            
            print("✅ Food database initialized with sample foods")
        else:
            print("Skipping initialization")
    else:
        print(f"✅ Found {len(foods)} food items in the database")
        print("\nSample foods:")
        for i, food in enumerate(foods[:5]):
            print(f"  - {food.get('name', 'Unnamed')}: {food.get('calories', 0)} calories")
        if len(foods) > 5:
            print(f"  ... and {len(foods) - 5} more")
    
    print("\nWARNING: Using test user ID for initialization:", TEST_USER_ID)
    print("In production, always use authenticated user IDs from Firebase Auth")
    
    print("\nInitialization complete.")
    print("To start the backend server, run:")
    print("  PYTHONPATH=$PWD uvicorn app.main:app --reload")

if __name__ == "__main__":
    main() 