#!/usr/bin/env python3
"""
Script to investigate the two food collections and their usage
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.core.config import get_database

def investigate_food_collections():
    """Investigate the two food collections"""
    
    print("🔍 Investigating Food Collections...")
    
    db = get_database()
    if db is None:
        print("❌ Could not connect to database")
        return
    
    # Check what collections exist
    collections = db.list_collection_names()
    food_collections = [col for col in collections if 'food' in col.lower()]
    
    print(f"📂 Food-related collections found: {food_collections}")
    
    # Analyze food_items collection
    if "food_items" in collections:
        food_items_collection = db["food_items"]
        count = food_items_collection.count_documents({})
        print(f"\n📊 food_items collection: {count} documents")
        
        if count > 0:
            sample = food_items_collection.find_one()
            print(f"📝 Sample food_items structure:")
            print(f"   - Fields: {list(sample.keys())}")
            print(f"   - Name: {sample.get('name', 'N/A')}")
            print(f"   - Source: {sample.get('source', 'N/A')}")
            print(f"   - Has user_id: {'user_id' in sample}")
            print(f"   - Has created_by: {'created_by' in sample}")
            
            # Check if has nutrition nested
            if 'nutrition' in sample:
                nutrition = sample['nutrition']
                print(f"   - Nutrition structure: {list(nutrition.keys())}")
    
    # Analyze foods collection  
    if "foods" in collections:
        foods_collection = db["foods"]
        count = foods_collection.count_documents({})
        print(f"\n📊 foods collection: {count} documents")
        
        if count > 0:
            sample = foods_collection.find_one()
            print(f"📝 Sample foods structure:")
            print(f"   - Fields: {list(sample.keys())}")
            print(f"   - Name: {sample.get('name', 'N/A')}")
            print(f"   - Source: {sample.get('source', 'N/A')}")
            print(f"   - Has user_id: {'user_id' in sample}")
            print(f"   - Has created_by: {'created_by' in sample}")
            
            # Check if has nutrition nested
            if 'nutrition' in sample:
                nutrition = sample['nutrition']
                print(f"   - Nutrition structure: {list(nutrition.keys())}")
    
    # Check for any differences in data sources
    if "food_items" in collections and "foods" in collections:
        food_items_sources = list(db["food_items"].distinct("source"))
        foods_sources = list(db["foods"].distinct("source"))
        
        print(f"\n🏷️  Sources in food_items: {food_items_sources}")
        print(f"🏷️  Sources in foods: {foods_sources}")
        
        # Check user ownership
        food_items_with_users = db["food_items"].count_documents({"user_id": {"$exists": True}})
        foods_with_users = db["foods"].count_documents({"user_id": {"$exists": True}})
        
        print(f"\n👤 food_items with user_id: {food_items_with_users}")
        print(f"👤 foods with user_id: {foods_with_users}")

if __name__ == "__main__":
    investigate_food_collections()
