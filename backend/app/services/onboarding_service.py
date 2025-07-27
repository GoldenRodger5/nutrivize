from typing import Dict, Any, List, Optional
from datetime import datetime
import math

from ..core.config import get_database
from ..models.user import (
    OnboardingBasicProfile,
    OnboardingHealthGoals,
    OnboardingNutritionTargets,
    OnboardingAppPreferences,
    OnboardingCompleteRequest
)


class OnboardingService:
    """Service for handling user onboarding process"""
    
    def __init__(self):
        self.db = get_database()
        if self.db is not None:
            self.users_collection = self.db["users"]
        else:
            self.users_collection = None
            print("⚠️  OnboardingService initialized without database connection")
    
    async def start_onboarding(self, user_id: str) -> Dict[str, Any]:
        """Initialize onboarding for a user"""
        try:
            update_data = {
                "onboarding_completed": False,
                "onboarding_step": 1,
                "updated_at": datetime.utcnow()
            }
            
            result = self.users_collection.update_one(
                {"uid": user_id},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                raise ValueError("User not found")
            
            return {"current_step": 1}
        except Exception as e:
            raise ValueError(f"Failed to start onboarding: {str(e)}")
    
    async def get_onboarding_status(self, user_id: str) -> Dict[str, Any]:
        """Get current onboarding status"""
        try:
            user_doc = self.users_collection.find_one({"uid": user_id})
            if not user_doc:
                raise ValueError("User not found")
            
            # Calculate profile completeness
            completeness_score = self._calculate_profile_completeness(user_doc)
            
            # Determine completed steps and next step
            completed_steps = self._get_completed_steps(user_doc)
            next_step = self._get_next_step(completed_steps, user_doc.get("onboarding_completed", False))
            
            return {
                "onboarding_completed": user_doc.get("onboarding_completed", False),
                "current_step": user_doc.get("onboarding_step"),
                "profile_completeness_score": completeness_score,
                "completed_steps": completed_steps,
                "next_step": next_step
            }
        except Exception as e:
            raise ValueError(f"Failed to get onboarding status: {str(e)}")
    
    async def save_step_data(self, user_id: str, step: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Save data for a specific onboarding step"""
        try:
            # Validate and process step data based on step number
            processed_data = self._process_step_data(step, data)
            
            # Update user document
            update_data = {
                **processed_data,
                "onboarding_step": max(step + 1, 6),  # Move to next step, max 6
                "updated_at": datetime.utcnow()
            }
            
            result = self.users_collection.update_one(
                {"uid": user_id},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                raise ValueError("User not found")
            
            # Get updated user for completeness calculation
            user_doc = self.users_collection.find_one({"uid": user_id})
            completeness_score = self._calculate_profile_completeness(user_doc)
            
            # Update completeness score
            self.users_collection.update_one(
                {"uid": user_id},
                {"$set": {"profile_completeness_score": completeness_score}}
            )
            
            return {
                "current_step": update_data["onboarding_step"],
                "profile_completeness_score": completeness_score
            }
        except Exception as e:
            raise ValueError(f"Failed to save step data: {str(e)}")
    
    async def complete_onboarding(self, user_id: str, onboarding_data: OnboardingCompleteRequest) -> Dict[str, Any]:
        """Complete onboarding with all collected data"""
        try:
            # Prepare update data
            update_data = {
                "onboarding_completed": True,
                "onboarding_step": 6,  # Final step
                "updated_at": datetime.utcnow()
            }
            
            # Process basic profile
            if onboarding_data.basic_profile:
                profile_data = onboarding_data.basic_profile.dict(exclude_none=True)
                update_data.update(profile_data)
            
            # Process health goals
            if onboarding_data.health_goals:
                goals_data = onboarding_data.health_goals.dict(exclude_none=True)
                update_data.update(goals_data)
            
            # Process nutrition targets
            if onboarding_data.nutrition_targets:
                nutrition_data = onboarding_data.nutrition_targets.dict(exclude_none=True)
                update_data.update(nutrition_data)
            
            # Process app preferences
            if onboarding_data.app_preferences:
                app_prefs = onboarding_data.app_preferences.dict(exclude_none=True)
                # Store app preferences in the preferences object
                if "preferences" not in update_data:
                    update_data["preferences"] = {}
                update_data["preferences"]["app"] = app_prefs
            
            # Calculate final completeness score
            user_doc = self.users_collection.find_one({"uid": user_id})
            if user_doc:
                # Merge current data with update data for completeness calculation
                merged_data = {**user_doc, **update_data}
                completeness_score = self._calculate_profile_completeness(merged_data)
                update_data["profile_completeness_score"] = completeness_score
            
            # Update user document
            result = self.users_collection.update_one(
                {"uid": user_id},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                raise ValueError("User not found")
            
            # Get updated user profile
            updated_user = self.users_collection.find_one({"uid": user_id})
            
            return {
                "profile_completeness_score": update_data.get("profile_completeness_score", 0),
                "user_profile": self._clean_user_profile(updated_user)
            }
        except Exception as e:
            raise ValueError(f"Failed to complete onboarding: {str(e)}")
    
    async def skip_onboarding(self, user_id: str) -> Dict[str, Any]:
        """Skip onboarding with minimal setup"""
        try:
            update_data = {
                "onboarding_completed": True,
                "onboarding_step": 6,
                "profile_completeness_score": 20,  # Minimal score for skipped onboarding
                "updated_at": datetime.utcnow()
            }
            
            result = self.users_collection.update_one(
                {"uid": user_id},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                raise ValueError("User not found")
            
            return {"profile_completeness_score": 20}
        except Exception as e:
            raise ValueError(f"Failed to skip onboarding: {str(e)}")
    
    async def get_recommendations(self, user_id: str) -> Dict[str, Any]:
        """Get personalized recommendations based on current profile"""
        try:
            user_doc = self.users_collection.find_one({"uid": user_id})
            if not user_doc:
                raise ValueError("User not found")
            
            recommendations = {
                "next_steps": [],
                "calorie_recommendation": None,
                "suggested_goals": [],
                "feature_highlights": []
            }
            
            # Analyze profile and provide recommendations
            if not user_doc.get("age"):
                recommendations["next_steps"].append("Complete your basic profile for better AI recommendations")
            
            if not user_doc.get("health_goals"):
                recommendations["suggested_goals"] = ["lose_weight", "gain_muscle", "improve_health"]
            
            if not user_doc.get("daily_calorie_goal"):
                recommendations["next_steps"].append("Set up your daily calorie goal")
            
            # Feature highlights based on profile
            if user_doc.get("health_goals"):
                if "lose_weight" in user_doc["health_goals"]:
                    recommendations["feature_highlights"].append("AI Meal Planning for Weight Loss")
                if "gain_muscle" in user_doc["health_goals"]:
                    recommendations["feature_highlights"].append("High-Protein Food Tracking")
            
            return recommendations
        except Exception as e:
            raise ValueError(f"Failed to get recommendations: {str(e)}")
    
    async def calculate_calorie_needs(self, user_id: str, basic_profile: OnboardingBasicProfile, health_goals: OnboardingHealthGoals) -> Dict[str, Any]:
        """Calculate recommended daily calories using Mifflin-St Jeor equation"""
        try:
            if not all([basic_profile.age, basic_profile.gender, basic_profile.height, basic_profile.current_weight]):
                raise ValueError("Age, gender, height, and weight are required for calorie calculation")
            
            # Mifflin-St Jeor Equation for BMR
            if basic_profile.gender.lower() == "male":
                bmr = 10 * basic_profile.current_weight + 6.25 * basic_profile.height - 5 * basic_profile.age + 5
            else:  # female or other
                bmr = 10 * basic_profile.current_weight + 6.25 * basic_profile.height - 5 * basic_profile.age - 161
            
            # Activity level multipliers
            activity_multipliers = {
                "sedentary": 1.2,
                "lightly_active": 1.375,
                "moderately_active": 1.55,
                "very_active": 1.725,
                "extremely_active": 1.9
            }
            
            activity_multiplier = activity_multipliers.get(basic_profile.activity_level, 1.55)
            tdee = bmr * activity_multiplier
            
            # Adjust for goals
            adjustment_factor = 1.0
            explanation = f"Maintenance calories: {int(tdee)}"
            
            if health_goals.health_goals:
                if "lose_weight" in health_goals.health_goals:
                    adjustment_factor = 0.8  # 20% deficit
                    explanation = f"Weight loss calories (20% deficit): {int(tdee * adjustment_factor)}"
                elif "gain_muscle" in health_goals.health_goals:
                    adjustment_factor = 1.1  # 10% surplus
                    explanation = f"Muscle gain calories (10% surplus): {int(tdee * adjustment_factor)}"
            
            daily_calories = int(tdee * adjustment_factor)
            
            return {
                "bmr": int(bmr),
                "tdee": int(tdee),
                "daily_calories": daily_calories,
                "adjustment_factor": adjustment_factor,
                "explanation": explanation
            }
        except Exception as e:
            raise ValueError(f"Failed to calculate calories: {str(e)}")
    
    def _process_step_data(self, step: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process and validate step data"""
        processed_data = {}
        
        if step == 1:  # Basic Profile
            allowed_fields = ["age", "gender", "height", "current_weight", "activity_level"]
            for field in allowed_fields:
                if field in data:
                    processed_data[field] = data[field]
        
        elif step == 2:  # Health Goals
            allowed_fields = ["health_goals", "target_weight", "timeline"]
            for field in allowed_fields:
                if field in data:
                    processed_data[field] = data[field]
        
        elif step == 3:  # Dietary Preferences
            if "dietary_preferences" in data:
                if "preferences" not in processed_data:
                    processed_data["preferences"] = {}
                processed_data["preferences"]["dietary"] = data["dietary_preferences"]
        
        elif step == 4:  # Nutrition Targets
            allowed_fields = ["daily_calorie_goal", "protein_percent", "carbs_percent", "fat_percent", "meal_frequency"]
            for field in allowed_fields:
                if field in data:
                    processed_data[field] = data[field]
        
        elif step == 5:  # App Preferences
            if "app_preferences" in data:
                if "preferences" not in processed_data:
                    processed_data["preferences"] = {}
                processed_data["preferences"]["app"] = data["app_preferences"]
        
        return processed_data
    
    def _calculate_profile_completeness(self, user_doc: Dict[str, Any]) -> int:
        """Calculate profile completeness score (0-100)"""
        score = 0
        
        # Basic info (40 points total)
        if user_doc.get("name"):
            score += 5
        if user_doc.get("age"):
            score += 8
        if user_doc.get("gender"):
            score += 7
        if user_doc.get("height"):
            score += 10
        if user_doc.get("current_weight"):
            score += 10
        
        # Activity and goals (30 points total)
        if user_doc.get("activity_level"):
            score += 10
        if user_doc.get("health_goals"):
            score += 15
        if user_doc.get("daily_calorie_goal"):
            score += 5
        
        # Preferences (30 points total)
        preferences = user_doc.get("preferences", {})
        if preferences.get("dietary"):
            score += 15
        if preferences.get("app"):
            score += 10
        if user_doc.get("target_weight"):
            score += 5
        
        return min(score, 100)
    
    def _get_completed_steps(self, user_doc: Dict[str, Any]) -> List[int]:
        """Determine which onboarding steps are completed"""
        completed = []
        
        # Step 1: Basic Profile
        if user_doc.get("age") and user_doc.get("gender") and user_doc.get("height") and user_doc.get("current_weight"):
            completed.append(1)
        
        # Step 2: Health Goals
        if user_doc.get("health_goals"):
            completed.append(2)
        
        # Step 3: Dietary Preferences
        if user_doc.get("preferences", {}).get("dietary"):
            completed.append(3)
        
        # Step 4: Nutrition Targets
        if user_doc.get("daily_calorie_goal"):
            completed.append(4)
        
        # Step 5: App Preferences
        if user_doc.get("preferences", {}).get("app"):
            completed.append(5)
        
        return completed
    
    def _get_next_step(self, completed_steps: List[int], onboarding_completed: bool) -> Optional[int]:
        """Determine the next step in onboarding"""
        if onboarding_completed:
            return None
        
        for step in range(1, 6):
            if step not in completed_steps:
                return step
        
        return 6  # Completion step
    
    def _clean_user_profile(self, user_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Clean user profile for response"""
        if not user_doc:
            return {}
        
        return {
            "uid": user_doc.get("uid"),
            "email": user_doc.get("email"),
            "name": user_doc.get("name"),
            "age": user_doc.get("age"),
            "gender": user_doc.get("gender"),
            "height": user_doc.get("height"),
            "current_weight": user_doc.get("current_weight"),
            "activity_level": user_doc.get("activity_level"),
            "health_goals": user_doc.get("health_goals", []),
            "target_weight": user_doc.get("target_weight"),
            "daily_calorie_goal": user_doc.get("daily_calorie_goal"),
            "preferences": user_doc.get("preferences", {}),
            "onboarding_completed": user_doc.get("onboarding_completed", False),
            "profile_completeness_score": user_doc.get("profile_completeness_score", 0)
        }


# Global service instance
onboarding_service = OnboardingService()
