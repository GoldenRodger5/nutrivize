#!/usr/bin/env python3
"""
Check MongoDB Atlas connection and inspect database contents
"""

import os
import sys
from pymongo import MongoClient
from bson import ObjectId
import json
from datetime import datetime

def check_mongodb_atlas():
    """Check MongoDB Atlas connection and inspect collections"""
    
    print("🔍 Checking MongoDB Atlas Connection...")
    
    # Get MongoDB URI from environment or use default
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb+srv://isaacmineo:Buddydog41@nutrivize.oc0v0.mongodb.net/nutrivize?retryWrites=true&w=majority")
    
    try:
        # Connect to MongoDB Atlas
        client = MongoClient(mongodb_uri)
        db = client.nutrivize
        
        print("✅ Connected to MongoDB Atlas")
        
        # List all collections
        collections = db.list_collection_names()
        print(f"📋 Collections found: {collections}")
        
        # Check meal plans
        print("\n🍽️ Checking meal_plans collection...")
        meal_plans = db.meal_plans.find().limit(5)
        meal_plan_count = db.meal_plans.count_documents({})
        print(f"📊 Total meal plans: {meal_plan_count}")
        
        if meal_plan_count > 0:
            print("\n📋 Sample meal plans:")
            for i, plan in enumerate(meal_plans):
                plan['_id'] = str(plan['_id'])  # Convert ObjectId to string
                print(f"  {i+1}. Plan ID: {plan.get('plan_id', 'No ID')}")
                print(f"     Name: {plan.get('name', 'Unnamed')}")
                print(f"     User ID: {plan.get('user_id', 'No user')}")
                print(f"     Days: {plan.get('total_days', 0)}")
                print(f"     Target Nutrition: {plan.get('target_nutrition', {})}")
                print(f"     Created: {plan.get('created_at', 'Unknown')}")
                print(f"     Is Current Version: {plan.get('is_current_version', False)}")
                print()
        
        # Check foods collection
        print("\n🥗 Checking foods collection...")
        foods_count = db.foods.count_documents({})
        print(f"📊 Total foods: {foods_count}")
        
        if foods_count > 0:
            sample_foods = db.foods.find().limit(3)
            print("\n📋 Sample foods:")
            for i, food in enumerate(sample_foods):
                food['_id'] = str(food['_id'])
                print(f"  {i+1}. Name: {food.get('name', 'Unknown')}")
                print(f"     Calories: {food.get('calories', 0)} per {food.get('serving_size', '100g')}")
                print(f"     Protein: {food.get('proteins', food.get('protein', 0))}g")
                print()
        
        # Check users collection
        print("\n👤 Checking users collection...")
        users_count = db.users.count_documents({})
        print(f"📊 Total users: {users_count}")
        
        # Check for specific user
        test_user = db.users.find_one({"email": "IsaacMineo@gmail.com"})
        if test_user:
            print(f"✅ Found test user: {test_user.get('email')}")
            print(f"   User ID: {test_user.get('uid', test_user.get('_id'))}")
        else:
            print("❌ Test user not found")
            
        # Check shopping_lists collection
        print("\n🛒 Checking shopping_lists collection...")
        shopping_count = db.shopping_lists.count_documents({})
        print(f"📊 Total shopping lists: {shopping_count}")
        
        if shopping_count > 0:
            sample_shopping = db.shopping_lists.find().limit(2)
            print("\n📋 Sample shopping lists:")
            for i, shop_list in enumerate(sample_shopping):
                shop_list['_id'] = str(shop_list['_id'])
                print(f"  {i+1}. Plan ID: {shop_list.get('plan_id', 'No ID')}")
                print(f"     Items: {len(shop_list.get('items', []))}")
                print(f"     Total Cost: ${shop_list.get('total_estimated_cost', 0):.2f}")
                print(f"     Created: {shop_list.get('created_at', 'Unknown')}")
                print()
        
        # Test a food search query
        print("\n🔍 Testing food search...")
        search_results = list(db.foods.find(
            {"$text": {"$search": "chicken"}}, 
            {"name": 1, "calories": 1, "proteins": 1, "protein": 1}
        ).limit(3))
        
        if search_results:
            print("✅ Food search working:")
            for food in search_results:
                print(f"  - {food.get('name', 'Unknown')}: {food.get('calories', 0)} cal, {food.get('proteins', food.get('protein', 0))}g protein")
        else:
            print("❌ No food search results found")
            
        client.close()
        
    except Exception as e:
        print(f"❌ MongoDB Atlas connection failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    check_mongodb_atlas()
