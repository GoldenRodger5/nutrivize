#!/usr/bin/env python3
"""
Check food database for foods missing dietary attributes and generate them.
"""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.append('/Users/isaacmineo/Main/projects/nutrivize-v2/backend')

from app.core.config import get_database
from app.services.ai_service import AIService
from app.models.food import DietaryAttributes
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def check_and_update_dietary_attributes():
    """Check foods in database and generate missing dietary attributes"""
    
    try:
        # Get database connection
        db = get_database()
        
        print("✅ Connected to MongoDB successfully")
        
        foods_collection = db["foods"]
        ai_service = AIService()
        
        # Find foods without dietary attributes
        foods_without_attributes = list(foods_collection.find({
            "$or": [
                {"dietary_attributes": {"$exists": False}},
                {"dietary_attributes": None},
                {"dietary_attributes.dietary_restrictions": {"$exists": False}},
                {"dietary_attributes.allergens": {"$exists": False}},
                {"dietary_attributes.food_categories": {"$exists": False}}
            ]
        }))
        
        print(f"📊 Found {len(foods_without_attributes)} foods without complete dietary attributes")
        
        if len(foods_without_attributes) == 0:
            print("✅ All foods already have dietary attributes!")
            return
        
        # Show some examples
        print("\n📋 Examples of foods missing attributes:")
        for i, food in enumerate(foods_without_attributes[:5]):
            print(f"  {i+1}. {food.get('name', 'Unknown')} (ID: {food['_id']})")
            current_attrs = food.get('dietary_attributes', {})
            print(f"     Current attributes: {current_attrs}")
        
        if len(foods_without_attributes) > 5:
            print(f"  ... and {len(foods_without_attributes) - 5} more")
        
        # Ask if user wants to generate attributes
        response = input(f"\n🤖 Do you want to generate dietary attributes for these {len(foods_without_attributes)} foods? (y/n): ")
        
        if response.lower() != 'y':
            print("Skipping attribute generation.")
            return
        
        updated_count = 0
        for i, food in enumerate(foods_without_attributes):
            try:
                food_name = food.get('name', 'Unknown')
                serving_size = food.get('serving_size')
                serving_unit = food.get('serving_unit')
                
                print(f"\n🔄 Processing {i+1}/{len(foods_without_attributes)}: {food_name}")
                
                # Generate dietary attributes
                dietary_data = await ai_service.generate_dietary_attributes(
                    food_name, serving_size, serving_unit
                )
                
                # Update the food in database
                result = foods_collection.update_one(
                    {"_id": food["_id"]},
                    {"$set": {"dietary_attributes": dietary_data}}
                )
                
                if result.modified_count > 0:
                    updated_count += 1
                    print(f"  ✅ Updated: {dietary_data}")
                else:
                    print(f"  ⚠️ Failed to update in database")
                
                # Small delay to avoid rate limiting
                await asyncio.sleep(0.5)
                
            except Exception as e:
                print(f"  ❌ Error processing {food.get('name', 'Unknown')}: {e}")
                continue
        
        print(f"\n🎉 Successfully updated {updated_count} foods with dietary attributes!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_and_update_dietary_attributes())
