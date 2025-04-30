from typing import List, Dict, Optional, Any

async def get_user_goals(db, user_id: str) -> Dict[str, Any]:
    """
    Get user's goals from the database.
    
    Args:
        db: Database connection
        user_id: User ID
        
    Returns:
        Dictionary containing user's goals
    """
    # Import get_user_active_goal to avoid circular imports
    from .models import get_user_active_goal
    
    try:
        # Get active goal for the user
        active_goal = get_user_active_goal(user_id)
        
        if not active_goal:
            return {
                "has_goals": False,
                "message": "No active goals found"
            }
            
        # Convert ObjectId to string for serialization
        if "_id" in active_goal:
            active_goal["_id"] = str(active_goal["_id"])
            
        return {
            "has_goals": True,
            "active_goal": active_goal
        }
    except Exception as e:
        print(f"Error getting user goals: {str(e)}")
        return {
            "has_goals": False,
            "error": str(e)
        } 