"""
Migration script to move user favorites from user model to separate collection
"""

import asyncio
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Database connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/nutrivize")
client = AsyncIOMotorClient(MONGO_URI)
db = client.nutrivize

async def migrate_favorites():
    """Migrate favorites from user model to separate collection"""
    print("🔄 Starting favorites migration...")
    
    # Get all users with favorite foods
    users_cursor = db.users.find({"favorite_foods": {"$exists": True, "$ne": []}})
    users = await users_cursor.to_list(length=None)
    
    print(f"📊 Found {len(users)} users with favorite foods")
    
    migrated_count = 0
    error_count = 0
    
    for user in users:
        try:
            user_id = user["_id"]
            favorite_foods = user.get("favorite_foods", [])
            
            print(f"👤 Processing user {user_id} with {len(favorite_foods)} favorites")
            
            # Convert each favorite to new format
            for fav in favorite_foods:
                try:
                    # Extract food_id
                    food_id = fav.get("food_id")
                    if not food_id:
                        print(f"⚠️  Skipping favorite without food_id: {fav}")
                        continue
                    
                    # Check if this favorite already exists in new collection
                    existing = await db.user_favorites.find_one({
                        "user_id": str(user_id),
                        "food_id": food_id
                    })
                    
                    if existing:
                        print(f"✅ Favorite {food_id} already exists for user {user_id}")
                        continue
                    
                    # Create new favorite document
                    new_favorite = {
                        "user_id": str(user_id),
                        "food_id": food_id,
                        "food_name": fav.get("food_name"),
                        "custom_name": fav.get("food_name"),  # Use food_name as custom_name
                        "default_serving_size": fav.get("default_quantity"),
                        "default_serving_unit": fav.get("default_unit"),
                        "category": "general",  # Default category
                        "notes": None,
                        "tags": [],
                        "usage_count": 0,
                        "last_used": None,
                        "created_at": fav.get("added_date", datetime.utcnow()),
                        "updated_at": datetime.utcnow()
                    }
                    
                    # Insert into new collection
                    result = await db.user_favorites.insert_one(new_favorite)
                    print(f"✅ Migrated favorite {food_id} for user {user_id} -> {result.inserted_id}")
                    migrated_count += 1
                    
                except Exception as e:
                    print(f"❌ Error migrating favorite {fav}: {e}")
                    error_count += 1
                    continue
                    
        except Exception as e:
            print(f"❌ Error processing user {user_id}: {e}")
            error_count += 1
            continue
    
    print(f"\n📊 Migration Summary:")
    print(f"✅ Successfully migrated: {migrated_count} favorites")
    print(f"❌ Errors: {error_count}")
    
    # Optional: Remove favorite_foods from user documents
    # WARNING: Only uncomment this after verifying the migration worked correctly
    # print("\n🗑️  Removing favorite_foods from user documents...")
    # result = await db.users.update_many(
    #     {"favorite_foods": {"$exists": True}},
    #     {"$unset": {"favorite_foods": ""}}
    # )
    # print(f"✅ Updated {result.modified_count} user documents")

async def verify_migration():
    """Verify the migration was successful"""
    print("\n🔍 Verifying migration...")
    
    # Count favorites in new collection
    new_count = await db.user_favorites.count_documents({})
    print(f"📊 Total favorites in new collection: {new_count}")
    
    # Count users with favorites in old format
    old_count = await db.users.count_documents({"favorite_foods": {"$exists": True, "$ne": []}})
    print(f"📊 Users still with old format favorites: {old_count}")
    
    # Show sample favorites
    sample_favorites = await db.user_favorites.find().limit(3).to_list(length=3)
    print("\n📄 Sample migrated favorites:")
    for fav in sample_favorites:
        print(f"  - {fav['food_name']} ({fav['food_id']}) for user {fav['user_id']}")

if __name__ == "__main__":
    async def main():
        await migrate_favorites()
        await verify_migration()
        client.close()
    
    asyncio.run(main())
