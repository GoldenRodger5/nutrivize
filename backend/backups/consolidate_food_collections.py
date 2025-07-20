#!/usr/bin/env python3
"""
Migration script to consolidate food_items and foods collections into a single foods collection
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.core.config import get_database

def consolidate_food_collections():
    """Consolidate food_items and foods collections into a single foods collection"""
    
    print("🔄 Consolidating Food Collections...")
    
    db = get_database()
    if db is None:
        print("❌ Could not connect to database")
        return
    
    # Get collections
    food_items_collection = db["food_items"]
    foods_collection = db["foods"]
    
    # Check current state
    food_items_count = food_items_collection.count_documents({})
    foods_count = foods_collection.count_documents({})
    
    print(f"📊 Current state:")
    print(f"   - food_items: {food_items_count} documents")
    print(f"   - foods: {foods_count} documents")
    
    # Step 1: Migrate food_items to foods collection
    print(f"\n🔄 Step 1: Migrating food_items to foods collection...")
    
    food_items = list(food_items_collection.find())
    items_to_migrate = []
    
    for item in food_items:
        # Remove the _id to let MongoDB generate a new one
        item.pop('_id', None)
        
        # Add user_id field (null for system foods)
        item['user_id'] = None
        
        # Ensure consistent structure
        if 'source' not in item:
            item['source'] = 'usda'
            
        items_to_migrate.append(item)
    
    if items_to_migrate:
        # Check for duplicates by name and source before inserting
        migrated_count = 0
        skipped_count = 0
        
        for item in items_to_migrate:
            existing = foods_collection.find_one({
                "name": item["name"], 
                "source": item["source"],
                "user_id": item["user_id"]
            })
            
            if not existing:
                foods_collection.insert_one(item)
                migrated_count += 1
            else:
                skipped_count += 1
        
        print(f"   ✅ Migrated: {migrated_count} items")
        print(f"   ⏭️  Skipped (duplicates): {skipped_count} items")
    
    # Step 2: Update FoodService to use foods collection
    print(f"\n🔄 Step 2: Verification...")
    
    final_foods_count = foods_collection.count_documents({})
    system_foods_count = foods_collection.count_documents({"user_id": None})
    user_foods_count = foods_collection.count_documents({"user_id": {"$ne": None}})
    
    print(f"📊 Final state:")
    print(f"   - Total foods: {final_foods_count}")
    print(f"   - System foods: {system_foods_count}")
    print(f"   - User foods: {user_foods_count}")
    
    # Step 3: Optional - Remove food_items collection after verification
    print(f"\n⚠️  Next steps:")
    print(f"   1. Update FoodService to use 'foods' collection")
    print(f"   2. Test the application thoroughly")
    print(f"   3. Once verified, you can drop the 'food_items' collection")
    print(f"      (Run: db.food_items.drop() in MongoDB)")
    
    return True

if __name__ == "__main__":
    consolidate_food_collections()
