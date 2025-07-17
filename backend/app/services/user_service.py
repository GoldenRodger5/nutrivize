from ..core.config import get_database
from ..models.user import User, UserCreate, UserResponse, UserLogin, UserRegister, AuthResponse
from ..core.firebase import firebase_manager
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId


class UserService:
    """User service for managing user operations"""
    
    def __init__(self):
        self.db = get_database()
        if self.db is not None:
            self.users_collection = self.db["users"]
        else:
            self.users_collection = None
            print("⚠️  UserService initialized without database connection")
    
    async def register_user(self, register_data: UserRegister) -> UserResponse:
        """Register a new user with email/password"""
        try:
            # Create Firebase user
            firebase_user = firebase_manager.create_user(
                email=register_data.email,
                password=register_data.password,
                name=register_data.name
            )
            
            # Create user in our database
            user_create = UserCreate(
                email=register_data.email,
                name=register_data.name
            )
            
            backend_user = await self.create_user(user_create, firebase_user["uid"])
            
            return backend_user
            
        except Exception as e:
            raise ValueError(f"Registration failed: {str(e)}")
    
    async def login_user(self, login_data: UserLogin) -> AuthResponse:
        """Login user with email/password and return ID token"""
        try:
            # Login with Firebase REST API to get ID token
            firebase_result = firebase_manager.login_with_email_password(
                login_data.email, 
                login_data.password
            )
            
            # Get user from our database
            backend_user = await self.get_user_by_uid(firebase_result["uid"])
            if not backend_user:
                # Auto-create user if they exist in Firebase but not in our DB
                user_create = UserCreate(
                    email=firebase_result["email"],
                    name=""
                )
                backend_user = await self.create_user(user_create, firebase_result["uid"])
            
            return AuthResponse(
                user=backend_user,
                token=firebase_result["id_token"],
                message="Login successful"
            )
            
        except Exception as e:
            raise ValueError(f"Login failed: {str(e)}")
    
    async def create_user(self, user_data: UserCreate, uid: str) -> UserResponse:
        """Create a new user"""
        # Check if user already exists
        existing_user = self.users_collection.find_one({"uid": uid})
        if existing_user:
            raise ValueError("User already exists")
        
        # Create user document
        user = User(
            uid=uid,
            email=user_data.email,
            name=user_data.name,
            preferences=user_data.preferences or {}
        )
        
        user_dict = user.dict()
        result = self.users_collection.insert_one(user_dict)
        
        return UserResponse(
            uid=user.uid,
            email=user.email,
            name=user.name,
            preferences=user.preferences
        )
    
    async def get_user_by_uid(self, uid: str) -> Optional[UserResponse]:
        """Get user by Firebase UID"""
        user_doc = self.users_collection.find_one({"uid": uid})
        if not user_doc:
            return None
        
        return UserResponse(
            uid=user_doc["uid"],
            email=user_doc["email"],
            name=user_doc["name"],
            preferences=user_doc.get("preferences", {})
        )
    
    async def get_user_document_by_uid(self, uid: str) -> Optional[Dict[str, Any]]:
        """Get raw user document by Firebase UID"""
        try:
            if self.users_collection is None:
                print("⚠️  Users collection is None")
                return None
            
            user_doc = self.users_collection.find_one({"uid": uid})
            return user_doc
        except Exception as e:
            print(f"❌ Error getting user document: {str(e)}")
            return None
    
    async def update_user_data(self, uid: str, data_update: Dict[str, Any]) -> bool:
        """Update user data directly in the document"""
        try:
            from datetime import datetime
            
            # Add timestamp
            data_update["updated_at"] = datetime.utcnow()
            
            # Update in database
            result = self.users_collection.update_one(
                {"uid": uid},
                {"$set": data_update}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            raise ValueError(f"Failed to update user data: {str(e)}")
    
    async def add_to_recent_foods_from_log(self, uid: str, food_id: str, food_name: str, 
                                         amount: float, unit: str, nutrition: Dict[str, Any]) -> None:
        """Add food to recent foods when it's logged"""
        try:
            from datetime import datetime, timedelta
            
            # Get current user data
            user_data = self.users_collection.find_one({"uid": uid})
            if not user_data:
                return
            
            # Get existing recent foods
            recent_foods = user_data.get("recent_foods", [])
            
            # Create new recent food entry
            new_recent_food = {
                "food_id": food_id,
                "food_name": food_name,
                "quantity": amount,
                "unit": unit,
                "calories": nutrition.get("calories", 0),
                "protein": nutrition.get("protein", 0),
                "carbs": nutrition.get("carbs", 0),
                "fat": nutrition.get("fat", 0),
                "fiber": nutrition.get("fiber", 0),
                "sugar": nutrition.get("sugar", 0),
                "sodium": nutrition.get("sodium", 0),
                "last_used": datetime.utcnow()
            }
            
            # Remove if already exists (to update timestamp)
            recent_foods = [f for f in recent_foods if f["food_id"] != food_id]
            
            # Add to beginning of list
            recent_foods.insert(0, new_recent_food)
            
            # Keep only last 20 items
            recent_foods = recent_foods[:20]
            
            # Clean up old entries (older than 5 days)
            five_days_ago = datetime.utcnow() - timedelta(days=5)
            cleaned_foods = []
            for food in recent_foods:
                try:
                    last_used = food.get("last_used")
                    if isinstance(last_used, datetime):
                        # Already a datetime object
                        last_used_dt = last_used
                    elif isinstance(last_used, str):
                        # Parse string datetime
                        last_used_dt = datetime.fromisoformat(last_used.replace("Z", "+00:00"))
                    else:
                        # Skip invalid entries
                        continue
                    
                    if last_used_dt > five_days_ago:
                        cleaned_foods.append(food)
                except Exception:
                    # Skip invalid entries
                    continue
            
            # Update user document
            self.users_collection.update_one(
                {"uid": uid},
                {"$set": {"recent_foods": cleaned_foods, "updated_at": datetime.utcnow()}}
            )
            
        except Exception as e:
            # Log error but don't fail the food logging
            print(f"Error adding to recent foods: {str(e)}")
            pass
        
    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """Get user by MongoDB ObjectId"""
        try:
            user_doc = self.users_collection.find_one({"_id": ObjectId(user_id)})
            if not user_doc:
                return None
                
            return UserResponse(
                uid=user_doc["uid"],
                email=user_doc["email"],
                name=user_doc["name"],
                preferences=user_doc.get("preferences", {})
            )
        except Exception:
            return None
        
        return await self.get_user_by_uid(uid)
    
    async def update_user(self, uid: str, updates: dict) -> Optional[UserResponse]:
        """Update user information"""
        updates["updated_at"] = datetime.utcnow()
        
        result = self.users_collection.update_one(
            {"uid": uid},
            {"$set": updates}
        )
        
        if result.modified_count == 0:
            return None
        
        return await self.get_user_by_uid(uid)
    
    async def verify_token_and_get_user(self, token: str) -> UserResponse:
        """Verify Firebase token and return user"""
        try:
            # Verify token with Firebase
            user_info = firebase_manager.verify_token(token)
            uid = user_info["uid"]
            
            # Get user from database
            user = await self.get_user_by_uid(uid)
            if not user:
                # Auto-create user with minimal info
                user_create = UserCreate(
                    email=user_info.get("email", ""),
                    name=""  # Will be empty, indicating incomplete registration
                )
                user = await self.create_user(user_create, uid)
            
            return user
            
        except Exception as e:
            raise ValueError(f"Authentication failed: {str(e)}")
    
    async def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get user preferences"""
        try:
            user = await self.get_user_by_uid(user_id)
            if not user:
                return {}
                
            return user.preferences or {}
            
        except Exception as e:
            raise ValueError(f"Failed to get user preferences: {str(e)}")
    
    async def update_user_preferences(self, user_id: str, preferences_update: Dict[str, Any]) -> Dict[str, Any]:
        """Update user preferences"""
        try:
            from datetime import datetime
            
            # Get existing preferences
            existing_preferences = await self.get_user_preferences(user_id) or {}
            
            # Ensure existing_preferences is a dict
            if not isinstance(existing_preferences, dict):
                existing_preferences = {}
            
            # Merge with updates
            updated_preferences = existing_preferences.copy()
            for key, value in preferences_update.items():
                if key in ["dietary", "nutrition", "app"]:
                    if key not in updated_preferences:
                        updated_preferences[key] = {}
                    if isinstance(updated_preferences[key], dict):
                        updated_preferences[key].update(value)
                    else:
                        updated_preferences[key] = value
                else:
                    updated_preferences[key] = value
            
            # Add timestamp
            updated_preferences["updated_at"] = datetime.now().isoformat()
            
            # Update in database
            result = self.users_collection.update_one(
                {"uid": user_id},
                {"$set": {"preferences": updated_preferences}}
            )
            
            if result.modified_count == 0:
                raise ValueError("User not found or no changes made")
            
            return updated_preferences
            
        except Exception as e:
            raise ValueError(f"Failed to update user preferences: {str(e)}")

    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get complete user profile including preferences"""
        try:
            user_doc = self.users_collection.find_one({"uid": user_id})
            if not user_doc:
                return None
            
            # Remove sensitive fields
            profile = {
                "uid": user_doc["uid"],
                "email": user_doc["email"],
                "name": user_doc.get("name", ""),
                "about_me": user_doc.get("about_me", ""),
                "created_at": user_doc.get("created_at", None),
                "last_active": user_doc.get("last_active", None),
                "preferences": user_doc.get("preferences", {}),
                "profile_complete": bool(user_doc.get("name"))  # Check if registration is complete
            }
            
            return profile
            
        except Exception as e:
            raise ValueError(f"Failed to get user profile: {str(e)}")

    async def update_user_profile(self, user_id: str, profile_update: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile information"""
        try:
            from datetime import datetime
            
            # Allowed fields to update
            allowed_fields = ["name", "email", "about_me"]
            update_data = {k: v for k, v in profile_update.items() if k in allowed_fields}
            
            if not update_data:
                raise ValueError("No valid fields to update")
            
            # Add last_active timestamp
            update_data["last_active"] = datetime.now()
            
            # Update in database
            result = self.users_collection.update_one(
                {"uid": user_id},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                raise ValueError("User not found or no changes made")
            
            # Return updated profile
            return await self.get_user_profile(user_id)
            
        except Exception as e:
            raise ValueError(f"Failed to update user profile: {str(e)}")

    async def delete_user_data(self, user_id: str) -> bool:
        """Delete all user data (GDPR compliance)"""
        try:
            # This would delete user data from all collections
            # For now, just delete the user record
            result = self.users_collection.delete_one({"uid": user_id})
            
            # In a full implementation, we'd also delete:
            # - Food logs
            # - Goals
            # - Cached insights
            # - Any other user-related data
            
            return result.deleted_count > 0
            
        except Exception as e:
            raise ValueError(f"Failed to delete user data: {str(e)}")

    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user statistics (for profile/dashboard)"""
        try:
            # This would calculate various user stats
            # For now, return basic placeholder stats
            return {
                "total_food_logs": 0,  # Would query food_logs collection
                "days_active": 0,      # Would calculate based on food_logs dates
                "goals_set": 0,        # Would query goals collection
                "insights_generated": 0, # Would query insights cache
                "account_age_days": 0   # Would calculate from created_at
            }
            
        except Exception as e:
            raise ValueError(f"Failed to get user stats: {str(e)}")


# Global user service instance
user_service = UserService()
