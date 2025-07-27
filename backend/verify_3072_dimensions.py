#!/usr/bin/env python3
"""
Verification script to test the 3072-dimension Pinecone setup
This script will:
1. Verify the index is using 3072 dimensions
2. Test embedding generation
3. Test vector search functionality
4. Display sample results
"""

import sys
import os
import asyncio
import logging

# Add the app directory to Python path
sys.path.append('/Users/isaacmineo/Main/projects/nutrivize-v2/backend')

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def verify_3072_dimensions():
    """Verify that the Pinecone index is working correctly with 3072 dimensions"""
    try:
        from app.services.pinecone_service import PineconeService
        
        logger.info("🔍 Verifying 3072-dimension setup...")
        
        # Initialize service
        pinecone_service = PineconeService()
        
        # Check index stats
        stats = pinecone_service.index.describe_index_stats()
        logger.info(f"📊 Index dimensions: {stats['dimension']}")
        logger.info(f"📊 Total vectors: {stats['total_vector_count']}")
        logger.info(f"📊 Namespaces: {list(stats.get('namespaces', {}).keys())}")
        
        if stats['dimension'] != 3072:
            logger.error(f"❌ Expected 3072 dimensions, but got {stats['dimension']}")
            return False
        
        # Test embedding generation
        logger.info("🧪 Testing embedding generation...")
        test_text = "High protein chicken breast with 25g protein per serving"
        embedding = await pinecone_service.generate_embedding(test_text)
        logger.info(f"✅ Generated embedding with {len(embedding)} dimensions")
        
        if len(embedding) != 3072:
            logger.error(f"❌ Expected 3072-dimensional embedding, but got {len(embedding)}")
            return False
        
        # Test vector search
        logger.info("🔍 Testing vector search...")
        search_results = pinecone_service.index.query(
            vector=embedding,
            namespace='global_foods',
            top_k=5,
            include_metadata=True
        )
        
        logger.info(f"🎯 Found {len(search_results['matches'])} search results")
        
        if search_results['matches']:
            logger.info("📋 Top search results:")
            for i, match in enumerate(search_results['matches'][:3]):
                name = match['metadata'].get('name', 'Unknown')
                score = match['score']
                protein = match['metadata'].get('protein', 0)
                calories = match['metadata'].get('calories', 0)
                dimension = match['metadata'].get('embedding_dimension', 'unknown')
                logger.info(f"  {i+1}. {name} (score: {score:.3f}, protein: {protein}g, calories: {calories}, dimensions: {dimension})")
        
        # Test different search queries
        test_queries = [
            "low calorie vegetable snack",
            "high protein breakfast food",
            "healthy vegan meal option"
        ]
        
        logger.info("🧪 Testing various search queries...")
        for query in test_queries:
            query_embedding = await pinecone_service.generate_embedding(query)
            results = pinecone_service.index.query(
                vector=query_embedding,
                namespace='global_foods',
                top_k=3,
                include_metadata=True
            )
            
            logger.info(f"🔍 Query: '{query}' -> {len(results['matches'])} results")
            if results['matches']:
                top_result = results['matches'][0]
                logger.info(f"  Top match: {top_result['metadata'].get('name', 'Unknown')} (score: {top_result['score']:.3f})")
        
        logger.info("✅ All verification tests passed!")
        logger.info("🎉 3072-dimension setup is working correctly!")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Verification failed: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Starting 3072-dimension verification...")
    result = asyncio.run(verify_3072_dimensions())
    if result:
        print("✅ Verification completed successfully!")
    else:
        print("❌ Verification failed!")
