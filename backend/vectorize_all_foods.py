#!/usr/bin/env python3
"""
Vectorize All Foods Script
Mass vectorization of all foods in the main database for enhanced AI capabilities
"""

import asyncio
import sys
import os
import logging
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append('/Users/isaacmineo/Main/projects/nutrivize-v2/backend')

from app.database import get_database
from app.services.pinecone_service import pinecone_service

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def vectorize_all_foods():
    """Vectorize all foods in the main database for enhanced AI food discovery"""
    
    print("🚀 STARTING MASS FOOD VECTORIZATION")
    print("=" * 50)
    
    try:
        # Get database connection
        db = get_database()
        
        # Get all foods from the main database
        print("📊 Fetching all foods from main database...")
        all_foods = list(db.foods.find({}))
        total_foods = len(all_foods)
        
        print(f"✅ Found {total_foods} foods to vectorize")
        
        if total_foods == 0:
            print("❌ No foods found in database")
            return
        
        # Process foods in batches for better performance
        batch_size = 50
        vectorized_count = 0
        failed_count = 0
        
        print(f"\n🔄 Processing {total_foods} foods in batches of {batch_size}...")
        
        for i in range(0, total_foods, batch_size):
            batch = all_foods[i:i + batch_size]
            batch_number = (i // batch_size) + 1
            total_batches = (total_foods + batch_size - 1) // batch_size
            
            print(f"\n📦 BATCH {batch_number}/{total_batches} ({len(batch)} foods)")
            print("-" * 40)
            
            for j, food in enumerate(batch):
                try:
                    # Extract food information
                    food_id = str(food.get('_id', ''))
                    name = food.get('name', 'Unknown Food')
                    brand = food.get('brand', '')
                    
                    # Get nutritional data
                    nutrition = food.get('nutrition_per_100g', {})
                    calories = nutrition.get('calories', 0)
                    protein = nutrition.get('protein', 0)
                    carbs = nutrition.get('carbs', 0)
                    fat = nutrition.get('fat', 0)
                    fiber = nutrition.get('fiber', 0)
                    
                    # Get dietary attributes
                    dietary_attrs = food.get('dietary_attributes', {})
                    categories = dietary_attrs.get('food_categories', [])
                    restrictions = dietary_attrs.get('dietary_restrictions', [])
                    
                    # Create comprehensive food description for vectorization
                    description_parts = [f"Food: {name}"]
                    
                    if brand:
                        description_parts.append(f"Brand: {brand}")
                    
                    # Add nutrition information
                    if calories > 0:
                        description_parts.append(f"Nutrition per 100g: {calories} calories")
                    if protein > 0:
                        description_parts.append(f"{protein}g protein")
                    if carbs > 0:
                        description_parts.append(f"{carbs}g carbohydrates")
                    if fat > 0:
                        description_parts.append(f"{fat}g fat")
                    if fiber > 0:
                        description_parts.append(f"{fiber}g fiber")
                    
                    # Add categories and dietary info
                    if categories:
                        description_parts.append(f"Categories: {', '.join(categories)}")
                    if restrictions:
                        description_parts.append(f"Dietary: {', '.join(restrictions)}")
                    
                    # Create the full description
                    full_description = ". ".join(description_parts)
                    
                    # Create metadata for the vector
                    metadata = {
                        "type": "food_item",
                        "food_id": food_id,
                        "name": name,
                        "brand": brand or "Generic",
                        "calories": calories,
                        "protein": protein,
                        "carbs": carbs,
                        "fat": fat,
                        "fiber": fiber,
                        "categories": categories,
                        "dietary_restrictions": restrictions,
                        "namespace": "main_foods",  # Special namespace for main food database
                        "vectorized_at": datetime.utcnow().isoformat()
                    }
                    
                    # Vectorize using the main foods namespace
                    await pinecone_service.store_context(
                        user_id="main_foods",  # Special user_id for main food database
                        item_id=f"food_{food_id}",
                        content=full_description,
                        metadata=metadata
                    )
                    
                    vectorized_count += 1
                    
                    # Progress indicator
                    if (j + 1) % 10 == 0 or j == len(batch) - 1:
                        print(f"  ✅ Processed {j + 1}/{len(batch)} foods in batch")
                        
                except Exception as e:
                    failed_count += 1
                    logger.error(f"  ❌ Failed to vectorize food '{name}': {e}")
                    continue
        
        print("\n" + "=" * 50)
        print("🎉 FOOD VECTORIZATION COMPLETE!")
        print(f"✅ Successfully vectorized: {vectorized_count} foods")
        print(f"❌ Failed: {failed_count} foods")
        print(f"📊 Success rate: {(vectorized_count / total_foods * 100):.1f}%")
        
        # Test the vectorized foods
        print("\n🧪 TESTING FOOD VECTOR SEARCH...")
        try:
            # Test search for high protein foods
            test_results = await pinecone_service.query_vectors(
                user_id="main_foods",
                query_text="high protein foods chicken meat",
                top_k=5
            )
            
            print(f"✅ Found {len(test_results)} relevant foods for 'high protein foods chicken meat':")
            for i, result in enumerate(test_results[:3], 1):
                metadata = result.get('metadata', {})
                name = metadata.get('name', 'Unknown')
                protein = metadata.get('protein', 0)
                print(f"  {i}. {name} ({protein}g protein)")
            
        except Exception as e:
            print(f"⚠️ Test search failed: {e}")
        
        print(f"\n🚀 All {vectorized_count} foods are now available for AI-enhanced recommendations!")
        
    except Exception as e:
        logger.error(f"❌ Mass vectorization failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(vectorize_all_foods())
