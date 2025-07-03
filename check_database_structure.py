#!/usr/bin/env python3
"""
Simple script to check the actual database structure for foods
"""

import asyncio
import os
import sys
from datetime import datetime

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from app.core.config import get_database

async def check_database():
    """Check the actual database structure"""
    print("🔍 Checking database structure for foods...")
    
    db = get_database()
    if db is None:
        print("❌ Could not connect to database")
        return
    
    food_collection = db["foods"]
    
    # Get total count
    total_count = food_collection.count_documents({})
    print(f"📊 Total foods in database: {total_count}")
    
    # Check foods with null dietary_attributes
    null_attrs = food_collection.count_documents({"dietary_attributes": None})
    print(f"📊 Foods with null dietary_attributes: {null_attrs}")
    
    # Check foods with missing dietary_attributes field
    missing_attrs = food_collection.count_documents({"dietary_attributes": {"$exists": False}})
    print(f"📊 Foods with missing dietary_attributes field: {missing_attrs}")
    
    # Check foods with empty dietary_attributes
    empty_attrs = food_collection.count_documents({"dietary_attributes": {}})
    print(f"📊 Foods with empty dietary_attributes object: {empty_attrs}")
    
    # Get some sample foods to examine
    print("\n🔍 Sample foods from database:")
    sample_foods = list(food_collection.find({}).limit(3))
    
    for i, food in enumerate(sample_foods, 1):
        print(f"\n--- Food {i} ---")
        print(f"ID: {food.get('_id')}")
        print(f"Name: {food.get('name', 'NO NAME')}")
        print(f"Dietary Attributes: {food.get('dietary_attributes', 'MISSING')}")
        
        # Check the actual field existence
        if 'dietary_attributes' in food:
            print(f"  ✅ Field exists, value: {type(food['dietary_attributes'])}")
        else:
            print(f"  ❌ Field does not exist")

if __name__ == "__main__":
    asyncio.run(check_database())
