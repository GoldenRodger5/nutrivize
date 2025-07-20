#!/usr/bin/env python3
"""
Update existing foods in the database with new fitness-related dietary attributes
"""

import asyncio
import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Add the app directory to the path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_service import AIService

# Load environment variables
load_dotenv()

async def update_fitness_attributes():
    """Update all foods in the database with new fitness-related dietary attributes"""
    
    # Connect to MongoDB
    mongo_uri = os.getenv("MONGODB_URL")
    if not mongo_uri:
        print("❌ MONGODB_URL not found in environment variables")
        return
    
    client = MongoClient(mongo_uri)
    db = client.food_tracker
    foods_collection = db.foods
    
    # Initialize AI service
    ai_service = AIService()
    
    # Get all foods
    foods = list(foods_collection.find({}))
    total_foods = len(foods)
    
    print(f"🔄 Updating {total_foods} foods with new fitness attributes...")
    
    updated_count = 0
    error_count = 0
    
    for i, food in enumerate(foods, 1):
        try:
            food_name = food.get('name', 'Unknown Food')
            serving_size = food.get('serving_size')
            serving_unit = food.get('serving_unit')
            
            print(f"[{i}/{total_foods}] Updating: {food_name}")
            
            # Generate new dietary attributes with fitness goals
            new_attributes = await ai_service.generate_dietary_attributes(
                food_name, serving_size, serving_unit
            )
            
            # Update the food in the database
            result = foods_collection.update_one(
                {"_id": food["_id"]},
                {"$set": {"dietary_attributes": new_attributes}}
            )
            
            if result.modified_count > 0:
                updated_count += 1
                print(f"  ✅ Updated with attributes: {new_attributes}")
            else:
                print(f"  ⚠️ No changes made")
                
        except Exception as e:
            error_count += 1
            print(f"  ❌ Error updating {food_name}: {e}")
            continue
    
    print(f"\n📊 Update Summary:")
    print(f"   Total foods: {total_foods}")
    print(f"   Successfully updated: {updated_count}")
    print(f"   Errors: {error_count}")
    print(f"   ✅ Fitness attributes update complete!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(update_fitness_attributes())
