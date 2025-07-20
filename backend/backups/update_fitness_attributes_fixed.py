#!/usr/bin/env python3
"""
Update existing foods with new fitness-related dietary attributes
"""

import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient

# Add the app directory to the path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_service import AIService

# Load environment variables
load_dotenv()

def connect_to_mongodb():
    """Connect to MongoDB Atlas using the same method as the backend"""
    mongodb_url = os.getenv("MONGODB_URL")
    if not mongodb_url:
        print("❌ MONGODB_URL not found in environment variables")
        return None, None
    
    try:
        client = MongoClient(mongodb_url)
        db = client.get_default_database()
        
        # Test connection
        client.admin.command('ping')
        print("✅ Connected to MongoDB successfully")
        
        return client, db
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return None, None

async def update_fitness_attributes():
    """Update existing foods with fitness-related dietary attributes"""
    
    # Connect to MongoDB
    client, db = connect_to_mongodb()
    if client is None or db is None:
        return
    
    try:
        # Initialize AI service
        ai_service = AIService()
        
        # Get all foods from the database
        foods_collection = db.foods
        foods_cursor = foods_collection.find({})
        foods = list(foods_cursor)
        
        print(f"🔄 Updating {len(foods)} foods with new fitness attributes...")
        
        updated_count = 0
        error_count = 0
        
        for food in foods:
            try:
                # Generate new dietary attributes including fitness attributes
                new_attributes = await ai_service.generate_dietary_attributes(food)
                
                # Update the food in the database
                result = foods_collection.update_one(
                    {"_id": food["_id"]},
                    {"$set": {"dietary_attributes": new_attributes}}
                )
                
                if result.modified_count > 0:
                    updated_count += 1
                    print(f"✅ Updated: {food.get('name', 'Unknown')}")
                else:
                    print(f"⚠️  No changes for: {food.get('name', 'Unknown')}")
                
            except Exception as e:
                error_count += 1
                print(f"❌ Error updating {food.get('name', 'Unknown')}: {e}")
        
        print(f"\n📊 Update Summary:")
        print(f"   Total foods: {len(foods)}")
        print(f"   Successfully updated: {updated_count}")
        print(f"   Errors: {error_count}")
        print(f"   ✅ Fitness attributes update complete!")
        
    except Exception as e:
        print(f"❌ Error during update: {e}")
    
    finally:
        if client:
            client.close()
            print("🔌 Disconnected from MongoDB")

if __name__ == "__main__":
    import asyncio
    asyncio.run(update_fitness_attributes())
