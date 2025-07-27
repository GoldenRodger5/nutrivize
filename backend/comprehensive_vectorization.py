#!/usr/bin/env python3
"""
Comprehensive Vectorization Script for Nutrivize V2
Vectorizes ALL user data types for enhanced AI context and intelligent retrieval

Data Types Vectorized:
1. Food Logs - Daily nutrition tracking
2. Meal Plans - User's saved meal plans  
3. User Favorites - Favorite foods and preferences
4. Goals - User health and nutrition goals
5. Weight Logs - Weight tracking data
6. Water Logs - Hydration tracking
7. User Preferences - Dietary restrictions, allergens, etc.
8. Shopping Lists - Generated shopping lists from meal plans
9. Chat History - Previous AI conversations
10. User Profile - Personal information and preferences

Vector Namespaces:
- user_food_logs_{user_id} - Food consumption data
- user_meal_plans_{user_id} - Saved meal plans
- user_favorites_{user_id} - Favorite foods
- user_goals_{user_id} - Health goals
- user_weight_logs_{user_id} - Weight tracking
- user_water_logs_{user_id} - Hydration data
- user_preferences_{user_id} - Dietary preferences
- user_shopping_lists_{user_id} - Shopping lists
- user_chat_history_{user_id} - AI conversation history
- user_profile_{user_id} - Personal profile data
- global_foods - Global food database (already done)
"""

import os
import sys
import json
import asyncio
import logging
from datetime import datetime, timedelta, date
from typing import Dict, List, Any, Optional
from bson import ObjectId

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import get_database
from app.services.pinecone_service import PineconeService

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ComprehensiveVectorizer:
    """Comprehensive vectorization service for all Nutrivize data types"""
    
    def __init__(self):
        self.db = get_database()
        self.pinecone_service = PineconeService()
        self.vectorized_counts = {
            "food_logs": 0,
            "meal_plans": 0,
            "favorites": 0,
            "goals": 0,
            "weight_logs": 0,
            "water_logs": 0,
            "preferences": 0,
            "shopping_lists": 0,
            "chat_history": 0,
            "profiles": 0,
            "errors": 0
        }
        
    async def vectorize_all_data(self):
        """Vectorize all data types for all users"""
        logger.info("🚀 Starting comprehensive vectorization of all Nutrivize data...")
        
        # Get all unique user IDs from various collections
        user_ids = await self._get_all_user_ids()
        logger.info(f"📊 Found {len(user_ids)} unique users")
        
        for user_id in user_ids:
            logger.info(f"\n👤 Processing data for user: {user_id}")
            
            # Vectorize each data type for this user
            await self._vectorize_user_food_logs(user_id)
            await self._vectorize_user_meal_plans(user_id)
            await self._vectorize_user_favorites(user_id)
            await self._vectorize_user_goals(user_id)
            await self._vectorize_user_weight_logs(user_id)
            await self._vectorize_user_water_logs(user_id)
            await self._vectorize_user_preferences(user_id)
            await self._vectorize_user_shopping_lists(user_id)
            await self._vectorize_user_chat_history(user_id)
            await self._vectorize_user_profile(user_id)
            
        # Print final summary
        self._print_summary()
        
    async def _get_all_user_ids(self) -> List[str]:
        """Get all unique user IDs from all collections"""
        user_ids = set()
        
        # Get user IDs from all collections
        collections_to_check = [
            "food_logs",
            "meal_plans", 
            "user_favorites",
            "goals",
            "weight_logs",
            "water_logs",
            "users",  # For preferences and profiles
            "shopping_lists"
        ]
        
        for collection_name in collections_to_check:
            try:
                collection = self.db[collection_name]
                cursor = collection.find({}, {"user_id": 1, "uid": 1})
                for doc in cursor:
                    # Handle both user_id and uid fields
                    if "user_id" in doc:
                        user_ids.add(doc["user_id"])
                    if "uid" in doc:
                        user_ids.add(doc["uid"])
            except Exception as e:
                logger.warning(f"⚠️ Error getting user IDs from {collection_name}: {e}")
                
        return list(user_ids)
    
    async def _vectorize_user_food_logs(self, user_id: str):
        """Vectorize all food logs for a user"""
        try:
            # Get food logs from last 90 days (limit for performance)
            cutoff_date = (datetime.now() - timedelta(days=90)).date()
            
            food_logs = list(self.db.food_logs.find({
                "user_id": user_id,
                "date": {"$gte": cutoff_date.isoformat()}
            }).sort("date", -1))
            
            if not food_logs:
                logger.info(f"📝 No recent food logs found for user {user_id}")
                return
                
            logger.info(f"📝 Vectorizing {len(food_logs)} food logs for user {user_id}")
            
            # Group logs by date for better context
            logs_by_date = {}
            for log in food_logs:
                log_date = log.get("date", "unknown")
                if log_date not in logs_by_date:
                    logs_by_date[log_date] = []
                logs_by_date[log_date].append(log)
            
            # Vectorize each day's logs as a single document
            for log_date, day_logs in logs_by_date.items():
                try:
                    # Create comprehensive text representation
                    text_content = self._format_daily_food_logs(day_logs, log_date)
                    
                    # Calculate daily nutrition totals
                    daily_nutrition = self._calculate_daily_nutrition(day_logs)
                    
                    # Create metadata
                    metadata = {
                        "user_id": user_id,
                        "data_type": "food_logs",
                        "date": log_date,
                        "log_count": len(day_logs),
                        "total_calories": daily_nutrition.get("calories", 0),
                        "total_protein": daily_nutrition.get("protein", 0),
                        "total_carbs": daily_nutrition.get("carbs", 0),
                        "total_fat": daily_nutrition.get("fat", 0),
                        "meal_types": list(set(log.get("meal_type", "unknown") for log in day_logs)),
                        "foods_eaten": [log.get("food_name", "Unknown") for log in day_logs],
                        "created_at": datetime.now().isoformat()
                    }
                    
                    # Generate vector ID
                    vector_id = f"food_logs_{user_id}_{log_date}"
                    
                    # Generate embedding and store
                    embedding = await self.pinecone_service.generate_embedding(text_content)
                    
                    # Store in Pinecone
                    if self.pinecone_service.index:
                        self.pinecone_service.index.upsert(
                            vectors=[(vector_id, embedding, metadata)],
                            namespace=f"user_food_logs_{user_id}"
                        )
                        
                    self.vectorized_counts["food_logs"] += 1
                    
                except Exception as e:
                    logger.error(f"❌ Error vectorizing food logs for {log_date}: {e}")
                    self.vectorized_counts["errors"] += 1
                    
        except Exception as e:
            logger.error(f"❌ Error vectorizing food logs for user {user_id}: {e}")
            self.vectorized_counts["errors"] += 1
    
    async def _vectorize_user_meal_plans(self, user_id: str):
        """Vectorize all meal plans for a user"""
        try:
            meal_plans = list(self.db.meal_plans.find({"user_id": user_id}))
            
            if not meal_plans:
                logger.info(f"🍽️ No meal plans found for user {user_id}")
                return
                
            logger.info(f"🍽️ Vectorizing {len(meal_plans)} meal plans for user {user_id}")
            
            for plan in meal_plans:
                try:
                    # Create comprehensive text representation
                    text_content = self._format_meal_plan(plan)
                    
                    # Create metadata
                    metadata = {
                        "user_id": user_id,
                        "data_type": "meal_plan",
                        "plan_id": plan.get("plan_id", str(plan.get("_id", ""))),
                        "name": plan.get("name", "Unnamed Plan"),
                        "type": plan.get("type", "unknown"),
                        "duration_days": plan.get("duration_days", len(plan.get("days", []))),
                        "dietary_restrictions": plan.get("dietary_restrictions", []),
                        "is_active": plan.get("is_active", False),
                        "version": plan.get("version", 1),
                        "created_at": plan.get("created_at", datetime.now()).isoformat() if isinstance(plan.get("created_at"), datetime) else str(plan.get("created_at", "")),
                        "tags": plan.get("tags", [])
                    }
                    
                    # Generate vector ID
                    vector_id = f"meal_plan_{user_id}_{plan.get('plan_id', str(plan.get('_id', '')))}"
                    
                    # Generate embedding and store
                    embedding = await self.pinecone_service.generate_embedding(text_content)
                    
                    # Store in Pinecone
                    if self.pinecone_service.index:
                        self.pinecone_service.index.upsert(
                            vectors=[(vector_id, embedding, metadata)],
                            namespace=f"user_meal_plans_{user_id}"
                        )
                        
                    self.vectorized_counts["meal_plans"] += 1
                    
                except Exception as e:
                    logger.error(f"❌ Error vectorizing meal plan {plan.get('_id')}: {e}")
                    self.vectorized_counts["errors"] += 1
                    
        except Exception as e:
            logger.error(f"❌ Error vectorizing meal plans for user {user_id}: {e}")
            self.vectorized_counts["errors"] += 1
    
    async def _vectorize_user_favorites(self, user_id: str):
        """Vectorize user's favorite foods"""
        try:
            favorites = list(self.db.user_favorites.find({"user_id": user_id}))
            
            if not favorites:
                logger.info(f"⭐ No favorites found for user {user_id}")
                return
                
            logger.info(f"⭐ Vectorizing {len(favorites)} favorites for user {user_id}")
            
            # Group favorites by category for better context
            favorites_by_category = {}
            for fav in favorites:
                category = fav.get("category", "general")
                if category not in favorites_by_category:
                    favorites_by_category[category] = []
                favorites_by_category[category].append(fav)
            
            # Vectorize each category as a single document
            for category, category_favorites in favorites_by_category.items():
                try:
                    # Create comprehensive text representation
                    text_content = self._format_favorites_by_category(category_favorites, category)
                    
                    # Create metadata
                    metadata = {
                        "user_id": user_id,
                        "data_type": "favorites",
                        "category": category,
                        "favorites_count": len(category_favorites),
                        "food_names": [fav.get("food_name", "Unknown") for fav in category_favorites],
                        "tags": list(set(tag for fav in category_favorites for tag in fav.get("tags", []))),
                        "total_usage": sum(fav.get("usage_count", 0) for fav in category_favorites),
                        "created_at": datetime.now().isoformat()
                    }
                    
                    # Generate vector ID
                    vector_id = f"favorites_{user_id}_{category}"
                    
                    # Generate embedding and store
                    embedding = await self.pinecone_service.generate_embedding(text_content)
                    
                    # Store in Pinecone
                    if self.pinecone_service.index:
                        self.pinecone_service.index.upsert(
                            vectors=[(vector_id, embedding, metadata)],
                            namespace=f"user_favorites_{user_id}"
                        )
                        
                    self.vectorized_counts["favorites"] += 1
                    
                except Exception as e:
                    logger.error(f"❌ Error vectorizing favorites for category {category}: {e}")
                    self.vectorized_counts["errors"] += 1
                    
        except Exception as e:
            logger.error(f"❌ Error vectorizing favorites for user {user_id}: {e}")
            self.vectorized_counts["errors"] += 1
    
    async def _vectorize_user_goals(self, user_id: str):
        """Vectorize user's health and nutrition goals"""
        try:
            goals = list(self.db.goals.find({"user_id": user_id}))
            
            if not goals:
                logger.info(f"🎯 No goals found for user {user_id}")
                return
                
            logger.info(f"🎯 Vectorizing {len(goals)} goals for user {user_id}")
            
            # Combine all goals into a single comprehensive document
            text_content = self._format_user_goals(goals)
            
            # Extract goal statistics
            active_goals = [g for g in goals if g.get("active", False)]
            goal_types = list(set(g.get("goal_type", "general") for g in goals))
            
            # Create metadata
            metadata = {
                "user_id": user_id,
                "data_type": "goals",
                "total_goals": len(goals),
                "active_goals": len(active_goals),
                "goal_types": goal_types,
                "has_weight_goal": any(g.get("weight_target") for g in goals),
                "has_nutrition_targets": any(g.get("nutrition_targets") for g in goals),
                "created_at": datetime.now().isoformat()
            }
            
            # Generate vector ID
            vector_id = f"goals_{user_id}_all"
            
            # Generate embedding and store
            embedding = await self.pinecone_service.generate_embedding(text_content)
            
            # Store in Pinecone
            if self.pinecone_service.index:
                self.pinecone_service.index.upsert(
                    vectors=[(vector_id, embedding, metadata)],
                    namespace=f"user_goals_{user_id}"
                )
                
            self.vectorized_counts["goals"] += 1
                    
        except Exception as e:
            logger.error(f"❌ Error vectorizing goals for user {user_id}: {e}")
            self.vectorized_counts["errors"] += 1
    
    async def _vectorize_user_weight_logs(self, user_id: str):
        """Vectorize user's weight tracking data"""
        try:
            # Get weight logs from last 180 days
            cutoff_date = datetime.now() - timedelta(days=180)
            
            weight_logs = list(self.db.weight_logs.find({
                "user_id": user_id,
                "date": {"$gte": cutoff_date}
            }).sort("date", -1))
            
            if not weight_logs:
                logger.info(f"⚖️ No recent weight logs found for user {user_id}")
                return
                
            logger.info(f"⚖️ Vectorizing {len(weight_logs)} weight logs for user {user_id}")
            
            # Create comprehensive text representation
            text_content = self._format_weight_logs(weight_logs)
            
            # Calculate weight statistics
            weights = [log.get("weight", 0) for log in weight_logs if log.get("weight")]
            weight_trend = self._calculate_weight_trend(weight_logs)
            
            # Create metadata
            metadata = {
                "user_id": user_id,
                "data_type": "weight_logs",
                "log_count": len(weight_logs),
                "current_weight": weights[0] if weights else None,
                "weight_range": f"{min(weights):.1f} - {max(weights):.1f} lbs" if weights else "No data",
                "trend": weight_trend,
                "date_range": f"{weight_logs[-1].get('date', 'unknown')} to {weight_logs[0].get('date', 'unknown')}",
                "created_at": datetime.now().isoformat()
            }
            
            # Generate vector ID
            vector_id = f"weight_logs_{user_id}_recent"
            
            # Generate embedding and store
            embedding = await self.pinecone_service.generate_embedding(text_content)
            
            # Store in Pinecone
            if self.pinecone_service.index:
                self.pinecone_service.index.upsert(
                    vectors=[(vector_id, embedding, metadata)],
                    namespace=f"user_weight_logs_{user_id}"
                )
                
            self.vectorized_counts["weight_logs"] += 1
                    
        except Exception as e:
            logger.error(f"❌ Error vectorizing weight logs for user {user_id}: {e}")
            self.vectorized_counts["errors"] += 1
    
    async def _vectorize_user_water_logs(self, user_id: str):
        """Vectorize user's water intake data"""
        try:
            # Get water logs from last 30 days
            cutoff_date = datetime.now() - timedelta(days=30)
            
            water_logs = list(self.db.water_logs.find({
                "user_id": user_id,
                "date": {"$gte": cutoff_date}
            }).sort("date", -1))
            
            if not water_logs:
                logger.info(f"💧 No recent water logs found for user {user_id}")
                return
                
            logger.info(f"💧 Vectorizing {len(water_logs)} water logs for user {user_id}")
            
            # Create comprehensive text representation
            text_content = self._format_water_logs(water_logs)
            
            # Calculate water statistics
            total_amounts = [log.get("amount", 0) for log in water_logs]
            avg_daily_intake = sum(total_amounts) / len(total_amounts) if total_amounts else 0
            
            # Create metadata
            metadata = {
                "user_id": user_id,
                "data_type": "water_logs",
                "log_count": len(water_logs),
                "avg_daily_intake": round(avg_daily_intake, 1),
                "highest_intake": max(total_amounts) if total_amounts else 0,
                "consistent_logging": len(water_logs) >= 20,  # 20+ days in last 30
                "created_at": datetime.now().isoformat()
            }
            
            # Generate vector ID
            vector_id = f"water_logs_{user_id}_recent"
            
            # Generate embedding and store
            embedding = await self.pinecone_service.generate_embedding(text_content)
            
            # Store in Pinecone
            if self.pinecone_service.index:
                self.pinecone_service.index.upsert(
                    vectors=[(vector_id, embedding, metadata)],
                    namespace=f"user_water_logs_{user_id}"
                )
                
            self.vectorized_counts["water_logs"] += 1
                    
        except Exception as e:
            logger.error(f"❌ Error vectorizing water logs for user {user_id}: {e}")
            self.vectorized_counts["errors"] += 1
    
    async def _vectorize_user_preferences(self, user_id: str):
        """Vectorize user's dietary preferences and restrictions"""
        try:
            # Get user document with preferences
            user_doc = self.db.users.find_one({"uid": user_id})
            
            if not user_doc or not user_doc.get("preferences"):
                logger.info(f"⚙️ No preferences found for user {user_id}")
                return
                
            logger.info(f"⚙️ Vectorizing preferences for user {user_id}")
            
            preferences = user_doc.get("preferences", {})
            dietary_prefs = preferences.get("dietary", {})
            
            # Create comprehensive text representation
            text_content = self._format_user_preferences(user_doc, preferences, dietary_prefs)
            
            # Create metadata
            metadata = {
                "user_id": user_id,
                "data_type": "preferences",
                "dietary_restrictions": dietary_prefs.get("dietary_restrictions", []),
                "allergens": dietary_prefs.get("allergens", []),
                "disliked_foods": dietary_prefs.get("disliked_foods", []),
                "preferred_cuisines": dietary_prefs.get("preferred_cuisines", []),
                "cooking_skill": dietary_prefs.get("cooking_skill_level", "intermediate"),
                "budget_preference": dietary_prefs.get("budget_preference", "moderate"),
                "max_prep_time": dietary_prefs.get("max_prep_time", 30),
                "has_restrictions": bool(dietary_prefs.get("dietary_restrictions") or dietary_prefs.get("allergens")),
                "created_at": datetime.now().isoformat()
            }
            
            # Generate vector ID
            vector_id = f"preferences_{user_id}_current"
            
            # Generate embedding and store
            embedding = await self.pinecone_service.generate_embedding(text_content)
            
            # Store in Pinecone
            if self.pinecone_service.index:
                self.pinecone_service.index.upsert(
                    vectors=[(vector_id, embedding, metadata)],
                    namespace=f"user_preferences_{user_id}"
                )
                
            self.vectorized_counts["preferences"] += 1
                    
        except Exception as e:
            logger.error(f"❌ Error vectorizing preferences for user {user_id}: {e}")
            self.vectorized_counts["errors"] += 1
    
    async def _vectorize_user_shopping_lists(self, user_id: str):
        """Vectorize user's shopping lists"""
        try:
            shopping_lists = list(self.db.shopping_lists.find({"user_id": user_id}))
            
            if not shopping_lists:
                logger.info(f"🛒 No shopping lists found for user {user_id}")
                return
                
            logger.info(f"🛒 Vectorizing {len(shopping_lists)} shopping lists for user {user_id}")
            
            for shopping_list in shopping_lists:
                try:
                    # Create comprehensive text representation
                    text_content = self._format_shopping_list(shopping_list)
                    
                    # Create metadata
                    metadata = {
                        "user_id": user_id,
                        "data_type": "shopping_list",
                        "list_id": str(shopping_list.get("_id", "")),
                        "meal_plan_id": shopping_list.get("meal_plan_id", ""),
                        "total_items": len(shopping_list.get("items", [])),
                        "estimated_cost": shopping_list.get("estimated_total_cost", 0),
                        "generated_at": shopping_list.get("generated_at", datetime.now()).isoformat() if isinstance(shopping_list.get("generated_at"), datetime) else str(shopping_list.get("generated_at", "")),
                        "categories": list(set(item.get("category", "General") for item in shopping_list.get("items", []))),
                        "created_at": datetime.now().isoformat()
                    }
                    
                    # Generate vector ID
                    vector_id = f"shopping_list_{user_id}_{str(shopping_list.get('_id', ''))}"
                    
                    # Generate embedding and store
                    embedding = await self.pinecone_service.generate_embedding(text_content)
                    
                    # Store in Pinecone
                    if self.pinecone_service.index:
                        self.pinecone_service.index.upsert(
                            vectors=[(vector_id, embedding, metadata)],
                            namespace=f"user_shopping_lists_{user_id}"
                        )
                        
                    self.vectorized_counts["shopping_lists"] += 1
                    
                except Exception as e:
                    logger.error(f"❌ Error vectorizing shopping list {shopping_list.get('_id')}: {e}")
                    self.vectorized_counts["errors"] += 1
                    
        except Exception as e:
            logger.error(f"❌ Error vectorizing shopping lists for user {user_id}: {e}")
            self.vectorized_counts["errors"] += 1
    
    async def _vectorize_user_chat_history(self, user_id: str):
        """Vectorize user's AI chat history"""
        try:
            # Get recent chat sessions (last 30 days)
            cutoff_date = datetime.now() - timedelta(days=30)
            
            # Note: This assumes chat history is stored in a collection
            # You may need to adjust based on your actual chat storage implementation
            chat_sessions = list(self.db.chat_sessions.find({
                "user_id": user_id,
                "created_at": {"$gte": cutoff_date}
            }).sort("created_at", -1).limit(50))  # Limit to recent 50 sessions
            
            if not chat_sessions:
                logger.info(f"💬 No recent chat history found for user {user_id}")
                return
                
            logger.info(f"💬 Vectorizing {len(chat_sessions)} chat sessions for user {user_id}")
            
            # Group conversations by topic/theme for better context
            for session in chat_sessions:
                try:
                    # Create comprehensive text representation
                    text_content = self._format_chat_session(session)
                    
                    # Create metadata
                    metadata = {
                        "user_id": user_id,
                        "data_type": "chat_history",
                        "session_id": str(session.get("_id", "")),
                        "message_count": len(session.get("messages", [])),
                        "session_date": session.get("created_at", datetime.now()).isoformat() if isinstance(session.get("created_at"), datetime) else str(session.get("created_at", "")),
                        "topics": self._extract_chat_topics(session),
                        "has_food_queries": self._has_food_related_content(session),
                        "created_at": datetime.now().isoformat()
                    }
                    
                    # Generate vector ID
                    vector_id = f"chat_session_{user_id}_{str(session.get('_id', ''))}"
                    
                    # Generate embedding and store
                    embedding = await self.pinecone_service.generate_embedding(text_content)
                    
                    # Store in Pinecone
                    if self.pinecone_service.index:
                        self.pinecone_service.index.upsert(
                            vectors=[(vector_id, embedding, metadata)],
                            namespace=f"user_chat_history_{user_id}"
                        )
                        
                    self.vectorized_counts["chat_history"] += 1
                    
                except Exception as e:
                    logger.error(f"❌ Error vectorizing chat session {session.get('_id')}: {e}")
                    self.vectorized_counts["errors"] += 1
                    
        except Exception as e:
            logger.error(f"❌ Error vectorizing chat history for user {user_id}: {e}")
            self.vectorized_counts["errors"] += 1
    
    async def _vectorize_user_profile(self, user_id: str):
        """Vectorize user's profile information"""
        try:
            user_doc = self.db.users.find_one({"uid": user_id})
            
            if not user_doc:
                logger.info(f"👤 No profile found for user {user_id}")
                return
                
            logger.info(f"👤 Vectorizing profile for user {user_id}")
            
            # Create comprehensive text representation
            text_content = self._format_user_profile(user_doc)
            
            # Create metadata
            metadata = {
                "user_id": user_id,
                "data_type": "profile",
                "name": user_doc.get("name", ""),
                "email": user_doc.get("email", ""),
                "age": user_doc.get("age"),
                "gender": user_doc.get("gender", ""),
                "activity_level": user_doc.get("activity_level", ""),
                "height": user_doc.get("height"),
                "current_weight": user_doc.get("current_weight"),
                "has_about_me": bool(user_doc.get("about_me")),
                "account_created": user_doc.get("created_at", datetime.now()).isoformat() if isinstance(user_doc.get("created_at"), datetime) else str(user_doc.get("created_at", "")),
                "created_at": datetime.now().isoformat()
            }
            
            # Generate vector ID
            vector_id = f"profile_{user_id}_current"
            
            # Generate embedding and store
            embedding = await self.pinecone_service.generate_embedding(text_content)
            
            # Store in Pinecone
            if self.pinecone_service.index:
                self.pinecone_service.index.upsert(
                    vectors=[(vector_id, embedding, metadata)],
                    namespace=f"user_profile_{user_id}"
                )
                
            self.vectorized_counts["profiles"] += 1
                    
        except Exception as e:
            logger.error(f"❌ Error vectorizing profile for user {user_id}: {e}")
            self.vectorized_counts["errors"] += 1
    
    # Helper formatting methods
    def _format_daily_food_logs(self, day_logs: List[Dict], log_date: str) -> str:
        """Format daily food logs into comprehensive text"""
        total_calories = sum(log.get("nutrition", {}).get("calories", 0) for log in day_logs)
        total_protein = sum(log.get("nutrition", {}).get("protein", 0) for log in day_logs)
        
        text = f"Daily Food Log for {log_date}\n"
        text += f"Total Calories: {total_calories:.1f}, Total Protein: {total_protein:.1f}g\n\n"
        
        # Group by meal type
        meals = {}
        for log in day_logs:
            meal_type = log.get("meal_type", "unknown")
            if meal_type not in meals:
                meals[meal_type] = []
            meals[meal_type].append(log)
        
        for meal_type, meal_logs in meals.items():
            text += f"{meal_type.title()}:\n"
            for log in meal_logs:
                food_name = log.get("food_name", "Unknown food")
                amount = log.get("amount", 0)
                unit = log.get("unit", "g")
                calories = log.get("nutrition", {}).get("calories", 0)
                text += f"  - {food_name}: {amount} {unit} ({calories} cal)\n"
            text += "\n"
        
        # Add notes if any
        notes = [log.get("notes", "") for log in day_logs if log.get("notes")]
        if notes:
            text += f"Notes: {'; '.join(notes)}\n"
        
        return text
    
    def _format_meal_plan(self, plan: Dict) -> str:
        """Format meal plan into comprehensive text"""
        text = f"Meal Plan: {plan.get('name', 'Unnamed Plan')}\n"
        text += f"Type: {plan.get('type', 'unknown')}, Duration: {plan.get('duration_days', 0)} days\n"
        text += f"Description: {plan.get('description', 'No description')}\n\n"
        
        if plan.get("dietary_restrictions"):
            text += f"Dietary Restrictions: {', '.join(plan['dietary_restrictions'])}\n"
        
        # Add days and meals
        days = plan.get("days", [])
        for i, day in enumerate(days):
            text += f"Day {i+1}:\n"
            meals = day.get("meals", [])
            if isinstance(meals, dict):
                # Handle dict structure
                for meal_type, meal_list in meals.items():
                    text += f"  {meal_type.title()}:\n"
                    for meal in meal_list:
                        text += f"    - {meal.get('food_name', 'Unknown meal')}\n"
            else:
                # Handle list structure
                for meal in meals:
                    meal_type = meal.get("meal_type", "unknown")
                    food_name = meal.get("food_name", "Unknown meal")
                    text += f"  {meal_type.title()}: {food_name}\n"
            text += "\n"
        
        return text
    
    def _format_favorites_by_category(self, favorites: List[Dict], category: str) -> str:
        """Format favorites by category into comprehensive text"""
        text = f"Favorite Foods - {category.title()} Category\n\n"
        
        for fav in favorites:
            food_name = fav.get("food_name", "Unknown food")
            usage_count = fav.get("usage_count", 0)
            notes = fav.get("notes", "")
            tags = fav.get("tags", [])
            
            text += f"- {food_name}"
            if usage_count > 0:
                text += f" (used {usage_count} times)"
            if tags:
                text += f" [Tags: {', '.join(tags)}]"
            if notes:
                text += f" - {notes}"
            text += "\n"
        
        return text
    
    def _format_user_goals(self, goals: List[Dict]) -> str:
        """Format user goals into comprehensive text"""
        text = "User Health and Nutrition Goals\n\n"
        
        active_goals = [g for g in goals if g.get("active", False)]
        if active_goals:
            text += "Active Goals:\n"
            for goal in active_goals:
                text += f"- {goal.get('title', 'Unnamed Goal')} ({goal.get('goal_type', 'general')})\n"
                if goal.get("weight_target"):
                    weight_target = goal["weight_target"]
                    text += f"  Weight Target: {weight_target.get('target_weight', 'N/A')} lbs\n"
                if goal.get("nutrition_targets"):
                    nutrition_targets = goal["nutrition_targets"]
                    text += f"  Nutrition Targets: Calories: {nutrition_targets.get('calories', 'N/A')}, "
                    text += f"Protein: {nutrition_targets.get('protein', 'N/A')}g\n"
                text += "\n"
        
        completed_goals = [g for g in goals if not g.get("active", True)]
        if completed_goals:
            text += "Previous Goals:\n"
            for goal in completed_goals:
                text += f"- {goal.get('title', 'Unnamed Goal')} (completed)\n"
        
        return text
    
    def _format_weight_logs(self, weight_logs: List[Dict]) -> str:
        """Format weight logs into comprehensive text"""
        if not weight_logs:
            return "No weight tracking data available."
        
        current_weight = weight_logs[0].get("weight", 0)
        oldest_weight = weight_logs[-1].get("weight", 0)
        weight_change = current_weight - oldest_weight
        
        text = f"Weight Tracking Summary\n"
        text += f"Current Weight: {current_weight} lbs\n"
        text += f"Weight Change: {weight_change:+.1f} lbs over {len(weight_logs)} entries\n\n"
        
        text += "Recent Weight Entries:\n"
        for log in weight_logs[:10]:  # Show last 10 entries
            date = log.get("date", "Unknown date")
            weight = log.get("weight", 0)
            notes = log.get("notes", "")
            text += f"- {date}: {weight} lbs"
            if notes:
                text += f" ({notes})"
            text += "\n"
        
        return text
    
    def _format_water_logs(self, water_logs: List[Dict]) -> str:
        """Format water logs into comprehensive text"""
        if not water_logs:
            return "No water intake tracking data available."
        
        total_amounts = [log.get("amount", 0) for log in water_logs]
        avg_intake = sum(total_amounts) / len(total_amounts) if total_amounts else 0
        
        text = f"Water Intake Tracking Summary\n"
        text += f"Average Daily Intake: {avg_intake:.1f} oz over {len(water_logs)} days\n"
        text += f"Highest Intake: {max(total_amounts):.1f} oz\n\n"
        
        text += "Recent Water Logs:\n"
        for log in water_logs[:15]:  # Show last 15 days
            date = log.get("date", "Unknown date")
            amount = log.get("amount", 0)
            text += f"- {date}: {amount} oz\n"
        
        return text
    
    def _format_user_preferences(self, user_doc: Dict, preferences: Dict, dietary_prefs: Dict) -> str:
        """Format user preferences into comprehensive text"""
        text = f"User Dietary Preferences and Restrictions\n\n"
        
        # Personal info
        name = user_doc.get("name", "")
        if name:
            text += f"Name: {name}\n"
        
        about_me = user_doc.get("about_me", "")
        if about_me:
            text += f"About: {about_me}\n"
        
        # Dietary restrictions
        restrictions = dietary_prefs.get("dietary_restrictions", [])
        if restrictions:
            text += f"Dietary Restrictions: {', '.join(restrictions)}\n"
        
        # Allergens
        allergens = dietary_prefs.get("allergens", [])
        if allergens:
            text += f"Allergens: {', '.join(allergens)}\n"
        
        # Disliked foods
        disliked = dietary_prefs.get("disliked_foods", [])
        if disliked:
            text += f"Foods to Avoid: {', '.join(disliked)}\n"
        
        # Preferences
        cuisines = dietary_prefs.get("preferred_cuisines", [])
        if cuisines:
            text += f"Preferred Cuisines: {', '.join(cuisines)}\n"
        
        text += f"Cooking Skill: {dietary_prefs.get('cooking_skill_level', 'intermediate')}\n"
        text += f"Budget Preference: {dietary_prefs.get('budget_preference', 'moderate')}\n"
        text += f"Max Prep Time: {dietary_prefs.get('max_prep_time', 30)} minutes\n"
        
        return text
    
    def _format_shopping_list(self, shopping_list: Dict) -> str:
        """Format shopping list into comprehensive text"""
        text = f"Shopping List\n"
        if shopping_list.get("meal_plan_id"):
            text += f"For Meal Plan: {shopping_list['meal_plan_id']}\n"
        text += f"Total Items: {len(shopping_list.get('items', []))}\n"
        text += f"Estimated Cost: ${shopping_list.get('estimated_total_cost', 0):.2f}\n\n"
        
        # Group items by category
        items_by_category = {}
        for item in shopping_list.get("items", []):
            category = item.get("category", "General")
            if category not in items_by_category:
                items_by_category[category] = []
            items_by_category[category].append(item)
        
        for category, items in items_by_category.items():
            text += f"{category}:\n"
            for item in items:
                name = item.get("item", "Unknown item")
                amount = item.get("amount", 1)
                unit = item.get("unit", "")
                cost = item.get("estimated_cost", 0)
                text += f"  - {name}: {amount} {unit} (${cost:.2f})\n"
            text += "\n"
        
        return text
    
    def _format_chat_session(self, session: Dict) -> str:
        """Format chat session into comprehensive text"""
        text = f"AI Chat Session - {session.get('created_at', 'Unknown date')}\n\n"
        
        messages = session.get("messages", [])
        for i, message in enumerate(messages):
            role = message.get("role", "unknown")
            content = message.get("content", "")
            text += f"{role.title()}: {content}\n\n"
            
            # Limit message count to prevent overly long text
            if i >= 10:
                text += f"... ({len(messages) - i - 1} more messages)\n"
                break
        
        return text
    
    def _format_user_profile(self, user_doc: Dict) -> str:
        """Format user profile into comprehensive text"""
        text = f"User Profile\n\n"
        
        name = user_doc.get("name", "")
        if name:
            text += f"Name: {name}\n"
        
        email = user_doc.get("email", "")
        if email:
            text += f"Email: {email}\n"
        
        age = user_doc.get("age")
        if age:
            text += f"Age: {age}\n"
        
        gender = user_doc.get("gender", "")
        if gender:
            text += f"Gender: {gender}\n"
        
        activity_level = user_doc.get("activity_level", "")
        if activity_level:
            text += f"Activity Level: {activity_level}\n"
        
        height = user_doc.get("height")
        if height:
            text += f"Height: {height}\n"
        
        weight = user_doc.get("current_weight")
        if weight:
            text += f"Current Weight: {weight} lbs\n"
        
        about_me = user_doc.get("about_me", "")
        if about_me:
            text += f"About Me: {about_me}\n"
        
        return text
    
    # Helper calculation methods
    def _calculate_daily_nutrition(self, day_logs: List[Dict]) -> Dict[str, float]:
        """Calculate total nutrition for a day"""
        totals = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}
        
        for log in day_logs:
            nutrition = log.get("nutrition", {})
            for key in totals:
                totals[key] += nutrition.get(key, 0)
        
        return totals
    
    def _calculate_weight_trend(self, weight_logs: List[Dict]) -> str:
        """Calculate weight trend from logs"""
        if len(weight_logs) < 2:
            return "insufficient_data"
        
        weights = [log.get("weight", 0) for log in weight_logs if log.get("weight")]
        if len(weights) < 2:
            return "insufficient_data"
        
        recent_avg = sum(weights[:3]) / 3 if len(weights) >= 3 else weights[0]
        older_avg = sum(weights[-3:]) / 3 if len(weights) >= 3 else weights[-1]
        
        diff = recent_avg - older_avg
        if abs(diff) < 0.5:
            return "stable"
        elif diff > 0:
            return "increasing"
        else:
            return "decreasing"
    
    def _extract_chat_topics(self, session: Dict) -> List[str]:
        """Extract topics from chat session"""
        topics = []
        messages = session.get("messages", [])
        
        # Simple keyword-based topic extraction
        food_keywords = ["food", "meal", "recipe", "nutrition", "calories", "protein"]
        exercise_keywords = ["exercise", "workout", "activity", "fitness"]
        goal_keywords = ["goal", "target", "lose", "gain", "weight"]
        
        content = " ".join(msg.get("content", "").lower() for msg in messages)
        
        if any(keyword in content for keyword in food_keywords):
            topics.append("food_nutrition")
        if any(keyword in content for keyword in exercise_keywords):
            topics.append("exercise_fitness")
        if any(keyword in content for keyword in goal_keywords):
            topics.append("goals_planning")
        
        return topics if topics else ["general"]
    
    def _has_food_related_content(self, session: Dict) -> bool:
        """Check if session contains food-related content"""
        messages = session.get("messages", [])
        content = " ".join(msg.get("content", "").lower() for msg in messages)
        
        food_keywords = ["food", "meal", "eat", "nutrition", "calories", "protein", "recipe", "cook"]
        return any(keyword in content for keyword in food_keywords)
    
    def _print_summary(self):
        """Print vectorization summary"""
        total_success = sum(self.vectorized_counts[key] for key in self.vectorized_counts if key != "errors")
        total_errors = self.vectorized_counts["errors"]
        
        logger.info("\n" + "="*60)
        logger.info("🎉 COMPREHENSIVE VECTORIZATION COMPLETE")
        logger.info("="*60)
        
        for data_type, count in self.vectorized_counts.items():
            if data_type != "errors" and count > 0:
                logger.info(f"✅ {data_type.replace('_', ' ').title()}: {count} vectorized")
        
        logger.info(f"\n📊 SUMMARY:")
        logger.info(f"✅ Total Successful: {total_success}")
        logger.info(f"❌ Total Errors: {total_errors}")
        logger.info(f"🎯 Success Rate: {(total_success / (total_success + total_errors) * 100):.1f}%" if (total_success + total_errors) > 0 else "N/A")
        
        logger.info(f"\n🚀 Enhanced AI capabilities now available:")
        logger.info(f"   • Intelligent food log analysis")
        logger.info(f"   • Context-aware meal planning")
        logger.info(f"   • Personalized nutrition recommendations")
        logger.info(f"   • Smart goal tracking insights")
        logger.info(f"   • Historical preference understanding")
        logger.info("="*60)

async def main():
    """Main vectorization function"""
    vectorizer = ComprehensiveVectorizer()
    await vectorizer.vectorize_all_data()

if __name__ == "__main__":
    asyncio.run(main())
