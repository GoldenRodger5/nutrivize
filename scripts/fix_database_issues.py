#!/usr/bin/env python3
"""
Fix database issues that are causing the application errors:
1. Add missing serving_size and serving_unit fields to food items
2. Fix invalid goal_type values and clean up weight_target fields
"""

import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Add the backend directory to Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

def load_environment():
    """Load environment variables"""
    env_file = os.path.join(backend_dir, '.env.local')
    if os.path.exists(env_file):
        load_dotenv(env_file)
        print(f"✅ Loaded environment from {env_file}")
    else:
        print(f"❌ Environment file not found: {env_file}")
        return False
    return True

def get_mongodb_connection():
    """Get MongoDB connection"""
    mongodb_uri = os.getenv('MONGODB_URI') or os.getenv('MONGODB_URL')
    if not mongodb_uri:
        print("❌ MONGODB_URI or MONGODB_URL not found in environment variables")
        return None
    
    try:
        client = MongoClient(mongodb_uri)
        # Test connection
        client.admin.command('ping')
        print("✅ Connected to MongoDB")
        return client
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        return None

def fix_food_items(db):
    """Fix missing serving_size and serving_unit fields in food items"""
    print("\n🔧 Fixing food items...")
    
    foods_collection = db.foods
    
    # Find foods without serving_size or serving_unit
    foods_without_serving = list(foods_collection.find({
        "$or": [
            {"serving_size": {"$exists": False}},
            {"serving_unit": {"$exists": False}},
            {"serving_size": None},
            {"serving_unit": None}
        ]
    }))
    
    print(f"📊 Found {len(foods_without_serving)} food items needing fixes")
    
    if foods_without_serving:
        # Update foods without serving_size
        result = foods_collection.update_many(
            {"serving_size": {"$exists": False}},
            {"$set": {"serving_size": 1.0}}
        )
        print(f"✅ Added serving_size to {result.modified_count} foods")
        
        # Update foods with null serving_size
        result = foods_collection.update_many(
            {"serving_size": None},
            {"$set": {"serving_size": 1.0}}
        )
        print(f"✅ Fixed null serving_size in {result.modified_count} foods")
        
        # Update foods without serving_unit
        result = foods_collection.update_many(
            {"serving_unit": {"$exists": False}},
            {"$set": {"serving_unit": "serving"}}
        )
        print(f"✅ Added serving_unit to {result.modified_count} foods")
        
        # Update foods with null serving_unit
        result = foods_collection.update_many(
            {"serving_unit": None},
            {"$set": {"serving_unit": "serving"}}
        )
        print(f"✅ Fixed null serving_unit in {result.modified_count} foods")
        
        # Ensure nutrition field exists and has proper structure
        foods_without_nutrition = foods_collection.find({
            "$or": [
                {"nutrition": {"$exists": False}},
                {"nutrition": None}
            ]
        })
        
        default_nutrition = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0,
            "sugar": 0,
            "sodium": 0
        }
        
        for food in foods_without_nutrition:
            foods_collection.update_one(
                {"_id": food["_id"]},
                {"$set": {"nutrition": default_nutrition}}
            )
        
        print("✅ Fixed nutrition fields for foods missing them")
    else:
        print("✅ All food items have proper serving information")

def fix_goals(db):
    """Fix invalid goal_type values and weight_target fields"""
    print("\n🎯 Fixing goals...")
    
    goals_collection = db.goals
    
    # Find goals with invalid goal_type
    invalid_goals = list(goals_collection.find({
        "$or": [
            {"goal_type": "general"},
            {"goal_type": {"$nin": ["weight_loss", "weight_gain", "maintenance", "muscle_gain"]}}
        ]
    }))
    
    print(f"📊 Found {len(invalid_goals)} goals with invalid goal_type")
    
    if invalid_goals:
        # Fix invalid goal_type values
        result = goals_collection.update_many(
            {"goal_type": "general"},
            {"$set": {"goal_type": "maintenance"}}
        )
        print(f"✅ Fixed 'general' goal_type in {result.modified_count} goals")
        
        # Fix any other invalid goal types
        result = goals_collection.update_many(
            {"goal_type": {"$nin": ["weight_loss", "weight_gain", "maintenance", "muscle_gain"]}},
            {"$set": {"goal_type": "maintenance"}}
        )
        print(f"✅ Fixed other invalid goal_types in {result.modified_count} goals")
    
    # Find goals with invalid weight_target
    invalid_weight_targets = list(goals_collection.find({
        "$or": [
            {"weight_target": {}},
            {"weight_target.current_weight": {"$exists": False}},
            {"weight_target.target_weight": {"$exists": False}},
            {"weight_target.weekly_rate": {"$exists": False}},
            {"weight_target.current_weight": None},
            {"weight_target.target_weight": None},
            {"weight_target.weekly_rate": None}
        ]
    }))
    
    print(f"📊 Found {len(invalid_weight_targets)} goals with invalid weight_target")
    
    if invalid_weight_targets:
        # Remove invalid weight_target fields
        result = goals_collection.update_many(
            {
                "$or": [
                    {"weight_target": {}},
                    {"weight_target.current_weight": {"$exists": False}},
                    {"weight_target.target_weight": {"$exists": False}},
                    {"weight_target.weekly_rate": {"$exists": False}},
                    {"weight_target.current_weight": None},
                    {"weight_target.target_weight": None},
                    {"weight_target.weekly_rate": None}
                ]
            },
            {"$unset": {"weight_target": ""}}
        )
        print(f"✅ Removed invalid weight_target from {result.modified_count} goals")
    
    print("✅ Goals fixes completed")

def main():
    """Main function"""
    print("🚀 Starting database fixes...")
    
    if not load_environment():
        return False
    
    client = get_mongodb_connection()
    if not client:
        return False
    
    # Get database name from URI or use default
    db_name = os.getenv('MONGODB_DB_NAME', 'nutrivize')
    db = client[db_name]
    
    try:
        # Fix food items
        fix_food_items(db)
        
        # Fix goals
        fix_goals(db)
        
        print("\n🎉 Database fixes completed successfully!")
        print("✅ Your application should now run without the KeyError and validation errors")
        
    except Exception as e:
        print(f"\n❌ Error during database fixes: {e}")
        return False
    finally:
        client.close()
        print("🔌 MongoDB connection closed")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
