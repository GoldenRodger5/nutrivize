#!/usr/bin/env python3
"""
Debug script to investigate the 2025-07-19 date issue specifically
"""

import asyncio
import os
from datetime import date, datetime
from typing import Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient

# Environment setup
os.environ.setdefault('ENVIRONMENT', 'local')

async def debug_date_issue():
    """Debug the specific date issue for 2025-07-19"""
    
    # Connect to MongoDB
    if os.getenv('ENVIRONMENT') == 'production':
        mongodb_uri = os.getenv('MONGODB_URI')
    else:
        mongodb_uri = "mongodb://localhost:27017"
    
    client = AsyncIOMotorClient(mongodb_uri)
    db = client.nutrivize
    
    # The problematic date and user (from logs)
    target_date = date(2025, 7, 19)
    # You may need to replace this with the actual user ID from the logs
    user_id = "test_user"  # Replace with actual user ID causing issues
    
    print(f"🔍 Debugging date issue for {target_date} and user {user_id}")
    
    # Check food logs for this date
    print(f"\n📅 Checking food logs for {target_date}...")
    food_logs = await db.food_logs.find({
        "user_id": user_id,
        "logged_date": target_date.isoformat()
    }).to_list(None)
    
    print(f"Found {len(food_logs)} food logs")
    for i, log in enumerate(food_logs):
        print(f"  Log {i+1}: {log.get('food_name', 'Unknown')} - {log.get('nutrition', {})}")
        
        # Check for problematic fields
        if 'nutrition' in log:
            nutrition = log['nutrition']
            for key, value in nutrition.items():
                if value is None:
                    print(f"    ⚠️  Null value for {key}")
                elif isinstance(value, str) and not value.strip():
                    print(f"    ⚠️  Empty string for {key}")
                elif isinstance(value, (int, float)) and (value < 0 or value > 10000):
                    print(f"    ⚠️  Suspicious value for {key}: {value}")
    
    # Check water logs for this date
    print(f"\n💧 Checking water logs for {target_date}...")
    water_logs = await db.water_logs.find({
        "user_id": user_id,
        "logged_date": target_date.isoformat()
    }).to_list(None)
    
    print(f"Found {len(water_logs)} water logs")
    for i, log in enumerate(water_logs):
        print(f"  Water Log {i+1}: {log.get('amount', 0)}oz")
        
        # Check for problematic fields
        amount = log.get('amount')
        if amount is None:
            print(f"    ⚠️  Null amount")
        elif isinstance(amount, str):
            print(f"    ⚠️  String amount: '{amount}'")
        elif amount < 0 or amount > 200:
            print(f"    ⚠️  Suspicious amount: {amount}")
    
    # Check goals for this user
    print(f"\n🎯 Checking goals for user {user_id}...")
    goals = await db.goals.find({
        "user_id": user_id
    }).to_list(None)
    
    print(f"Found {len(goals)} goals")
    for i, goal in enumerate(goals):
        print(f"  Goal {i+1}: Type={goal.get('goal_type')}, Status={goal.get('status')}")
        
        # Check for problematic fields
        goal_type = goal.get('goal_type')
        if goal_type not in ['weight_loss', 'weight_gain', 'muscle_gain', 'maintenance']:
            print(f"    ⚠️  Invalid goal_type: {goal_type}")
        
        if 'weight_target' in goal:
            weight_target = goal['weight_target']
            if not isinstance(weight_target, dict):
                print(f"    ⚠️  Invalid weight_target type: {type(weight_target)}")
            elif 'value' not in weight_target or 'unit' not in weight_target:
                print(f"    ⚠️  Incomplete weight_target: {weight_target}")
        
        if 'nutrition_targets' in goal:
            nutrition_targets = goal['nutrition_targets']
            if not isinstance(nutrition_targets, dict):
                print(f"    ⚠️  Invalid nutrition_targets type: {type(nutrition_targets)}")
    
    # Close connection
    client.close()
    print(f"\n✅ Debug completed for {target_date}")

if __name__ == "__main__":
    asyncio.run(debug_date_issue())
