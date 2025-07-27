#!/usr/bin/env python3
"""
Comprehensive Food Vectorization Script
Vectorizes all foods in the main database for enhanced AI capabilities
"""

import asyncio
import os
import sys
import logging
from datetime import datetime

# Add the backend directory to Python path
sys.path.insert(0, '/Users/isaacmineo/Main/projects/nutrivize-v2/backend')

print('🚀 STARTING COMPREHENSIVE FOOD VECTORIZATION...')
print(f'Time: {datetime.now()}')
print('='*60)

async def vectorize_all_foods():
    try:
        # Import services
        from app.core.config import get_database
        from app.services.pinecone_service import pinecone_service
        
        db = get_database()
        
        # Count total foods in database
        total_foods = db.foods.count_documents({})
        print(f'📊 FOUND {total_foods} FOODS IN DATABASE')
        
        if total_foods == 0:
            print('❌ No foods found in database. Nothing to vectorize.')
            return 0
        
        print(f'💰 ESTIMATED COST: ~${total_foods * 0.0001:.2f} (trivial as requested)')
        print('')
        
        # Get all foods in batches
        batch_size = 50
        processed = 0
        successful = 0
        failed = 0
        
        # Get all foods
        foods = list(db.foods.find({}))
        
        print(f'🔄 Processing {len(foods)} foods in batches of {batch_size}...')
        
        for i in range(0, len(foods), batch_size):
            batch = foods[i:i + batch_size]
            
            for food in batch:
                try:
                    # Extract food data
                    food_id = str(food['_id'])
                    food_name = food.get('name', 'Unknown Food')
                    brand = food.get('brand', '')
                    category = food.get('category', '')
                    
                    # Get nutrition data
                    nutrition = food.get('nutrition_per_100g', {})
                    
                    # Build comprehensive food description for vectorization
                    food_description = f"""Food: {food_name}
Brand: {brand}
Category: {category}
Nutrition per 100g:
- Calories: {nutrition.get('calories', 0)}
- Protein: {nutrition.get('protein', 0)}g
- Carbs: {nutrition.get('carbohydrates', 0)}g
- Fat: {nutrition.get('fat', 0)}g
- Fiber: {nutrition.get('fiber', 0)}g
- Sugar: {nutrition.get('sugar', 0)}g
- Sodium: {nutrition.get('sodium', 0)}mg

This food is useful for meal planning, nutrition tracking, and dietary recommendations.
It can be searched for by name, brand, nutritional content, or category."""
                    
                    # Vectorize the food item using 'global' namespace for main foods
                    # Generate embedding
                    embedding = await pinecone_service.generate_embedding(food_description.strip())
                    
                    # Prepare for Pinecone upsert
                    vector_id = f'global_food_{food_id}'
                    metadata = {
                        'type': 'food_item',
                        'food_id': food_id,
                        'name': food_name,
                        'brand': brand,
                        'category': category,
                        'calories': nutrition.get('calories', 0),
                        'protein': nutrition.get('protein', 0),
                        'carbs': nutrition.get('carbohydrates', 0),
                        'fat': nutrition.get('fat', 0),
                        'created_at': datetime.now().isoformat()
                    }
                    
                    # Upsert to Pinecone global_foods namespace
                    pinecone_service.index.upsert(
                        vectors=[{
                            "id": vector_id,
                            "values": embedding,
                            "metadata": metadata
                        }],
                        namespace='global_foods'  # Global namespace for all foods
                    )
                    
                    successful += 1
                    processed += 1
                    
                    if successful % 10 == 0:
                        print(f'  ✅ Vectorized {successful} foods... ({food_name})')
                        
                except Exception as e:
                    failed += 1
                    processed += 1
                    print(f'  ❌ Failed to vectorize {food_name}: {e}')
            
            # Progress update
            if processed % 100 == 0:
                print(f'📈 Progress: {processed}/{total_foods} foods processed')
        
        print('')
        print('='*60)
        print('🎉 FOOD VECTORIZATION COMPLETE!')
        print(f'✅ Successfully vectorized: {successful} foods')
        print(f'❌ Failed: {failed} foods')
        print(f'📊 Total processed: {processed} foods')
        print(f'💾 Stored in Pinecone namespace: global_foods')
        print('')
        print('🤖 AI BENEFITS:')
        print('  • Enhanced food discovery and search')
        print('  • Intelligent meal planning with better food matching')
        print('  • Improved dietary recommendations')
        print('  • Context-aware nutrition suggestions')
        
        return successful
        
    except Exception as e:
        print(f'❌ VECTORIZATION FAILED: {e}')
        import traceback
        traceback.print_exc()
        return 0

if __name__ == "__main__":
    # Run the vectorization
    result = asyncio.run(vectorize_all_foods())
    print(f'\n🏁 FINAL RESULT: {result} foods successfully vectorized!')
