#!/usr/bin/env python3
"""
Script to update existing food items in the database with dietary attributes.
This will analyze all foods without dietary attributes and add them using AI.
"""

import asyncio
import os
import sys
from typing import List, Dict, Any
import logging
from datetime import datetime
from bson import ObjectId

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import get_database
from app.services.ai_service import AIService
from app.models.food import DietaryAttributes

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize AI service
ai_service = AIService()


class DietaryAttributesUpdater:
    """Service to update existing food items with dietary attributes"""
    
    def __init__(self):
        self.db = get_database()
        if self.db is None:
            raise Exception("Could not connect to database")
        self.food_collection = self.db["foods"]
    
    async def get_foods_without_dietary_attributes(self) -> List[Dict[str, Any]]:
        """Get all food items that don't have dietary attributes"""
        try:
            # Find foods where dietary_attributes field is missing or null
            query = {
                "$or": [
                    {"dietary_attributes": {"$exists": False}},
                    {"dietary_attributes": None},
                    {"dietary_attributes": {}}
                ]
            }
            
            foods = list(self.food_collection.find(query))
            logger.info(f"Found {len(foods)} food items without dietary attributes")
            return foods
            
        except Exception as e:
            logger.error(f"Error fetching foods without dietary attributes: {e}")
            return []
    
    async def update_food_dietary_attributes(self, food_doc: Dict[str, Any]) -> bool:
        """Update a single food item with dietary attributes"""
        try:
            food_id = food_doc["_id"]
            food_name = food_doc.get("name", "Unknown")
            serving_size = food_doc.get("serving_size")
            serving_unit = food_doc.get("serving_unit")
            
            logger.info(f"Processing food: {food_name} (ID: {food_id})")
            
            # Generate dietary attributes using AI
            dietary_data = await ai_service.generate_dietary_attributes(
                food_name, serving_size, serving_unit
            )
            
            # Create dietary attributes object
            dietary_attributes = DietaryAttributes(**dietary_data)
            
            # Update the food item in the database
            update_result = self.food_collection.update_one(
                {"_id": food_id},
                {
                    "$set": {
                        "dietary_attributes": dietary_attributes.dict(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            if update_result.modified_count > 0:
                logger.info(f"✅ Updated {food_name} with dietary attributes: {dietary_data}")
                return True
            else:
                logger.warning(f"⚠️  No update performed for {food_name}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error updating food {food_doc.get('name', 'Unknown')}: {e}")
            return False
    
    async def update_all_foods(self, batch_size: int = 10, dry_run: bool = False) -> Dict[str, int]:
        """Update all foods without dietary attributes"""
        foods = await self.get_foods_without_dietary_attributes()
        
        if not foods:
            logger.info("🎉 All foods already have dietary attributes!")
            return {"total": 0, "updated": 0, "failed": 0}
        
        if dry_run:
            logger.info(f"🔍 DRY RUN: Would update {len(foods)} food items")
            for food in foods[:5]:  # Show first 5 as examples
                logger.info(f"  - {food.get('name', 'Unknown')} (ID: {food['_id']})")
            if len(foods) > 5:
                logger.info(f"  ... and {len(foods) - 5} more")
            return {"total": len(foods), "updated": 0, "failed": 0}
        
        logger.info(f"🚀 Starting update of {len(foods)} food items (batch size: {batch_size})")
        
        updated_count = 0
        failed_count = 0
        
        # Process foods in batches to avoid overwhelming the AI service
        for i in range(0, len(foods), batch_size):
            batch = foods[i:i + batch_size]
            logger.info(f"📦 Processing batch {i//batch_size + 1}/{(len(foods) + batch_size - 1)//batch_size}")
            
            for food in batch:
                success = await self.update_food_dietary_attributes(food)
                if success:
                    updated_count += 1
                else:
                    failed_count += 1
                
                # Small delay to be respectful to the AI service
                await asyncio.sleep(0.5)
            
            # Longer delay between batches
            if i + batch_size < len(foods):
                logger.info("⏸️  Pausing between batches...")
                await asyncio.sleep(2)
        
        results = {
            "total": len(foods),
            "updated": updated_count,
            "failed": failed_count
        }
        
        logger.info(f"🏁 Update completed!")
        logger.info(f"   Total foods processed: {results['total']}")
        logger.info(f"   Successfully updated: {results['updated']}")
        logger.info(f"   Failed updates: {results['failed']}")
        
        return results
    
    async def update_specific_food(self, food_id: str) -> bool:
        """Update a specific food item by ID"""
        try:
            food_doc = self.food_collection.find_one({"_id": ObjectId(food_id)})
            if not food_doc:
                logger.error(f"Food with ID {food_id} not found")
                return False
            
            return await self.update_food_dietary_attributes(food_doc)
            
        except Exception as e:
            logger.error(f"Error updating specific food {food_id}: {e}")
            return False


async def main():
    """Main function to run the dietary attributes updater"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Update food items with dietary attributes")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be updated without making changes")
    parser.add_argument("--batch-size", type=int, default=10, help="Number of foods to process in each batch")
    parser.add_argument("--food-id", type=str, help="Update a specific food by ID")
    
    args = parser.parse_args()
    
    try:
        updater = DietaryAttributesUpdater()
        
        if args.food_id:
            # Update specific food
            logger.info(f"Updating specific food: {args.food_id}")
            success = await updater.update_specific_food(args.food_id)
            if success:
                logger.info("✅ Food updated successfully")
            else:
                logger.error("❌ Failed to update food")
        else:
            # Update all foods
            results = await updater.update_all_foods(
                batch_size=args.batch_size,
                dry_run=args.dry_run
            )
            
            if not args.dry_run:
                success_rate = (results["updated"] / results["total"] * 100) if results["total"] > 0 else 0
                logger.info(f"📊 Success rate: {success_rate:.1f}%")
        
    except Exception as e:
        logger.error(f"❌ Script failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
