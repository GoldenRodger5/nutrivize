#!/usr/bin/env python3
"""
Comprehensive Vector Database Verification and Testing Script
Tests all vectorized data types and provides detailed statistics
"""

import os
import sys
import asyncio
import logging
from typing import Dict, List, Any
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import get_database
from app.services.pinecone_service import PineconeService

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VectorVerification:
    """Comprehensive verification of vectorized data"""
    
    def __init__(self):
        self.db = get_database()
        self.pinecone_service = PineconeService()
        
    async def verify_all_vectors(self):
        """Verify all vectorized data and provide comprehensive statistics"""
        logger.info("🔍 Starting comprehensive vector verification...")
        
        # Get all namespaces
        if not self.pinecone_service.index:
            logger.error("❌ No Pinecone index available")
            return
            
        # Get index statistics
        try:
            stats = self.pinecone_service.index.describe_index_stats()
            logger.info(f"📊 Index Statistics:")
            logger.info(f"   Total Vectors: {stats.total_vector_count}")
            logger.info(f"   Index Fullness: {stats.index_fullness}")
            logger.info(f"   Dimension: {stats.dimension}")
            
            # Check each namespace
            namespaces = stats.namespaces
            logger.info(f"\n📁 Found {len(namespaces)} namespaces:")
            
            total_vectors = 0
            namespace_stats = {}
            
            for namespace, namespace_stats_obj in namespaces.items():
                vector_count = namespace_stats_obj.vector_count
                total_vectors += vector_count
                namespace_stats[namespace] = vector_count
                logger.info(f"   {namespace}: {vector_count} vectors")
            
            # Categorize namespaces by type
            self._categorize_namespaces(namespace_stats)
            
            # Test vector retrieval
            await self._test_vector_retrieval()
            
            # Test similarity searches
            await self._test_similarity_searches()
            
            logger.info(f"\n✅ Vector verification complete!")
            logger.info(f"📊 Total vectors across all namespaces: {total_vectors}")
            
        except Exception as e:
            logger.error(f"❌ Error getting index statistics: {e}")
    
    def _categorize_namespaces(self, namespace_stats: Dict[str, int]):
        """Categorize and display namespace statistics by data type"""
        logger.info(f"\n📊 VECTOR STATISTICS BY DATA TYPE:")
        logger.info("=" * 60)
        
        categories = {
            "Global Foods": [],
            "User Food Logs": [],
            "User Meal Plans": [],
            "User Favorites": [],
            "User Goals": [],
            "User Weight Logs": [],
            "User Water Logs": [],
            "User Preferences": [],
            "User Shopping Lists": [],
            "User Chat History": [],
            "User Profiles": []
        }
        
        for namespace, count in namespace_stats.items():
            if namespace == "global_foods":
                categories["Global Foods"].append((namespace, count))
            elif "food_logs" in namespace:
                categories["User Food Logs"].append((namespace, count))
            elif "meal_plans" in namespace:
                categories["User Meal Plans"].append((namespace, count))
            elif "favorites" in namespace:
                categories["User Favorites"].append((namespace, count))
            elif "goals" in namespace:
                categories["User Goals"].append((namespace, count))
            elif "weight_logs" in namespace:
                categories["User Weight Logs"].append((namespace, count))
            elif "water_logs" in namespace:
                categories["User Water Logs"].append((namespace, count))
            elif "preferences" in namespace:
                categories["User Preferences"].append((namespace, count))
            elif "shopping_lists" in namespace:
                categories["User Shopping Lists"].append((namespace, count))
            elif "chat_history" in namespace:
                categories["User Chat History"].append((namespace, count))
            elif "profile" in namespace:
                categories["User Profiles"].append((namespace, count))
        
        for category, namespaces in categories.items():
            if namespaces:
                total_count = sum(count for _, count in namespaces)
                logger.info(f"\n🏷️  {category}: {total_count} vectors")
                for namespace, count in namespaces:
                    user_id = self._extract_user_id(namespace)
                    logger.info(f"   📁 {namespace}: {count} vectors (User: {user_id})")
            else:
                logger.info(f"\n🏷️  {category}: 0 vectors")
    
    def _extract_user_id(self, namespace: str) -> str:
        """Extract user ID from namespace"""
        parts = namespace.split("_")
        if len(parts) >= 3:
            return parts[-1]
        return "unknown"
    
    async def _test_vector_retrieval(self):
        """Test vector retrieval from different namespaces"""
        logger.info(f"\n🧪 TESTING VECTOR RETRIEVAL:")
        logger.info("=" * 40)
        
        # Test global foods
        await self._test_global_foods_retrieval()
        
        # Test user data retrieval
        await self._test_user_data_retrieval()
    
    async def _test_global_foods_retrieval(self):
        """Test global foods vector retrieval"""
        try:
            # Query for high protein foods
            query_embedding = await self.pinecone_service.generate_embedding(
                "high protein foods chicken beef eggs"
            )
            
            results = self.pinecone_service.index.query(
                vector=query_embedding,
                top_k=5,
                namespace="global_foods",
                include_metadata=True
            )
            
            logger.info(f"🥩 Global Foods Query Test:")
            logger.info(f"   Query: 'high protein foods chicken beef eggs'")
            logger.info(f"   Results: {len(results.matches)} matches")
            
            for i, match in enumerate(results.matches[:3]):
                food_name = match.metadata.get('name', 'Unknown')
                protein = match.metadata.get('protein', 0)
                score = match.score
                logger.info(f"   {i+1}. {food_name} ({protein}g protein) - Score: {score:.3f}")
                
        except Exception as e:
            logger.error(f"❌ Error testing global foods retrieval: {e}")
    
    async def _test_user_data_retrieval(self):
        """Test user data vector retrieval"""
        try:
            # Find a user with data
            test_user_id = "GME7nGpJQRc2v9T057vJ4oyqAJN2"
            
            # Test food logs retrieval
            await self._test_food_logs_query(test_user_id)
            
            # Test meal plans retrieval
            await self._test_meal_plans_query(test_user_id)
            
            # Test preferences retrieval
            await self._test_preferences_query(test_user_id)
            
        except Exception as e:
            logger.error(f"❌ Error testing user data retrieval: {e}")
    
    async def _test_food_logs_query(self, user_id: str):
        """Test food logs vector query"""
        try:
            query_embedding = await self.pinecone_service.generate_embedding(
                "breakfast meals high protein morning food"
            )
            
            results = self.pinecone_service.index.query(
                vector=query_embedding,
                top_k=3,
                namespace=f"user_food_logs_{user_id}",
                include_metadata=True
            )
            
            logger.info(f"\n📝 Food Logs Query Test (User: {user_id[:8]}...):")
            logger.info(f"   Query: 'breakfast meals high protein morning food'")
            logger.info(f"   Results: {len(results.matches)} matches")
            
            for i, match in enumerate(results.matches):
                date = match.metadata.get('date', 'Unknown')
                calories = match.metadata.get('total_calories', 0)
                protein = match.metadata.get('total_protein', 0)
                score = match.score
                logger.info(f"   {i+1}. {date} ({calories} cal, {protein}g protein) - Score: {score:.3f}")
                
        except Exception as e:
            logger.error(f"❌ Error testing food logs query: {e}")
    
    async def _test_meal_plans_query(self, user_id: str):
        """Test meal plans vector query"""
        try:
            query_embedding = await self.pinecone_service.generate_embedding(
                "healthy meal plan weight loss low carb"
            )
            
            results = self.pinecone_service.index.query(
                vector=query_embedding,
                top_k=3,
                namespace=f"user_meal_plans_{user_id}",
                include_metadata=True
            )
            
            logger.info(f"\n🍽️ Meal Plans Query Test (User: {user_id[:8]}...):")
            logger.info(f"   Query: 'healthy meal plan weight loss low carb'")
            logger.info(f"   Results: {len(results.matches)} matches")
            
            for i, match in enumerate(results.matches):
                name = match.metadata.get('name', 'Unknown Plan')
                plan_type = match.metadata.get('type', 'unknown')
                duration = match.metadata.get('duration_days', 0)
                score = match.score
                logger.info(f"   {i+1}. {name} ({plan_type}, {duration} days) - Score: {score:.3f}")
                
        except Exception as e:
            logger.error(f"❌ Error testing meal plans query: {e}")
    
    async def _test_preferences_query(self, user_id: str):
        """Test preferences vector query"""
        try:
            query_embedding = await self.pinecone_service.generate_embedding(
                "dietary restrictions allergies food preferences"
            )
            
            results = self.pinecone_service.index.query(
                vector=query_embedding,
                top_k=1,
                namespace=f"user_preferences_{user_id}",
                include_metadata=True
            )
            
            logger.info(f"\n⚙️ Preferences Query Test (User: {user_id[:8]}...):")
            logger.info(f"   Query: 'dietary restrictions allergies food preferences'")
            logger.info(f"   Results: {len(results.matches)} matches")
            
            for i, match in enumerate(results.matches):
                restrictions = match.metadata.get('dietary_restrictions', [])
                allergens = match.metadata.get('allergens', [])
                cooking_skill = match.metadata.get('cooking_skill', 'unknown')
                score = match.score
                logger.info(f"   {i+1}. Restrictions: {restrictions}, Allergens: {allergens}")
                logger.info(f"       Cooking Skill: {cooking_skill} - Score: {score:.3f}")
                
        except Exception as e:
            logger.error(f"❌ Error testing preferences query: {e}")
    
    async def _test_similarity_searches(self):
        """Test similarity searches across different data types"""
        logger.info(f"\n🔍 TESTING SIMILARITY SEARCHES:")
        logger.info("=" * 40)
        
        # Test cross-namespace food-related queries
        await self._test_cross_namespace_food_query()
        
        # Test user context integration
        await self._test_user_context_integration()
    
    async def _test_cross_namespace_food_query(self):
        """Test querying across food-related namespaces"""
        try:
            query_embedding = await self.pinecone_service.generate_embedding(
                "chicken breast protein muscle building"
            )
            
            # Query global foods
            global_results = self.pinecone_service.index.query(
                vector=query_embedding,
                top_k=2,
                namespace="global_foods",
                include_metadata=True
            )
            
            # Query user favorites
            user_id = "GME7nGpJQRc2v9T057vJ4oyqAJN2"
            favorites_results = self.pinecone_service.index.query(
                vector=query_embedding,
                top_k=2,
                namespace=f"user_favorites_{user_id}",
                include_metadata=True
            )
            
            logger.info(f"🔗 Cross-Namespace Food Query:")
            logger.info(f"   Query: 'chicken breast protein muscle building'")
            
            logger.info(f"   Global Foods Results ({len(global_results.matches)}):")
            for match in global_results.matches:
                name = match.metadata.get('name', 'Unknown')
                protein = match.metadata.get('protein', 0)
                logger.info(f"     • {name} ({protein}g protein) - Score: {match.score:.3f}")
            
            logger.info(f"   User Favorites Results ({len(favorites_results.matches)}):")
            for match in favorites_results.matches:
                category = match.metadata.get('category', 'unknown')
                count = match.metadata.get('favorites_count', 0)
                logger.info(f"     • {category} category ({count} items) - Score: {match.score:.3f}")
                
        except Exception as e:
            logger.error(f"❌ Error testing cross-namespace query: {e}")
    
    async def _test_user_context_integration(self):
        """Test how different user data types work together"""
        try:
            user_id = "GME7nGpJQRc2v9T057vJ4oyqAJN2"
            query_embedding = await self.pinecone_service.generate_embedding(
                "meal planning weight loss healthy eating habits"
            )
            
            # Query different user namespaces
            namespaces_to_test = [
                f"user_meal_plans_{user_id}",
                f"user_food_logs_{user_id}",
                f"user_goals_{user_id}",
                f"user_preferences_{user_id}"
            ]
            
            logger.info(f"🎯 User Context Integration Test:")
            logger.info(f"   Query: 'meal planning weight loss healthy eating habits'")
            logger.info(f"   User: {user_id[:8]}...")
            
            for namespace in namespaces_to_test:
                try:
                    results = self.pinecone_service.index.query(
                        vector=query_embedding,
                        top_k=1,
                        namespace=namespace,
                        include_metadata=True
                    )
                    
                    data_type = namespace.split("_")[1]
                    logger.info(f"   {data_type.title()}: {len(results.matches)} matches")
                    
                    if results.matches:
                        match = results.matches[0]
                        score = match.score
                        # Extract relevant metadata based on data type
                        if "meal_plans" in namespace:
                            name = match.metadata.get('name', 'Unknown')
                            logger.info(f"     Best match: {name} (Score: {score:.3f})")
                        elif "food_logs" in namespace:
                            date = match.metadata.get('date', 'Unknown')
                            calories = match.metadata.get('total_calories', 0)
                            logger.info(f"     Best match: {date} ({calories} cal) (Score: {score:.3f})")
                        elif "goals" in namespace:
                            goal_types = match.metadata.get('goal_types', [])
                            logger.info(f"     Best match: {goal_types} (Score: {score:.3f})")
                        elif "preferences" in namespace:
                            restrictions = match.metadata.get('dietary_restrictions', [])
                            logger.info(f"     Best match: {restrictions} (Score: {score:.3f})")
                    
                except Exception as ns_error:
                    logger.warning(f"   {data_type.title()}: No data available")
                    
        except Exception as e:
            logger.error(f"❌ Error testing user context integration: {e}")

async def main():
    """Main verification function"""
    verifier = VectorVerification()
    await verifier.verify_all_vectors()

if __name__ == "__main__":
    asyncio.run(main())
