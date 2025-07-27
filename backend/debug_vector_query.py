#!/usr/bin/env python3
"""
Debug script to test direct vector queries
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set up environment
os.environ.setdefault('ENVIRONMENT', 'development')

from app.core.config import get_database
from app.services.pinecone_service import pinecone_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_vector_queries():
    """
    Test direct vector queries to debug why we're getting 0 results
    """
    try:
        # PineconeService is already initialized globally
        logger.info(f"🔗 Pinecone service connected: {pinecone_service.index is not None}")
        
        user_id = "GME7nGpJQRc2v9T057vJ4oyqAJN2"
        test_query = "high protein foods"
        
        logger.info(f"🧪 Debug Vector Queries for user: {user_id}")
        logger.info("=" * 60)
        
        # Test 1: Query a specific namespace we know exists
        logger.info(f"\n🔍 TEST 1: Direct namespace query")
        logger.info(f"Namespace: user_meal_plans_{user_id}")
        
        try:
            query_embedding = await pinecone_service.generate_embedding(test_query)
            logger.info(f"✅ Generated embedding with {len(query_embedding)} dimensions")
            
            # Direct query to the meal plans namespace
            results = pinecone_service.index.query(
                vector=query_embedding,
                top_k=5,
                include_metadata=True,
                namespace=f"user_meal_plans_{user_id}"
            )
            
            logger.info(f"📊 Direct query results: {len(results.matches)} matches")
            for i, match in enumerate(results.matches):
                logger.info(f"  {i+1}. Score: {match.score:.3f}, ID: {match.id}")
                logger.info(f"      Metadata: {match.metadata}")
                
        except Exception as e:
            logger.error(f"❌ Direct query failed: {e}")
        
        # Test 2: List all namespaces to see what actually exists
        logger.info(f"\n🗂️ TEST 2: Index statistics")
        try:
            stats = pinecone_service.index.describe_index_stats()
            logger.info(f"Total vectors: {stats.total_vector_count}")
            logger.info(f"Namespaces: {len(stats.namespaces)}")
            
            for namespace, ns_stats in stats.namespaces.items():
                logger.info(f"  📁 {namespace}: {ns_stats.vector_count} vectors")
                
        except Exception as e:
            logger.error(f"❌ Stats query failed: {e}")
        
        # Test 3: Test the updated query_user_context method
        logger.info(f"\n🎯 TEST 3: Updated query_user_context method")
        try:
            context_items = await pinecone_service.query_user_context(
                user_id=user_id,
                query=test_query,
                top_k=5
            )
            
            logger.info(f"📊 query_user_context results: {len(context_items)} items")
            for i, item in enumerate(context_items):
                logger.info(f"  {i+1}. Score: {item['score']:.3f}, Namespace: {item.get('namespace', 'unknown')}")
                logger.info(f"      Metadata: {item['metadata']}")
                
        except Exception as e:
            logger.error(f"❌ query_user_context failed: {e}")
        
        # Test 4: Test global foods namespace
        logger.info(f"\n🍎 TEST 4: Global foods query")
        try:
            results = pinecone_service.index.query(
                vector=query_embedding,
                top_k=5,
                include_metadata=True,
                namespace="global_foods"
            )
            
            logger.info(f"📊 Global foods results: {len(results.matches)} matches")
            for i, match in enumerate(results.matches):
                logger.info(f"  {i+1}. Score: {match.score:.3f}, Food: {match.metadata.get('name', match.id)}")
                
        except Exception as e:
            logger.error(f"❌ Global foods query failed: {e}")
            
        logger.info("\n✅ Debug testing complete!")
        
    except Exception as e:
        logger.error(f"❌ Debug failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_vector_queries())
