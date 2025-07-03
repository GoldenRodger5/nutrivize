from ..core.config import get_database
from ..models.goal import Goal, GoalCreate, GoalResponse, NutritionTargets, WeightTarget
from ..models.user import UserResponse
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from bson import ObjectId


class GoalsService:
    """Goals and preferences service"""
    
    def __init__(self):
        self.db = get_database()
        self.goals_collection = None
        
        if self.db is not None:
            self.goals_collection = self.db["goals"]
            # Create index for efficient queries
            try:
                self.goals_collection.create_index([("user_id", 1)])
            except:
                pass  # Index might already exist
        else:
            print("⚠️  GoalsService initialized without database connection")
    
    async def create_goal(self, goal_data: GoalCreate, user_id: str) -> GoalResponse:
        """Create a new goal for user (automatically deactivates other goals if this one is active)"""
        goal_dict = goal_data.dict()
        # Map is_active to active
        if 'is_active' in goal_dict:
            goal_dict['active'] = goal_dict.pop('is_active')
        
        # If this goal is being set as active, deactivate all other goals first
        if goal_dict.get('active', False):
            await self.deactivate_all_goals(user_id)
        
        goal = Goal(
            user_id=user_id,
            **goal_dict
        )
        
        goal_dict = goal.dict()
        # Convert dates to strings for MongoDB storage
        if 'start_date' in goal_dict and goal_dict['start_date']:
            goal_dict['start_date'] = goal_dict['start_date'].isoformat() if hasattr(goal_dict['start_date'], 'isoformat') else goal_dict['start_date']
        if 'end_date' in goal_dict and goal_dict['end_date']:
            goal_dict['end_date'] = goal_dict['end_date'].isoformat() if hasattr(goal_dict['end_date'], 'isoformat') else goal_dict['end_date']
        
        result = self.goals_collection.insert_one(goal_dict)
        
        response_data = goal_data.dict()
        if 'is_active' in response_data:
            response_data['active'] = response_data.pop('is_active')
        
        return GoalResponse(
            id=str(result.inserted_id),
            **response_data,
            created_at=goal.created_at
        )
    
    async def get_user_goals(self, user_id: str) -> List[GoalResponse]:
        """Get all goals for a user"""
        goals = list(self.goals_collection.find({
            "user_id": user_id
        }).sort("created_at", -1))
        
        goal_responses = []
        for goal in goals:
            # Convert date strings back to date objects if needed
            start_date = goal.get("start_date")
            if isinstance(start_date, str):
                try:
                    start_date = datetime.fromisoformat(start_date).date()
                except (ValueError, TypeError):
                    start_date = None
            
            end_date = goal.get("end_date")
            if isinstance(end_date, str):
                try:
                    end_date = datetime.fromisoformat(end_date).date()
                except (ValueError, TypeError):
                    end_date = None
            
            # Handle nutrition targets - make sure it's properly structured or None
            nutrition_targets = goal.get("nutrition_targets")
            if nutrition_targets and isinstance(nutrition_targets, dict):
                # Check if it has all required fields
                required_fields = ['calories', 'protein', 'carbs', 'fat']
                if all(field in nutrition_targets for field in required_fields):
                    # Valid nutrition targets - keep as is
                    pass
                else:
                    # Invalid or incomplete nutrition targets
                    nutrition_targets = None
            else:
                nutrition_targets = None
            
            goal_responses.append(GoalResponse(
                id=str(goal["_id"]),
                title=goal.get("title", "Untitled Goal"),
                goal_type=goal.get("goal_type", "maintenance"),
                start_date=start_date,
                end_date=end_date,
                active=goal.get("active", False),
                weight_target=goal.get("weight_target"),
                nutrition_targets=nutrition_targets,
                created_at=goal.get("created_at", datetime.utcnow())
            ))
        
        return goal_responses
    
    async def get_active_goal(self, user_id: str) -> Optional[GoalResponse]:
        """Get the current active goal for a user"""
        goal = self.goals_collection.find_one({
            "user_id": user_id,
            "active": True
        })
        
        if not goal:
            return None
        
        # Convert date strings back to date objects if needed
        start_date = goal.get("start_date")
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date).date()
        
        end_date = goal.get("end_date")
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date).date()
        
        return GoalResponse(
            id=str(goal["_id"]),
            title=goal["title"],
            goal_type=goal["goal_type"],
            start_date=start_date,
            end_date=end_date,
            active=goal["active"],
            weight_target=goal.get("weight_target"),
            nutrition_targets=goal["nutrition_targets"],
            created_at=goal["created_at"]
        )
    
    async def update_goal(self, goal_id: str, updates: dict, user_id: str) -> Optional[GoalResponse]:
        """Update a goal"""
        updates["updated_at"] = datetime.utcnow()
        
        result = self.goals_collection.update_one(
            {"_id": ObjectId(goal_id), "user_id": user_id},
            {"$set": updates}
        )
        
        if result.modified_count == 0:
            return None
        
        updated_goal = self.goals_collection.find_one({"_id": ObjectId(goal_id)})
        
        # Convert date strings back to date objects if needed
        start_date = updated_goal.get("start_date")
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date).date()
        
        end_date = updated_goal.get("end_date")
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date).date()
        
        return GoalResponse(
            id=str(updated_goal["_id"]),
            title=updated_goal["title"],
            goal_type=updated_goal["goal_type"],
            start_date=start_date,
            end_date=end_date,
            active=updated_goal["active"],
            weight_target=updated_goal.get("weight_target"),
            nutrition_targets=updated_goal["nutrition_targets"],
            created_at=updated_goal["created_at"]
        )
    
    async def deactivate_all_goals(self, user_id: str):
        """Deactivate all goals for a user (when setting a new active goal)"""
        self.goals_collection.update_many(
            {"user_id": user_id},
            {"$set": {"active": False}}
        )
    
    async def activate_goal(self, user_id: str, goal_id: str) -> Optional[GoalResponse]:
        """Activate a specific goal and deactivate all others"""
        try:
            # First deactivate all goals
            await self.deactivate_all_goals(user_id)
            
            # Then activate the specified goal
            result = self.goals_collection.update_one(
                {"_id": ObjectId(goal_id), "user_id": user_id},
                {"$set": {"active": True, "updated_at": datetime.utcnow()}}
            )
            
            if result.modified_count > 0:
                # Return the activated goal
                goals = await self.get_user_goals(user_id)
                for goal in goals:
                    if goal.id == goal_id:
                        return goal
            
            return None
            
        except Exception as e:
            return None

    async def calculate_nutrition_targets(self, user_data: dict) -> NutritionTargets:
        """Calculate nutrition targets based on user data and goal"""
        # Basic calculation using Mifflin-St Jeor equation
        age = user_data.get("age", 30)
        weight = user_data.get("weight", 70)  # kg
        height = user_data.get("height", 170)  # cm
        gender = user_data.get("gender", "male")
        activity_level = user_data.get("activity_level", "moderate")
        goal_type = user_data.get("goal_type", "maintenance")
        
        # Calculate BMR
        if gender == "male":
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
        else:
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
        
        # Activity multipliers
        activity_multipliers = {
            "sedentary": 1.2,
            "light": 1.375,
            "moderate": 1.55,
            "active": 1.725,
            "very_active": 1.9
        }
        
        # Calculate TDEE
        tdee = bmr * activity_multipliers.get(activity_level, 1.55)
        
        # Adjust for goal
        if goal_type == "weight_loss":
            calories = tdee - 500  # 1 lb per week deficit
        elif goal_type == "weight_gain":
            calories = tdee + 500  # 1 lb per week surplus
        else:
            calories = tdee
        
        # Calculate macros (moderate approach)
        protein = weight * 1.6  # 1.6g per kg bodyweight
        fat = calories * 0.25 / 9  # 25% of calories from fat
        carbs = (calories - (protein * 4) - (fat * 9)) / 4  # Remaining from carbs
        
        return NutritionTargets(
            calories=round(calories),
            protein=round(protein),
            carbs=round(carbs),
            fat=round(fat),
            fiber=round(calories / 100)  # Rough fiber estimate
        )
    
    async def get_active_goal_nutrition_targets(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get nutrition targets from the active goal"""
        active_goal = await self.get_active_goal(user_id)
        
        if not active_goal or not active_goal.nutrition_targets:
            return None
        
        return {
            "calories": active_goal.nutrition_targets.calories,
            "protein": active_goal.nutrition_targets.protein,
            "carbs": active_goal.nutrition_targets.carbs,
            "fat": active_goal.nutrition_targets.fat,
            "fiber": active_goal.nutrition_targets.fiber if hasattr(active_goal.nutrition_targets, 'fiber') else None
        }

    async def get_active_goal_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get goal context and preferences for AI enhancement"""
        active_goal = await self.get_active_goal(user_id)
        
        if not active_goal:
            return {}
        
        context = {
            "goal_type": active_goal.goal_type,
            "goal_context": self._get_goal_context_for_ai(active_goal),
            "nutrition_targets": await self.get_active_goal_nutrition_targets(user_id)
        }
        
        return context

    def _get_goal_context_for_ai(self, goal: GoalResponse) -> Dict[str, str]:
        """Get goal-specific context for AI meal suggestions"""
        goal_contexts = {
            "weight_loss": {
                "focus": "calorie management and satiety",
                "emphasize": "high-protein, high-fiber foods, lean proteins, vegetables",
                "avoid": "high-calorie dense foods, excessive fats"
            },
            "weight_gain": {
                "focus": "calorie-dense, nutritious foods",
                "emphasize": "healthy fats, complex carbs, protein-rich foods",
                "avoid": "empty calories, overly filling low-calorie foods"
            },
            "muscle_gain": {
                "focus": "protein optimization and muscle recovery",
                "emphasize": "high-quality proteins, post-workout nutrition, leucine-rich foods",
                "avoid": "excessive cardio-focused meals"
            },
            "maintenance": {
                "focus": "balanced nutrition and variety",
                "emphasize": "diverse nutrients, sustainable eating patterns",
                "avoid": "extreme restrictions"
            },
            "general_health": {
                "focus": "overall wellness and nutrition quality",
                "emphasize": "whole foods, micronutrient density, anti-inflammatory foods",
                "avoid": "processed foods, excessive sugar"
            }
        }
        
        return goal_contexts.get(goal.goal_type, goal_contexts["maintenance"])


# Global goals service instance
goals_service = GoalsService()
