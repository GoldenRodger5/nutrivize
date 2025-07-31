#!/usr/bin/env python3
"""
Migration script to consolidate food databases into user-specific foods only
This ensures proper data separation for multi-user app
"""

import os
import sys
from pymongo import MongoClient
from datetime import datetime

def migrate_to_user_foods():
    """
    Migrate all foods to user-specific foods collection with proper data separation
    """
    
    # MongoDB connection
    mongo_uri = os.getenv('MONGODB_URI', 'mongodb+srv://username:password@cluster.mongodb.net/nutrivize?retryWrites=true&w=majority')
    client = MongoClient(mongo_uri)
    db = client['nutrivize']
    
    foods_collection = db['foods']  # Target collection (user-specific)
    food_items_collection = db['food_items']  # Source collection (system-wide)
    
    print("🔄 Starting food database migration...")
    print("📋 Migrating from system-wide food_items to user-specific foods")
    
    # Get counts
    foods_count = foods_collection.count_documents({})
    food_items_count = food_items_collection.count_documents({})
    
    print(f"📊 Current state:")
    print(f"   foods collection (user-specific): {foods_count} documents")
    print(f"   food_items collection (system-wide): {food_items_count} documents")
    
    if food_items_count == 0:
        print("✅ No food_items to migrate. foods collection is already the primary one.")
        return
    
    # For multi-user app, we'll treat the current food_items as seed data
    # but we won't automatically assign them to any user
    # Instead, users will add their own foods as needed
    
    print("\n🗑️  Since this is a multi-user app with data separation,")
    print("   we'll remove the system-wide food_items collection.")
    print("   Users will build their own personal food databases.")
    
    # Backup food_items before deletion (optional)
    backup_collection = db['food_items_backup']
    backup_count = backup_collection.count_documents({})
    
    if backup_count == 0:
        print("💾 Creating backup of food_items...")
        food_items = list(food_items_collection.find({}))
        if food_items:
            backup_collection.insert_many(food_items)
            print(f"✅ Backed up {len(food_items)} items to food_items_backup")
    else:
        print(f"💾 Backup already exists ({backup_count} items)")
    
    # Drop the food_items collection since we're using user-specific foods only
    print("🗑️  Removing food_items collection (using foods with user_id only)...")
    food_items_collection.drop()
    
    # Verify final state
    final_foods_count = foods_collection.count_documents({})
    final_food_items_count = food_items_collection.count_documents({})
    
    print(f"\n✅ Migration complete!")
    print(f"📊 Final state:")
    print(f"   foods collection (user-specific): {final_foods_count} documents")
    print(f"   food_items collection: {final_food_items_count} documents (removed)")
    print(f"   backup collection: {backup_collection.count_documents({})} documents")
    
    print(f"\n🎯 Result: Using user-specific foods only for proper data separation")
    
    client.close()

if __name__ == "__main__":
    migrate_to_user_foods()
