#!/usr/bin/env python3
"""
Fix Vector Dimensions Migration Script

This script fixes the vector dimension mismatch by:
1. Creating new indexes with correct 1024 dimensions
2. Re-vectorizing all existing data with the new dimension
3. Updating Pinecone namespaces to use 1024-dimensional embeddings

Requirements:
- OpenAI text-embedding-3-large model supports 1-3072 dimensions
- We're standardizing on 1024 dimensions for optimal performance
"""

import os
import sys
import asyncio
import logging
from datetime import datetime

# Add project root to path
sys.path.append('/Users/isaacmineo/Main/projects/nutrivize-v2/backend')

from app.core.database import get_database
from app.services.pinecone_service import PineconeService
import openai
from pinecone import Pinecone, ServerlessSpec

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class VectorDimensionFixer:
    def __init__(self):
        self.db = get_database()
        self.pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        openai.api_key = os.getenv("OPENAI_API_KEY")
        
        # New configuration
        self.new_dimension = 1024
        self.embedding_model = "text-embedding-3-large"
        self.index_name = "nutrivize-context"
        
        logger.info(f"🔧 Initialized VectorDimensionFixer with {self.new_dimension} dimensions")

    def check_existing_indexes(self):
        """Check current index dimensions and namespaces"""
        try:
            indexes = [index for index in self.pc.list_indexes()]
            logger.info(f"📊 Found {len(indexes)} existing indexes:")
            
            for index_info in indexes:
                index_name = index_info.name
                logger.info(f"  • Index: {index_name}")
                
                # Get index details
                index = self.pc.Index(index_name)
                stats = index.describe_index_stats()
                
                logger.info(f"    - Dimension: {index_info.dimension}")
                logger.info(f"    - Total vectors: {stats.total_vector_count}")
                logger.info(f"    - Namespaces: {list(stats.namespaces.keys()) if stats.namespaces else ['default']}")
                
                # Check each namespace
                if stats.namespaces:
                    for namespace, ns_stats in stats.namespaces.items():
                        vector_count = ns_stats.vector_count
                        logger.info(f"      - Namespace '{namespace}': {vector_count} vectors")
                
                print()
                
        except Exception as e:
            logger.error(f"❌ Error checking indexes: {e}")

    async def generate_new_embedding(self, text: str) -> list:
        """Generate embedding with correct 1024 dimensions"""
        try:
            response = openai.embeddings.create(
                model=self.embedding_model,
                input=text.strip(),
                dimensions=self.new_dimension
            )
            
            embedding = response.data[0].embedding
            logger.debug(f"✅ Generated {len(embedding)}-dimensional embedding")
            return embedding
            
        except Exception as e:
            logger.error(f"❌ Failed to generate embedding: {e}")
            raise

    def recreate_index_if_needed(self):
        """Recreate index with correct dimensions if needed"""
        try:
            existing_indexes = [index.name for index in self.pc.list_indexes()]
            
            if self.index_name in existing_indexes:
                # Get current index info
                current_index = next(
                    (index for index in self.pc.list_indexes() if index.name == self.index_name), 
                    None
                )
                
                if current_index and current_index.dimension != self.new_dimension:
                    logger.warning(f"⚠️ Index '{self.index_name}' has wrong dimension: {current_index.dimension}")
                    logger.info(f"🗑️ Deleting old index...")
                    
                    self.pc.delete_index(self.index_name)
                    logger.info(f"✅ Deleted old index")
                    
                    # Wait a moment for deletion to complete
                    import time
                    time.sleep(5)
                else:
                    logger.info(f"✅ Index '{self.index_name}' already has correct dimension: {current_index.dimension}")
                    return
            
            # Create new index with correct dimensions
            logger.info(f"🔨 Creating new index '{self.index_name}' with {self.new_dimension} dimensions...")
            
            self.pc.create_index(
                name=self.index_name,
                dimension=self.new_dimension,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                )
            )
            
            logger.info(f"✅ Created new index with {self.new_dimension} dimensions")
            
        except Exception as e:
            logger.error(f"❌ Error recreating index: {e}")
            raise

    async def re_vectorize_foods(self):
        """Re-vectorize all foods with correct dimensions"""
        try:
            # Get all foods from MongoDB
            foods = list(self.db.foods.find({}))
            logger.info(f"🍎 Found {len(foods)} foods to re-vectorize")
            
            if not foods:
                logger.warning("⚠️ No foods found in database")
                return
            
            # Connect to index
            index = self.pc.Index(self.index_name)
            
            # Process foods in batches
            batch_size = 10
            successful_count = 0
            failed_count = 0
            
            for i in range(0, len(foods), batch_size):
                batch = foods[i:i + batch_size]
                batch_vectors = []
                
                logger.info(f"📦 Processing batch {i//batch_size + 1}/{(len(foods) + batch_size - 1)//batch_size}")
                
                for food in batch:
                    try:
                        food_id = str(food["_id"])
                        food_name = food.get("name", "Unknown")
                        
                        # Create comprehensive food description for embedding
                        nutrition = food.get("nutrition", {})
                        dietary_attrs = food.get("dietary_attributes", {})
                        
                        description_parts = [
                            f"Food: {food_name}",
                            f"Calories per 100g: {nutrition.get('calories', 0)}",
                            f"Protein: {nutrition.get('protein', 0)}g",
                            f"Carbs: {nutrition.get('carbohydrates', 0)}g",
                            f"Fat: {nutrition.get('fat', 0)}g",
                            f"Fiber: {nutrition.get('fiber', 0)}g"
                        ]
                        
                        # Add dietary information
                        categories = dietary_attrs.get("food_categories", [])
                        if categories:
                            description_parts.append(f"Categories: {', '.join(categories)}")
                        
                        restrictions = dietary_attrs.get("dietary_restrictions", [])
                        if restrictions:
                            description_parts.append(f"Dietary: {', '.join(restrictions)}")
                        
                        # Add allergens and preparation info
                        allergens = dietary_attrs.get("allergens", [])
                        if allergens:
                            description_parts.append(f"Allergens: {', '.join(allergens)}")
                        
                        prep_methods = dietary_attrs.get("preparation_methods", [])
                        if prep_methods:
                            description_parts.append(f"Preparation: {', '.join(prep_methods)}")
                        
                        description = " | ".join(description_parts)
                        
                        # Generate new embedding with correct dimensions
                        embedding = await self.generate_new_embedding(description)
                        
                        if len(embedding) != self.new_dimension:
                            logger.error(f"❌ Wrong embedding dimension for {food_name}: {len(embedding)}")
                            failed_count += 1
                            continue
                        
                        # Prepare vector for batch upsert
                        vector_data = {
                            "id": f"food_{food_id}",
                            "values": embedding,
                            "metadata": {
                                "type": "food",
                                "food_id": food_id,
                                "name": food_name,
                                "calories": nutrition.get("calories", 0),
                                "protein": nutrition.get("protein", 0),
                                "categories": categories[:3] if categories else [],  # Limit for metadata size
                                "dietary_restrictions": restrictions[:3] if restrictions else [],
                                "created_at": datetime.utcnow().isoformat(),
                                "dimension_version": "1024"
                            }
                        }
                        
                        batch_vectors.append(vector_data)
                        successful_count += 1
                        
                    except Exception as e:
                        logger.error(f"❌ Failed to process food {food.get('name', 'unknown')}: {e}")
                        failed_count += 1
                
                # Upsert batch to Pinecone
                if batch_vectors:
                    try:
                        index.upsert(
                            vectors=batch_vectors,
                            namespace="global_foods"
                        )
                        logger.info(f"✅ Upserted {len(batch_vectors)} vectors to global_foods namespace")
                    except Exception as e:
                        logger.error(f"❌ Failed to upsert batch: {e}")
                        failed_count += len(batch_vectors)
                        successful_count -= len(batch_vectors)
                
                # Small delay between batches
                await asyncio.sleep(0.5)
            
            logger.info(f"🎯 Re-vectorization Complete:")
            logger.info(f"  ✅ Successfully processed: {successful_count} foods")
            logger.info(f"  ❌ Failed: {failed_count} foods")
            logger.info(f"  💾 Stored in namespace: global_foods")
            logger.info(f"  📐 Vector dimension: {self.new_dimension}")
            
        except Exception as e:
            logger.error(f"❌ Error re-vectorizing foods: {e}")
            raise

    async def verify_new_vectors(self):
        """Verify that new vectors have correct dimensions"""
        try:
            index = self.pc.Index(self.index_name)
            
            # Check index stats
            stats = index.describe_index_stats()
            logger.info(f"📊 Index Verification:")
            logger.info(f"  Total vectors: {stats.total_vector_count}")
            
            if stats.namespaces:
                for namespace, ns_stats in stats.namespaces.items():
                    logger.info(f"  Namespace '{namespace}': {ns_stats.vector_count} vectors")
            
            # Test a sample query to verify dimensions
            if stats.total_vector_count > 0:
                # Generate a test embedding
                test_embedding = await self.generate_new_embedding("test food query")
                
                # Perform a test query
                results = index.query(
                    vector=test_embedding,
                    top_k=1,
                    namespace="global_foods",
                    include_metadata=True
                )
                
                if results.matches:
                    sample_match = results.matches[0]
                    logger.info(f"✅ Test query successful:")
                    logger.info(f"  Sample food: {sample_match.metadata.get('name', 'unknown')}")
                    logger.info(f"  Score: {sample_match.score}")
                    logger.info(f"  Metadata version: {sample_match.metadata.get('dimension_version', 'unknown')}")
                else:
                    logger.warning("⚠️ Test query returned no results")
            
        except Exception as e:
            logger.error(f"❌ Error verifying vectors: {e}")

async def main():
    """Main execution function"""
    print("🚀 Starting Vector Dimension Fix")
    print("=" * 50)
    
    fixer = VectorDimensionFixer()
    
    # Step 1: Check current state
    print("\n📊 STEP 1: Checking current indexes...")
    fixer.check_existing_indexes()
    
    # Step 2: Recreate index if needed
    print("\n🔨 STEP 2: Recreating index with correct dimensions...")
    fixer.recreate_index_if_needed()
    
    # Step 3: Re-vectorize all foods
    print("\n🍎 STEP 3: Re-vectorizing all foods...")
    await fixer.re_vectorize_foods()
    
    # Step 4: Verify results
    print("\n✅ STEP 4: Verifying new vectors...")
    await fixer.verify_new_vectors()
    
    print("\n" + "=" * 50)
    print("🎯 Vector Dimension Fix Complete!")
    print("All embeddings now use 1024 dimensions from text-embedding-3-large")

if __name__ == "__main__":
    asyncio.run(main())
