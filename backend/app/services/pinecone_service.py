"""
Pinecone Vector Database Service for Nutrivize V2
Handles vectorization and retrieval of user nutrition data for enhanced AI context
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta, date
from dataclasses import dataclass
from pinecone import Pinecone, ServerlessSpec
import openai
from ..core.config import get_database
from ..core.redis_client import redis_client

logger = logging.getLogger(__name__)

@dataclass
class VectorChunk:
    """Represents a chunk of data to be vectorized"""
    id: str
    text: str
    metadata: Dict[str, Any]
    namespace: str

class PineconeService:
    """
    Comprehensive Pinecone service for vectorizing Nutrivize user data
    Uses OpenAI text-embedding-3-large model for high-quality embeddings
    """
    
    def __init__(self):
        # Initialize Pinecone
        self.pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        self.index_name = "nutrivize-context"
        self.index = None
        
        # Initialize OpenAI for embeddings
        openai.api_key = os.getenv("OPENAI_API_KEY")
        self.embedding_model = "text-embedding-3-large"
        self.embedding_dimension = 3072  # Maximum dimension for text-embedding-3-large
        
        # MongoDB database
        self.db = get_database()
        
        # Initialize index
        self._initialize_index()
        
        logger.info("✅ PineconeService initialized successfully")
    
    def _initialize_index(self):
        """Initialize or connect to Pinecone index"""
        try:
            # Check if index exists
            existing_indexes = [index.name for index in self.pc.list_indexes()]
            
            if self.index_name not in existing_indexes:
                logger.info(f"Creating Pinecone index: {self.index_name}")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=self.embedding_dimension,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1"
                    )
                )
                logger.info(f"✅ Created Pinecone index: {self.index_name}")
            
            # Connect to index
            self.index = self.pc.Index(self.index_name)
            logger.info(f"✅ Connected to Pinecone index: {self.index_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Pinecone index: {e}")
            self.index = None
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using OpenAI text-embedding-3-large model with 3072 dimensions"""
        try:
            # Use text-embedding-3-large with maximum dimension size (3072)
            response = openai.embeddings.create(
                model=self.embedding_model,
                input=text.strip(),
                dimensions=self.embedding_dimension  # Specify custom dimension size
            )
            
            embedding = response.data[0].embedding
            logger.debug(f"Generated {len(embedding)}-dimensional embedding for text: {text[:100]}...")
            return embedding
            
        except Exception as e:
            logger.error(f"❌ Failed to generate embedding: {e}")
            raise
    
    async def vectorize_food_log(self, user_id: str, food_log: Dict[str, Any]) -> bool:
        """
        Vectorize a single food log entry
        """
        try:
            if not self.index:
                logger.warning("Pinecone index not available, skipping vectorization")
                return False
            
            # Create meaningful text representation
            log_date = food_log.get('date', 'unknown date')
            meal_type = food_log.get('meal_type', 'unknown meal')
            food_name = food_log.get('food_name', 'unknown food')
            amount = food_log.get('amount', 0)
            unit = food_log.get('unit', 'g')
            notes = food_log.get('notes', '')
            
            nutrition = food_log.get('nutrition', {})
            calories = nutrition.get('calories', 0)
            protein = nutrition.get('protein', 0)
            carbs = nutrition.get('carbs', 0)
            fat = nutrition.get('fat', 0)
            fiber = nutrition.get('fiber', 0)
            sodium = nutrition.get('sodium', 0)
            
            # Create rich text representation
            text_content = f"""On {log_date}, {user_id.split('_')[-1] if '_' in user_id else 'user'} logged {amount}{unit} of {food_name} for {meal_type}.
This meal contained {calories} calories, {protein}g protein, {carbs}g carbs, and {fat}g fat.
Additional nutrients: {fiber}g fiber, {sodium}mg sodium.
{f'Notes: {notes}' if notes else 'No additional notes.'}
Meal timing: {meal_type} on {log_date}."""
            
            # Generate embedding
            embedding = await self.generate_embedding(text_content)
            
            # Create vector ID
            vector_id = f"{user_id}_foodlog_{food_log.get('_id', food_log.get('id', datetime.now().isoformat()))}"
            
            # Prepare metadata
            metadata = {
                "user_id": user_id,
                "data_type": "food_log",
                "date": str(log_date),
                "meal_type": meal_type,
                "food_name": food_name,
                "calories": float(calories),
                "protein": float(protein),
                "carbs": float(carbs),
                "fat": float(fat),
                "fiber": float(fiber),
                "sodium": float(sodium),
                "created_at": datetime.now().isoformat()
            }
            
            # Upsert to Pinecone
            self.index.upsert(
                vectors=[{
                    "id": vector_id,
                    "values": embedding,
                    "metadata": metadata
                }],
                namespace=user_id
            )
            
            logger.info(f"✅ Vectorized food log: {food_name} for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to vectorize food log: {e}")
            return False
    
    async def vectorize_meal_plan(self, user_id: str, meal_plan: Dict[str, Any]) -> bool:
        """
        Vectorize a meal plan (one vector per day)
        """
        try:
            if not self.index:
                logger.warning("Pinecone index not available, skipping vectorization")
                return False
            
            plan_id = meal_plan.get('plan_id', 'unknown_plan')
            plan_name = meal_plan.get('name', 'Unnamed Plan')
            goal_type = meal_plan.get('goal_type', 'general')
            days = meal_plan.get('days', [])
            
            # Handle different meal plan structures
            if not days:
                # Try alternative structure
                days = meal_plan.get('meals', [])
            
            # If still no days data, create a simple summary
            if not days or not isinstance(days, list):
                text_content = f"""Meal plan: {plan_name} (Goal: {goal_type})
This is a {goal_type} focused meal plan created for user nutrition optimization.
Plan contains structured meal recommendations."""
                
                # Generate embedding
                embedding = await self.generate_embedding(text_content)
                
                # Create vector ID
                vector_id = f"{user_id}_mealplan_{plan_id}_summary"
                
                # Prepare metadata
                metadata = {
                    "user_id": user_id,
                    "data_type": "meal_plan",
                    "plan_id": plan_id,
                    "plan_name": plan_name,
                    "goal_type": goal_type,
                    "total_calories": 0.0,
                    "total_protein": 0.0,
                    "created_at": datetime.now().isoformat()
                }
                
                # Upsert to Pinecone
                self.index.upsert(
                    vectors=[{
                        "id": vector_id,
                        "values": embedding,
                        "metadata": metadata
                    }],
                    namespace=user_id
                )
                
                logger.info(f"✅ Vectorized simplified meal plan: {plan_name} for user {user_id}")
                return True
            
            vectors_to_upsert = []
            
            for day_idx, day_data in enumerate(days):
                day_number = day_idx + 1
                
                # Handle different day data structures
                if isinstance(day_data, dict):
                    meals = day_data.get('meals', {})
                else:
                    # Skip if day_data is not a dict
                    continue
                
                # Create comprehensive day description
                meal_descriptions = []
                total_calories = 0
                total_protein = 0
                
                for meal_type, meal_items in meals.items():
                    if isinstance(meal_items, list):
                        for item in meal_items:
                            food_name = item.get('food_name', 'Unknown food')
                            calories = item.get('calories', 0)
                            protein = item.get('protein', 0)
                            
                            meal_descriptions.append(f"{meal_type.title()}: {food_name} ({calories} cal, {protein}g protein)")
                            total_calories += calories
                            total_protein += protein
                
                # Create rich text representation
                text_content = f"""Day {day_number} of {plan_name} (Goal: {goal_type}):
{chr(10).join(meal_descriptions)}

Daily totals: {total_calories} calories, {total_protein}g protein
Plan context: {goal_type} focused meal planning
Created for user nutrition optimization."""
                
                # Generate embedding
                embedding = await self.generate_embedding(text_content)
                
                # Create vector ID
                vector_id = f"{user_id}_mealplan_{plan_id}_day_{day_number}"
                
                # Prepare metadata
                metadata = {
                    "user_id": user_id,
                    "data_type": "meal_plan",
                    "plan_id": plan_id,
                    "plan_name": plan_name,
                    "goal_type": goal_type,
                    "day": day_number,
                    "total_calories": float(total_calories),
                    "total_protein": float(total_protein),
                    "created_at": datetime.now().isoformat()
                }
                
                vectors_to_upsert.append({
                    "id": vector_id,
                    "values": embedding,
                    "metadata": metadata
                })
            
            # Batch upsert
            if vectors_to_upsert:
                self.index.upsert(
                    vectors=vectors_to_upsert,
                    namespace=user_id
                )
                
                logger.info(f"✅ Vectorized meal plan: {plan_name} ({len(vectors_to_upsert)} days) for user {user_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to vectorize meal plan: {e}")
            return False
    
    async def vectorize_nutrition_summary(self, user_id: str, summary_data: Dict[str, Any]) -> bool:
        """
        Vectorize weekly/monthly nutrition summaries
        """
        try:
            if not self.index:
                logger.warning("Pinecone index not available, skipping vectorization")
                return False
            
            period = summary_data.get('period', 'week')
            start_date = summary_data.get('start_date', 'unknown')
            end_date = summary_data.get('end_date', 'unknown')
            
            # Extract key metrics
            avg_calories = summary_data.get('avg_calories', 0)
            avg_protein = summary_data.get('avg_protein', 0)
            avg_carbs = summary_data.get('avg_carbs', 0)
            avg_fat = summary_data.get('avg_fat', 0)
            avg_fiber = summary_data.get('avg_fiber', 0)
            avg_sodium = summary_data.get('avg_sodium', 0)
            
            target_calories = summary_data.get('target_calories', 2000)
            target_protein = summary_data.get('target_protein', 150)
            
            adherence_score = summary_data.get('adherence_score', 0)
            insights = summary_data.get('insights', [])
            
            # Create comprehensive summary text
            text_content = f"""Nutrition Summary for {period} ({start_date} to {end_date}):

Daily Averages:
- Calories: {avg_calories}/day (target: {target_calories})
- Protein: {avg_protein}g (target: {target_protein}g)
- Carbs: {avg_carbs}g
- Fat: {avg_fat}g
- Fiber: {avg_fiber}g
- Sodium: {avg_sodium}mg

Overall adherence: {adherence_score}%
Key insights: {'; '.join(insights) if insights else 'No specific insights'}

Performance analysis: {'On track' if adherence_score >= 80 else 'Needs improvement'}"""
            
            # Generate embedding
            embedding = await self.generate_embedding(text_content)
            
            # Create vector ID
            vector_id = f"{user_id}_summary_{period}_{start_date}_{end_date}"
            
            # Prepare metadata
            metadata = {
                "user_id": user_id,
                "data_type": "nutrition_summary",
                "period": period,
                "start_date": str(start_date),
                "end_date": str(end_date),
                "avg_calories": float(avg_calories),
                "avg_protein": float(avg_protein),
                "adherence_score": float(adherence_score),
                "created_at": datetime.now().isoformat()
            }
            
            # Upsert to Pinecone
            self.index.upsert(
                vectors=[{
                    "id": vector_id,
                    "values": embedding,
                    "metadata": metadata
                }],
                namespace=user_id
            )
            
            logger.info(f"✅ Vectorized nutrition summary: {period} for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to vectorize nutrition summary: {e}")
            return False
    
    async def vectorize_user_favorites(self, user_id: str, favorites: List[Dict[str, Any]]) -> bool:
        """
        Vectorize user's favorite foods for personalized recommendations
        """
        try:
            if not self.index:
                logger.warning("Pinecone index not available, skipping vectorization")
                return False
            
            vectors_to_upsert = []
            
            for favorite in favorites:
                food_name = favorite.get('food_name', 'Unknown food')
                category = favorite.get('category', 'general')
                usage_count = favorite.get('usage_count', 1)
                last_used = favorite.get('last_used', datetime.now())
                
                nutrition = favorite.get('nutrition', {})
                calories = nutrition.get('calories', 0)
                protein = nutrition.get('protein', 0)
                
                # Create descriptive text
                text_content = f"""User frequently chooses {food_name} as a {category} option.
This favorite food has been logged {usage_count} times, most recently on {last_used}.
Nutritional profile: {calories} calories, {protein}g protein per serving.
This represents a preferred food choice that aligns with user taste preferences."""
                
                # Generate embedding
                embedding = await self.generate_embedding(text_content)
                
                # Create vector ID
                vector_id = f"{user_id}_favorite_{favorite.get('food_id', food_name.replace(' ', '_'))}"
                
                # Prepare metadata
                metadata = {
                    "user_id": user_id,
                    "data_type": "favorite_food",
                    "food_name": food_name,
                    "category": category,
                    "usage_count": int(usage_count),
                    "calories": float(calories),
                    "protein": float(protein),
                    "created_at": datetime.now().isoformat()
                }
                
                vectors_to_upsert.append({
                    "id": vector_id,
                    "values": embedding,
                    "metadata": metadata
                })
            
            # Batch upsert
            if vectors_to_upsert:
                self.index.upsert(
                    vectors=vectors_to_upsert,
                    namespace=user_id
                )
                
                logger.info(f"✅ Vectorized {len(vectors_to_upsert)} favorite foods for user {user_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to vectorize favorites: {e}")
            return False
    
    async def vectorize_ai_chat_history(self, user_id: str, chat_session: Dict[str, Any]) -> bool:
        """
        Vectorize AI chat history for contextual memory
        """
        try:
            if not self.index:
                logger.warning("Pinecone index not available, skipping vectorization")
                return False
            
            messages = chat_session.get('messages', [])
            session_id = chat_session.get('session_id', str(datetime.now().timestamp()))
            
            # Focus on AI responses that contain advice or insights
            for idx, message in enumerate(messages):
                if message.get('role') == 'assistant' and len(message.get('content', '')) > 50:
                    content = message.get('content', '')
                    timestamp = message.get('timestamp', datetime.now())
                    
                    # Create context-rich text
                    text_content = f"""AI nutrition advice given to user on {timestamp}:
{content}

This represents personalized nutrition guidance provided based on user's specific context and needs."""
                    
                    # Generate embedding
                    embedding = await self.generate_embedding(text_content)
                    
                    # Create vector ID
                    vector_id = f"{user_id}_chat_{session_id}_{idx}"
                    
                    # Prepare metadata
                    metadata = {
                        "user_id": user_id,
                        "data_type": "ai_advice",
                        "session_id": session_id,
                        "timestamp": str(timestamp),
                        "message_length": len(content),
                        "created_at": datetime.now().isoformat()
                    }
                    
                    # Upsert to Pinecone
                    self.index.upsert(
                        vectors=[{
                            "id": vector_id,
                            "values": embedding,
                            "metadata": metadata
                        }],
                        namespace=user_id
                    )
            
            logger.info(f"✅ Vectorized chat session for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to vectorize chat history: {e}")
            return False
    
    async def query_user_context(self, user_id: str, query: str, top_k: int = 10, data_types: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Query user's vectorized data for relevant context across all user namespaces
        """
        try:
            if not self.index:
                logger.warning("Pinecone index not available, returning empty results")
                return []
            
            # Generate query embedding
            query_embedding = await self.generate_embedding(query)
            
            # Define all possible user namespaces
            user_namespaces = [
                f"user_food_logs_{user_id}",
                f"user_meal_plans_{user_id}",
                f"user_favorites_{user_id}",
                f"user_goals_{user_id}",
                f"user_weight_logs_{user_id}",
                f"user_water_logs_{user_id}",
                f"user_preferences_{user_id}",
                f"user_shopping_lists_{user_id}",
                f"user_chat_history_{user_id}",
                f"user_profile_{user_id}",
                "global_foods"  # Include global foods for comprehensive context
            ]
            
            # Filter namespaces by data types if specified
            if data_types:
                filtered_namespaces = []
                for data_type in data_types:
                    # Handle both singular and plural forms
                    if data_type in ["food_logs", "food_log"]:
                        filtered_namespaces.append(f"user_food_logs_{user_id}")
                    elif data_type in ["meal_plans", "meal_plan"]:
                        filtered_namespaces.append(f"user_meal_plans_{user_id}")
                    elif data_type in ["favorites", "favorite", "favorite_food"]:
                        filtered_namespaces.append(f"user_favorites_{user_id}")
                    elif data_type in ["goals", "goal"]:
                        filtered_namespaces.append(f"user_goals_{user_id}")
                    elif data_type in ["weight_logs", "weight_log"]:
                        filtered_namespaces.append(f"user_weight_logs_{user_id}")
                    elif data_type in ["water_logs", "water_log"]:
                        filtered_namespaces.append(f"user_water_logs_{user_id}")
                    elif data_type in ["preferences", "preference"]:
                        filtered_namespaces.append(f"user_preferences_{user_id}")
                    elif data_type in ["shopping_lists", "shopping_list"]:
                        filtered_namespaces.append(f"user_shopping_lists_{user_id}")
                    elif data_type in ["chat_history", "ai_advice"]:
                        filtered_namespaces.append(f"user_chat_history_{user_id}")
                    elif data_type in ["profile", "user_profile"]:
                        filtered_namespaces.append(f"user_profile_{user_id}")
                    elif data_type in ["global_foods", "global_food"]:
                        filtered_namespaces.append("global_foods")
                    elif data_type in ["nutrition_summary"]:
                        # Nutrition summaries might be in food logs
                        filtered_namespaces.append(f"user_food_logs_{user_id}")
                user_namespaces = filtered_namespaces
            
            # Query each relevant namespace and collect results
            all_context_items = []
            
            for namespace in user_namespaces:
                try:
                    # Query this namespace
                    results = self.index.query(
                        vector=query_embedding,
                        top_k=max(3, top_k // len(user_namespaces)),  # Distribute queries across namespaces
                        include_metadata=True,
                        namespace=namespace
                    )
                    
                    # Process results from this namespace
                    for match in results.matches:
                        all_context_items.append({
                            "id": match.id,
                            "score": match.score,
                            "metadata": match.metadata,
                            "namespace": namespace,
                            "relevance": "high" if match.score > 0.8 else "medium" if match.score > 0.6 else "low"
                        })
                        
                except Exception as namespace_error:
                    # Skip namespaces that don't exist or have errors
                    continue
            
            # Sort by score and limit to top_k
            all_context_items.sort(key=lambda x: x["score"], reverse=True)
            context_items = all_context_items[:top_k]
            
            logger.info(f"✅ Retrieved {len(context_items)} context items for user {user_id}")
            return context_items
            
        except Exception as e:
            logger.error(f"❌ Failed to query user context: {e}")
            return []
    
    async def invalidate_user_vectors(self, user_id: str, data_type: Optional[str] = None) -> bool:
        """
        Delete vectors for a user (optionally filtered by data type)
        """
        try:
            if not self.index:
                logger.warning("Pinecone index not available, skipping invalidation")
                return False
            
            # If data_type is specified, delete only those vectors
            if data_type:
                # Query to get vector IDs to delete
                results = self.index.query(
                    vector=[0.0] * self.embedding_dimension,  # Dummy vector
                    top_k=10000,  # Large number to get all matches
                    include_metadata=True,
                    namespace=user_id,
                    filter={"data_type": data_type}
                )
                
                vector_ids = [match.id for match in results.matches]
                if vector_ids:
                    self.index.delete(ids=vector_ids, namespace=user_id)
                    logger.info(f"✅ Deleted {len(vector_ids)} {data_type} vectors for user {user_id}")
            else:
                # Delete entire namespace
                self.index.delete(delete_all=True, namespace=user_id)
                logger.info(f"✅ Deleted all vectors for user {user_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to invalidate vectors: {e}")
            return False

# Global instance
pinecone_service = PineconeService()
