#!/usr/bin/env python3
"""
Test script to check if the API endpoints are working correctly
"""

import sys
import os
sys.path.append('/Users/isaacmineo/Main/projects/nutrivize-v2/backend')

from app.core.config import get_database
from app.services.goals_service import GoalsService
from app.services.food_log_service import FoodLogService
from datetime import date

async def test_services():
    user_id = "GME7nGpJQRc2v9T057vJ4oyqAJN2"
    
    print("=== Testing Backend Services ===")
    print(f"User ID: {user_id}")
    print()
    
    # Test goals service
    print("1. Testing Goals Service...")
    goals_service = GoalsService()
    try:
        goals = await goals_service.get_user_goals(user_id)
        print(f"✅ Found {len(goals)} goals")
        
        active_goal = await goals_service.get_active_goal(user_id)
        if active_goal:
            print(f"✅ Active goal: {active_goal.title} ({active_goal.nutrition_targets})")
        else:
            print("❌ No active goal found")
    except Exception as e:
        print(f"❌ Goals service error: {e}")
    
    print()
    
    # Test food logs service
    print("2. Testing Food Logs Service...")
    food_log_service = FoodLogService()
    try:
        test_date = date(2024, 6, 30)  # Date with data
        daily_summary = await food_log_service.get_daily_logs(user_id, test_date)
        print(f"✅ Daily logs for {test_date}: {len(daily_summary.meals)} meals")
        if daily_summary.total_nutrition:
            print(f"   Total calories: {daily_summary.total_nutrition.calories}")
        
        # Test with goals
        daily_with_goals = await food_log_service.get_daily_logs_with_goal_progress(user_id, test_date)
        print(f"✅ Daily logs with goals: {type(daily_with_goals)}")
        
    except Exception as e:
        print(f"❌ Food logs service error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_services())
