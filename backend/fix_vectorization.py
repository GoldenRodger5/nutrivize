#!/usr/bin/env python3
"""
Fixed Comprehensive Vectorization Script - Handles null metadata values properly
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

class FixedVectorizer:
    """Fixed vectorization with proper null handling"""
    
    def __init__(self):
        self.db = get_database()
        self.pinecone_service = PineconeService()
        
    def _clean_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Clean metadata by removing null values and ensuring proper types"""
        cleaned = {}
        
        for key, value in metadata.items():
            if value is None:
                continue  # Skip null values
            elif isinstance(value, list):
                # Clean list - remove null values
                cleaned_list = [v for v in value if v is not None]
                if cleaned_list:  # Only add if list is not empty
                    cleaned[key] = cleaned_list
            elif isinstance(value, (str, int, float, bool)):
                cleaned[key] = value
            elif isinstance(value, datetime):
                cleaned[key] = value.isoformat()
            else:
                # Convert other types to string
                cleaned[key] = str(value)
        
        return cleaned
    
    async def fix_remaining_vectorization(self):
        """Fix the remaining vectorization issues"""
        logger.info("🔧 Fixing remaining vectorization issues...")
        
        # Re-vectorize preferences with fixed metadata
        await self._fix_user_preferences("GME7nGpJQRc2v9T057vJ4oyqAJN2")
        
        # Re-vectorize shopping lists with fixed metadata  
        await self._fix_shopping_lists("GME7nGpJQRc2v9T057vJ4oyqAJN2")
        
        # Re-vectorize profiles with fixed metadata
        await self._fix_user_profiles(["GME7nGpJQRc2v9T057vJ4oyqAJN2", "5jlPr83skvNJMePGQCWC46Nq5LS2"])
        
        logger.info("✅ Fixed vectorization issues!")
    
    async def _fix_user_preferences(self, user_id: str):
        """Fix user preferences vectorization"""
        try:
            user_doc = self.db.users.find_one({"uid": user_id})
            
            if not user_doc or not user_doc.get("preferences"):
                logger.info(f"⚙️ No preferences found for user {user_id}")
                return
                
            logger.info(f"🔧 Fixing preferences vectorization for user {user_id}")
            
            preferences = user_doc.get("preferences", {})
            dietary_prefs = preferences.get("dietary", {})
            
            # Create comprehensive text representation
            text_content = self._format_user_preferences(user_doc, preferences, dietary_prefs)
            
            # Create metadata with proper null handling
            metadata = {
                "user_id": user_id,
                "data_type": "preferences",
                "dietary_restrictions": dietary_prefs.get("dietary_restrictions", []),
                "allergens": dietary_prefs.get("allergens", []),
                "disliked_foods": dietary_prefs.get("disliked_foods", []),
                "preferred_cuisines": dietary_prefs.get("preferred_cuisines", []),
                "cooking_skill": dietary_prefs.get("cooking_skill_level", "intermediate"),
                "budget_preference": dietary_prefs.get("budget_preference", "moderate"),
                "has_restrictions": bool(dietary_prefs.get("dietary_restrictions") or dietary_prefs.get("allergens")),
                "created_at": datetime.now().isoformat()
            }
            
            # Only add max_prep_time if it's not null
            if dietary_prefs.get("max_prep_time") is not None:
                metadata["max_prep_time"] = dietary_prefs["max_prep_time"]
            
            # Clean metadata
            metadata = self._clean_metadata(metadata)
            
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
                
            logger.info(f"✅ Fixed preferences vectorization for user {user_id}")
                    
        except Exception as e:
            logger.error(f"❌ Error fixing preferences for user {user_id}: {e}")
    
    async def _fix_shopping_lists(self, user_id: str):
        """Fix shopping lists vectorization"""
        try:
            shopping_lists = list(self.db.shopping_lists.find({"user_id": user_id}))
            
            if not shopping_lists:
                logger.info(f"🛒 No shopping lists found for user {user_id}")
                return
                
            logger.info(f"🔧 Fixing {len(shopping_lists)} shopping lists for user {user_id}")
            
            for shopping_list in shopping_lists:
                try:
                    # Create comprehensive text representation
                    text_content = self._format_shopping_list(shopping_list)
                    
                    # Get categories and clean them
                    items = shopping_list.get("items", [])
                    categories = []
                    for item in items:
                        category = item.get("category")
                        if category is not None:
                            categories.append(category)
                    
                    # Remove duplicates
                    categories = list(set(categories))
                    
                    # Create metadata with proper null handling
                    metadata = {
                        "user_id": user_id,
                        "data_type": "shopping_list",
                        "list_id": str(shopping_list.get("_id", "")),
                        "total_items": len(items),
                        "estimated_cost": shopping_list.get("estimated_total_cost", 0),
                        "created_at": datetime.now().isoformat()
                    }
                    
                    # Only add optional fields if they're not null/empty
                    if shopping_list.get("meal_plan_id"):
                        metadata["meal_plan_id"] = shopping_list["meal_plan_id"]
                        
                    if categories:
                        metadata["categories"] = categories
                        
                    if shopping_list.get("generated_at"):
                        generated_at = shopping_list["generated_at"]
                        if isinstance(generated_at, datetime):
                            metadata["generated_at"] = generated_at.isoformat()
                        else:
                            metadata["generated_at"] = str(generated_at)
                    
                    # Clean metadata
                    metadata = self._clean_metadata(metadata)
                    
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
                        
                    logger.info(f"✅ Fixed shopping list {shopping_list.get('_id')}")
                    
                except Exception as e:
                    logger.error(f"❌ Error fixing shopping list {shopping_list.get('_id')}: {e}")
                    
        except Exception as e:
            logger.error(f"❌ Error fixing shopping lists for user {user_id}: {e}")
    
    async def _fix_user_profiles(self, user_ids: List[str]):
        """Fix user profiles vectorization"""
        for user_id in user_ids:
            try:
                user_doc = self.db.users.find_one({"uid": user_id})
                
                if not user_doc:
                    logger.info(f"👤 No profile found for user {user_id}")
                    continue
                    
                logger.info(f"🔧 Fixing profile vectorization for user {user_id}")
                
                # Create comprehensive text representation
                text_content = self._format_user_profile(user_doc)
                
                # Create metadata with proper null handling
                metadata = {
                    "user_id": user_id,
                    "data_type": "profile",
                    "has_about_me": bool(user_doc.get("about_me")),
                    "created_at": datetime.now().isoformat()
                }
                
                # Only add fields if they're not null
                if user_doc.get("name"):
                    metadata["name"] = user_doc["name"]
                if user_doc.get("email"):
                    metadata["email"] = user_doc["email"]
                if user_doc.get("age") is not None:
                    metadata["age"] = user_doc["age"]
                if user_doc.get("gender"):
                    metadata["gender"] = user_doc["gender"]
                if user_doc.get("activity_level"):
                    metadata["activity_level"] = user_doc["activity_level"]
                if user_doc.get("height") is not None:
                    metadata["height"] = user_doc["height"]
                if user_doc.get("current_weight") is not None:
                    metadata["current_weight"] = user_doc["current_weight"]
                    
                if user_doc.get("created_at"):
                    created_at = user_doc["created_at"]
                    if isinstance(created_at, datetime):
                        metadata["account_created"] = created_at.isoformat()
                    else:
                        metadata["account_created"] = str(created_at)
                
                # Clean metadata
                metadata = self._clean_metadata(metadata)
                
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
                    
                logger.info(f"✅ Fixed profile vectorization for user {user_id}")
                        
            except Exception as e:
                logger.error(f"❌ Error fixing profile for user {user_id}: {e}")
    
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
        
        max_prep_time = dietary_prefs.get('max_prep_time')
        if max_prep_time is not None:
            text += f"Max Prep Time: {max_prep_time} minutes\n"
        
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
        if age is not None:
            text += f"Age: {age}\n"
        
        gender = user_doc.get("gender", "")
        if gender:
            text += f"Gender: {gender}\n"
        
        activity_level = user_doc.get("activity_level", "")
        if activity_level:
            text += f"Activity Level: {activity_level}\n"
        
        height = user_doc.get("height")
        if height is not None:
            text += f"Height: {height}\n"
        
        weight = user_doc.get("current_weight")
        if weight is not None:
            text += f"Current Weight: {weight} lbs\n"
        
        about_me = user_doc.get("about_me", "")
        if about_me:
            text += f"About Me: {about_me}\n"
        
        return text

async def main():
    """Main function to fix vectorization issues"""
    fixer = FixedVectorizer()
    await fixer.fix_remaining_vectorization()

if __name__ == "__main__":
    asyncio.run(main())
