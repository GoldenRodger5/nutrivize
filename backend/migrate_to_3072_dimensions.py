#!/usr/bin/env python3
"""
Migration script to update Pinecone index from 1024 to 3072 dimensions
This script will:
1. Delete the existing index if it exists
2. Create a new index with 3072 dimensions
3. Re-vectorize all existing foods in the database
"""

import sys
import os
import asyncio
import logging
from datetime import datetime

# Add the app directory to Python path
sys.path.append('/Users/isaacmineo/Main/projects/nutrivize-v2/backend')

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def migrate_pinecone_dimensions():
    """Migrate Pinecone index from 1024 to 3072 dimensions"""
    try:
        from app.services.pinecone_service import PineconeService
        from app.core.config import get_database
        
        logger.info("🚀 Starting migration to 3072 dimensions...")
        
        # Initialize services
        pinecone_service = PineconeService()
        db = get_database()
        
        # Get current index stats
        try:
            stats = pinecone_service.index.describe_index_stats()
            logger.info(f"📊 Current index stats: {stats}")
        except Exception as e:
            logger.warning(f"⚠️ Could not get current index stats: {e}")
        
        # Delete existing index to recreate with new dimensions
        logger.info("🗑️ Deleting existing index to recreate with 3072 dimensions...")
        try:
            pinecone_service.pc.delete_index(pinecone_service.index_name)
            logger.info("✅ Successfully deleted existing index")
            
            # Wait a moment for deletion to complete
            await asyncio.sleep(5)
            
        except Exception as e:
            logger.warning(f"⚠️ Could not delete existing index (might not exist): {e}")
        
        # Reinitialize the service to create new index
        logger.info("🔧 Creating new index with 3072 dimensions...")
        pinecone_service._initialize_index()
        
        # Wait for index to be ready
        await asyncio.sleep(10)
        
        # Verify new index dimensions
        try:
            stats = pinecone_service.index.describe_index_stats()
            logger.info(f"📊 New index stats: {stats}")
        except Exception as e:
            logger.error(f"❌ Failed to get new index stats: {e}")
        
        # Re-vectorize all foods from the main database
        logger.info("🍎 Re-vectorizing all foods with 3072 dimensions...")
        
        # Get all foods from main database
        foods = list(db.foods.find({}))
        logger.info(f"📋 Found {len(foods)} foods to vectorize")
        
        # Process foods in batches
        batch_size = 10
        success_count = 0
        error_count = 0
        
        for i in range(0, len(foods), batch_size):
            batch = foods[i:i + batch_size]
            logger.info(f"🔄 Processing batch {i//batch_size + 1}/{(len(foods) + batch_size - 1)//batch_size}")
            
            for food in batch:
                try:
                    # Extract food information
                    food_name = food.get('name', 'Unknown')
                    nutrition = food.get('nutrition', {})
                    dietary_attributes = food.get('dietary_attributes', {})
                    
                    # Create comprehensive text representation
                    food_text = f"Food: {food_name}"
                    
                    if nutrition:
                        if nutrition.get('calories'):
                            food_text += f" Calories: {nutrition['calories']}"
                        if nutrition.get('protein'):
                            food_text += f" Protein: {nutrition['protein']}g"
                        if nutrition.get('carbs'):
                            food_text += f" Carbs: {nutrition['carbs']}g"
                        if nutrition.get('fat'):
                            food_text += f" Fat: {nutrition['fat']}g"
                        if nutrition.get('fiber'):
                            food_text += f" Fiber: {nutrition['fiber']}g"
                    
                    if dietary_attributes:
                        if dietary_attributes.get('dietary_restrictions'):
                            food_text += f" Dietary: {', '.join(dietary_attributes['dietary_restrictions'])}"
                        if dietary_attributes.get('food_categories'):
                            food_text += f" Categories: {', '.join(dietary_attributes['food_categories'])}"
                    
                    # Generate embedding with 3072 dimensions
                    embedding = await pinecone_service.generate_embedding(food_text)
                    
                    # Prepare metadata
                    metadata = {
                        'food_id': str(food['_id']),
                        'name': food_name,
                        'type': 'global_food',
                        'calories': nutrition.get('calories', 0),
                        'protein': nutrition.get('protein', 0),
                        'carbs': nutrition.get('carbs', 0),
                        'fat': nutrition.get('fat', 0),
                        'fiber': nutrition.get('fiber', 0),
                        'text_content': food_text,
                        'embedding_dimension': len(embedding),
                        'created_at': datetime.utcnow().isoformat()
                    }
                    
                    # Add dietary attributes to metadata
                    if dietary_attributes.get('dietary_restrictions'):
                        metadata['dietary_restrictions'] = dietary_attributes['dietary_restrictions']
                    if dietary_attributes.get('food_categories'):
                        metadata['food_categories'] = dietary_attributes['food_categories']
                    
                    # Store in Pinecone with global_foods namespace
                    vector_id = f"global_food_{food['_id']}"
                    pinecone_service.index.upsert(
                        vectors=[{
                            'id': vector_id,
                            'values': embedding,
                            'metadata': metadata
                        }],
                        namespace='global_foods'
                    )
                    
                    success_count += 1
                    logger.debug(f"✅ Vectorized: {food_name} ({len(embedding)} dimensions)")
                    
                except Exception as e:
                    error_count += 1
                    logger.error(f"❌ Failed to vectorize {food.get('name', 'Unknown')}: {e}")
                    continue
            
            # Small delay between batches
            await asyncio.sleep(1)
        
        logger.info(f"🎉 Migration completed!")
        logger.info(f"✅ Successfully vectorized: {success_count} foods")
        logger.info(f"❌ Failed: {error_count} foods")
        logger.info(f"📊 Total processed: {len(foods)} foods")
        logger.info(f"💾 Stored in Pinecone namespace: global_foods")
        
        # Verify final index stats
        try:
            final_stats = pinecone_service.index.describe_index_stats()
            logger.info(f"📈 Final index stats: {final_stats}")
        except Exception as e:
            logger.error(f"❌ Failed to get final index stats: {e}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Pinecone 3072 dimension migration...")
    result = asyncio.run(migrate_pinecone_dimensions())
    if result:
        print("✅ Migration completed successfully!")
    else:
        print("❌ Migration failed!")
