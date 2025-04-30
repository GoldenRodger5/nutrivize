#!/usr/bin/env python
"""
Reset script for the Nutrivize chatbot
This script helps to clean up and verify the chatbot's state
"""

import os
import sys
from app.database import test_connection
from app.models import search_food_items
from app.constants import USER_ID

def main():
    print("Nutrivize Chatbot Reset Tool")
    print("============================")
    
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
        print("You may want to run the seed data script:")
        print("  PYTHONPATH=$PWD python -m app.seed_mock_data")
    else:
        print(f"✅ Found {len(foods)} food items in the database")
        print("\nSample foods:")
        for i, food in enumerate(foods[:5]):
            print(f"  - {food.get('name', 'Unnamed')}: {food.get('calories', 0)} calories")
        if len(foods) > 5:
            print(f"  ... and {len(foods) - 5} more")
    
    print("\nUser ID:", USER_ID)
    
    print("\nReset complete. Restart the backend server to apply any changes.")
    print("To restart the server, run:")
    print("  PYTHONPATH=$PWD uvicorn app.main:app --reload")

if __name__ == "__main__":
    main() 